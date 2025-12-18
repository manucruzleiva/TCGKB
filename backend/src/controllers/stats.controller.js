import CardCache from '../models/CardCache.js'
import Comment from '../models/Comment.js'
import Reaction from '../models/Reaction.js'
import User from '../models/User.js'
import log from '../utils/logger.js'

const MODULE = 'StatsController'

// GitHub repo info
const GITHUB_OWNER = 'manucruzleiva'
const GITHUB_REPO = 'TCGKB'

// Simple in-memory cache for GitHub commits (1 hour TTL) - per branch
const commitsCache = {
  main: { data: null, timestamp: 0 },
  stage: { data: null, timestamp: 0 }
}
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Get platform statistics
 */
export const getStats = async (req, res) => {
  try {
    const [totalCards, totalComments, totalReactions, totalUsers] = await Promise.all([
      CardCache.countDocuments(),
      Comment.countDocuments({ isModerated: false }),
      Reaction.countDocuments(),
      User.countDocuments()
    ])

    log.info(MODULE, 'Stats retrieved successfully')

    res.status(200).json({
      success: true,
      data: {
        totalCards,
        totalComments,
        totalReactions,
        totalUsers
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get stats failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    })
  }
}

/**
 * Get detailed statistics with distributions
 */
export const getDetailedStats = async (req, res) => {
  try {
    // Comment distribution by card
    const commentDistribution = await Comment.aggregate([
      { $match: { isModerated: false } },
      {
        $group: {
          _id: '$cardId',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$count',
          cards: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Format: { "1 comment": 5 cards, "2 comments": 3 cards, etc }
    const commentDistributionFormatted = commentDistribution.reduce((acc, item) => {
      acc[`${item._id}`] = item.cards
      return acc
    }, {})

    // Reaction breakdown by emoji
    const reactionBreakdown = await Reaction.aggregate([
      {
        $group: {
          _id: '$emoji',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    const reactionBreakdownFormatted = reactionBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // User categories
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get users with recent comments or reactions
    const [recentCommentUsers, recentReactionUsers] = await Promise.all([
      Comment.distinct('userId', {
        isModerated: false,
        createdAt: { $gte: thirtyDaysAgo }
      }),
      Reaction.distinct('userId', {
        createdAt: { $gte: thirtyDaysAgo }
      })
    ])

    // Combine and deduplicate active users
    const activeUserIds = [...new Set([...recentCommentUsers, ...recentReactionUsers])]

    const DEV_EMAILS = ['shieromanu@gmail.com']

    const [totalUsers, adminCount, devCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({
        $or: [
          { isDev: true },
          { email: { $in: DEV_EMAILS } }
        ]
      })
    ])

    const activeUsers = activeUserIds.length
    const inactiveUsers = totalUsers - activeUsers

    const userCategories = {
      active: activeUsers,
      inactive: inactiveUsers,
      admins: adminCount,
      devs: devCount
    }

    // Top commented cards
    const topCommentedCards = await Comment.aggregate([
      { $match: { isModerated: false } },
      {
        $group: {
          _id: '$cardId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    // Cards with no comments
    const totalCards = await CardCache.countDocuments()
    const cardsWithComments = await Comment.distinct('cardId', { isModerated: false })
    const cardsWithoutComments = totalCards - cardsWithComments.length

    log.info(MODULE, 'Detailed stats retrieved successfully')

    res.status(200).json({
      success: true,
      data: {
        commentDistribution: commentDistributionFormatted,
        reactionBreakdown: reactionBreakdownFormatted,
        userCategories,
        topCommentedCards: topCommentedCards.map(c => ({
          cardId: c._id,
          comments: c.count
        })),
        commentStats: {
          cardsWithComments: cardsWithComments.length,
          cardsWithoutComments
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get detailed stats failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get detailed statistics'
    })
  }
}

/**
 * Get GitHub commits for changelog
 * Supports branch parameter to fetch commits from specific branch
 */
export const getGitHubCommits = async (req, res) => {
  try {
    // Get branch from query param, default to main
    const branch = req.query.branch || 'main'

    // Only allow main and stage branches
    if (!['main', 'stage'].includes(branch)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch. Only main and stage are allowed.'
      })
    }

    const now = Date.now()

    // Return cached data if still valid
    if (commitsCache[branch].data && (now - commitsCache[branch].timestamp) < CACHE_TTL) {
      log.info(MODULE, `GitHub commits for ${branch} returned from cache`)
      return res.status(200).json({
        success: true,
        data: commitsCache[branch].data,
        branch,
        cached: true
      })
    }

    // Fetch from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?sha=${branch}&per_page=50`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'TCGKB-App'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`)
    }

    const commits = await response.json()

    // Transform commits to simpler format
    const formattedCommits = commits.map(commit => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      date: commit.commit.author.date,
      author: commit.commit.author.name,
      url: commit.html_url
    }))

    // Group commits by date
    const groupedByDate = formattedCommits.reduce((acc, commit) => {
      const date = commit.date.split('T')[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(commit)
      return acc
    }, {})

    // Convert to array format sorted by date descending
    const result = Object.entries(groupedByDate)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([date, commits]) => ({
        date,
        commits
      }))

    // Cache the result
    commitsCache[branch] = {
      data: result,
      timestamp: now
    }

    log.info(MODULE, `GitHub commits for ${branch} fetched: ${formattedCommits.length} commits`)

    res.status(200).json({
      success: true,
      data: result,
      branch,
      cached: false
    })
  } catch (error) {
    log.error(MODULE, 'Get GitHub commits failed', error)

    // Return cached data even if expired, as fallback
    const branch = req.query.branch || 'main'
    if (commitsCache[branch]?.data) {
      return res.status(200).json({
        success: true,
        data: commitsCache[branch].data,
        branch,
        cached: true,
        stale: true
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get GitHub commits'
    })
  }
}

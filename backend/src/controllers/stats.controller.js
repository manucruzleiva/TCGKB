import CardCache from '../models/CardCache.js'
import Comment from '../models/Comment.js'
import Reaction from '../models/Reaction.js'
import User from '../models/User.js'
import log from '../utils/logger.js'

// Cache for relationship map (30 min TTL)
let relationshipCache = { data: null, timestamp: 0 }
const RELATIONSHIP_CACHE_TTL = 30 * 60 * 1000

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

// Cache for roadmap (1 hour TTL)
let roadmapCache = { data: null, timestamp: 0 }

/**
 * Get platform statistics
 */
export const getStats = async (req, res) => {
  try {
    const [totalCards, pokemonCards, riftboundCards, totalComments, totalReactions, totalUsers] = await Promise.all([
      CardCache.countDocuments(),
      CardCache.countDocuments({ tcgSystem: 'pokemon' }),
      CardCache.countDocuments({ tcgSystem: 'riftbound' }),
      Comment.countDocuments({ isModerated: false }),
      Reaction.countDocuments(),
      User.countDocuments()
    ])

    log.info(MODULE, 'Stats retrieved successfully')

    res.status(200).json({
      success: true,
      data: {
        totalCards,
        pokemonCards,
        riftboundCards,
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

    // User categories - using isInactive flag (computed daily by cron)
    const DEV_EMAILS = ['shieromanu@gmail.com']

    const [totalUsers, inactiveCount, adminCount, devCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isInactive: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({
        $or: [
          { isDev: true },
          { email: { $in: DEV_EMAILS } }
        ]
      })
    ])

    const activeUsers = totalUsers - inactiveCount

    const userCategories = {
      active: activeUsers,
      inactive: inactiveCount,
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

/**
 * Parse TODO.md and return roadmap items
 */
const parseTodoMarkdown = (content) => {
  const lines = content.split('\n')
  const priorities = []
  let currentPriority = null
  let currentSection = null
  let currentSubItems = []

  for (const line of lines) {
    // Match priority headers: ## Prioridad 1: UX/UI
    const priorityMatch = line.match(/^##\s+Prioridad\s+(\d+):\s*(.+)$/i)
    if (priorityMatch) {
      // Save previous priority if exists
      if (currentPriority) {
        if (currentSection && currentSubItems.length > 0) {
          currentPriority.sections.push({
            name: currentSection,
            items: currentSubItems
          })
        }
        priorities.push(currentPriority)
      }
      currentPriority = {
        level: parseInt(priorityMatch[1]),
        name: priorityMatch[2].trim(),
        sections: []
      }
      currentSection = null
      currentSubItems = []
      continue
    }

    // Skip completado section
    if (line.match(/^##\s+Completado/i) || line.match(/^##\s+Notas/i)) {
      // Save current priority before breaking
      if (currentPriority) {
        if (currentSection && currentSubItems.length > 0) {
          currentPriority.sections.push({
            name: currentSection,
            items: currentSubItems
          })
        }
        priorities.push(currentPriority)
        currentPriority = null
      }
      break
    }

    // Match section headers: ### Sistema de Avatares
    const sectionMatch = line.match(/^###\s+(.+)$/)
    if (sectionMatch && currentPriority) {
      // Save previous section
      if (currentSection && currentSubItems.length > 0) {
        currentPriority.sections.push({
          name: currentSection,
          items: currentSubItems
        })
      }
      currentSection = sectionMatch[1].trim()
      currentSubItems = []
      continue
    }

    // Match todo items: - [ ] or - [x]
    const itemMatch = line.match(/^-\s+\[([ xX])\]\s+(.+)$/)
    if (itemMatch && currentPriority) {
      const completed = itemMatch[1].toLowerCase() === 'x'
      let text = itemMatch[2].trim()
      // Remove bold markers
      text = text.replace(/\*\*(.+?)\*\*/g, '$1')
      // Remove trailing colons
      text = text.replace(/:$/, '')

      currentSubItems.push({
        text,
        completed
      })
    }
  }

  // Save last priority if exists
  if (currentPriority) {
    if (currentSection && currentSubItems.length > 0) {
      currentPriority.sections.push({
        name: currentSection,
        items: currentSubItems
      })
    }
    priorities.push(currentPriority)
  }

  // Calculate stats
  let totalItems = 0
  let completedItems = 0

  priorities.forEach(p => {
    p.sections.forEach(s => {
      s.items.forEach(item => {
        totalItems++
        if (item.completed) completedItems++
      })
      // Calculate section completion
      const sectionTotal = s.items.length
      const sectionCompleted = s.items.filter(i => i.completed).length
      s.progress = sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0
      s.completedCount = sectionCompleted
      s.totalCount = sectionTotal
    })
    // Calculate priority completion
    const priorityTotal = p.sections.reduce((acc, s) => acc + s.totalCount, 0)
    const priorityCompleted = p.sections.reduce((acc, s) => acc + s.completedCount, 0)
    p.progress = priorityTotal > 0 ? Math.round((priorityCompleted / priorityTotal) * 100) : 0
    p.completedCount = priorityCompleted
    p.totalCount = priorityTotal
  })

  return {
    priorities,
    stats: {
      total: totalItems,
      completed: completedItems,
      pending: totalItems - completedItems,
      progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    }
  }
}

/**
 * Get roadmap from TODO.md
 */
export const getRoadmap = async (req, res) => {
  try {
    const now = Date.now()

    // Return cached data if still valid
    if (roadmapCache.data && (now - roadmapCache.timestamp) < CACHE_TTL) {
      log.info(MODULE, 'Roadmap returned from cache')
      return res.status(200).json({
        success: true,
        data: roadmapCache.data,
        cached: true
      })
    }

    // Fetch TODO.md from GitHub
    const response = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/TODO.md`,
      {
        headers: {
          'User-Agent': 'TCGKB-App'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub raw returned ${response.status}`)
    }

    const content = await response.text()
    const roadmap = parseTodoMarkdown(content)

    // Cache the result
    roadmapCache = {
      data: roadmap,
      timestamp: now
    }

    log.info(MODULE, `Roadmap parsed: ${roadmap.stats.total} items, ${roadmap.stats.completed} completed`)

    res.status(200).json({
      success: true,
      data: roadmap,
      cached: false
    })
  } catch (error) {
    log.error(MODULE, 'Get roadmap failed', error)

    // Return cached data even if expired, as fallback
    if (roadmapCache.data) {
      return res.status(200).json({
        success: true,
        data: roadmapCache.data,
        cached: true,
        stale: true
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get roadmap'
    })
  }
}

/**
 * Get relationship map data - cards with comments and their connections
 */
export const getRelationshipMap = async (req, res) => {
  try {
    const now = Date.now()

    // Return cached data if still valid
    if (relationshipCache.data && (now - relationshipCache.timestamp) < RELATIONSHIP_CACHE_TTL) {
      log.info(MODULE, 'Relationship map returned from cache')
      return res.status(200).json({
        success: true,
        data: relationshipCache.data,
        cached: true
      })
    }

    // Get all cards that have comments (not moderated)
    const cardsWithComments = await Comment.aggregate([
      { $match: { isModerated: false, targetType: 'card', cardId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$cardId',
          commentCount: { $sum: 1 },
          mentions: { $push: '$cardMentions' }
        }
      }
    ])

    // Get unique card IDs
    const cardIds = cardsWithComments.map(c => c._id)

    // Fetch card details from cache - use cardId field, data is in 'data' object
    const cards = await CardCache.find({ cardId: { $in: cardIds } })
      .lean()

    // Create card lookup map
    const cardMap = {}
    cards.forEach(card => {
      cardMap[card.cardId] = {
        id: card.cardId,
        name: card.data?.name,
        image: card.data?.images?.small || card.data?.images?.large,
        tcgSystem: card.tcgSystem,
        set: card.data?.set?.name
      }
    })

    // Build nodes (cards with comments)
    const nodes = []
    const edges = []
    const edgeSet = new Set() // To avoid duplicate edges

    cardsWithComments.forEach(cardData => {
      const card = cardMap[cardData._id]
      if (!card) return

      nodes.push({
        id: card.id,
        name: card.name,
        image: card.image,
        tcgSystem: card.tcgSystem,
        set: card.set,
        commentCount: cardData.commentCount
      })

      // Process mentions to create edges
      cardData.mentions.forEach(mentionArray => {
        if (!mentionArray) return
        mentionArray.forEach(mention => {
          if (!mention || !mention.cardId) return

          // Create edge from this card to mentioned card
          const edgeKey = `${cardData._id}->${mention.cardId}`
          const reverseEdgeKey = `${mention.cardId}->${cardData._id}`

          // Skip self-references and duplicates
          if (cardData._id === mention.cardId) return
          if (edgeSet.has(edgeKey)) return

          edgeSet.add(edgeKey)
          edgeSet.add(reverseEdgeKey) // Mark reverse as visited too

          edges.push({
            source: cardData._id,
            target: mention.cardId,
            mentionType: mention.abilityType || 'card',
            abilityName: mention.abilityName
          })
        })
      })
    })

    // Add mentioned cards that aren't already in nodes (for complete graph)
    const mentionedCardIds = [...new Set(edges.flatMap(e => [e.source, e.target]))]
    const missingCardIds = mentionedCardIds.filter(id => !cardMap[id])

    if (missingCardIds.length > 0) {
      const missingCards = await CardCache.find({ cardId: { $in: missingCardIds } })
        .lean()

      missingCards.forEach(card => {
        nodes.push({
          id: card.cardId,
          name: card.data?.name,
          image: card.data?.images?.small || card.data?.images?.large,
          tcgSystem: card.tcgSystem,
          set: card.data?.set?.name,
          commentCount: 0
        })
      })
    }

    const result = {
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        cardsWithComments: cardsWithComments.length
      }
    }

    // Cache the result
    relationshipCache = {
      data: result,
      timestamp: now
    }

    log.info(MODULE, `Relationship map: ${nodes.length} nodes, ${edges.length} edges`)

    res.status(200).json({
      success: true,
      data: result,
      cached: false
    })
  } catch (error) {
    log.error(MODULE, 'Get relationship map failed', error)

    // Return cached data even if expired, as fallback
    if (relationshipCache.data) {
      return res.status(200).json({
        success: true,
        data: relationshipCache.data,
        cached: true,
        stale: true
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get relationship map'
    })
  }
}

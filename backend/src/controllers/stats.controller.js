import CardCache from '../models/CardCache.js'
import Comment from '../models/Comment.js'
import Reaction from '../models/Reaction.js'
import User from '../models/User.js'
import log from '../utils/logger.js'

const MODULE = 'StatsController'

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

    const [totalUsers, adminCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' })
    ])

    const activeUsers = activeUserIds.length
    const inactiveUsers = totalUsers - activeUsers

    const userCategories = {
      active: activeUsers,
      inactive: inactiveUsers,
      admins: adminCount
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

import Comment from '../models/Comment.js'
import Reaction from '../models/Reaction.js'
import User from '../models/User.js'
import log from '../utils/logger.js'

const MODULE = 'ModController'

/**
 * Get time-series data for comments and reactions
 * Returns daily counts for the last 30 days with detailed breakdown
 */
export const getTimeSeriesData = async (req, res) => {
  try {
    const { days = 30 } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    // Get comments grouped by day (all comments)
    const commentsByDay = await Comment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: 1 },
          moderated: { $sum: { $cond: ['$isModerated', 1, 0] } },
          hidden: { $sum: { $cond: ['$isHiddenByUser', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Get reactions grouped by day and type
    const reactionsByDay = await Reaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            emoji: '$emoji'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ])

    // Get new users grouped by day
    const usersByDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Format data for frontend chart
    const commentMap = commentsByDay.reduce((acc, item) => {
      acc[item._id] = {
        total: item.total,
        moderated: item.moderated,
        hidden: item.hidden
      }
      return acc
    }, {})

    // Build reaction map by date and emoji type
    const reactionMap = {}
    reactionsByDay.forEach(item => {
      const date = item._id.date
      const emoji = item._id.emoji
      if (!reactionMap[date]) {
        reactionMap[date] = { total: 0, likes: 0, dislikes: 0, other: 0 }
      }
      reactionMap[date].total += item.count
      // Categorize emojis
      if (emoji === '👍' || emoji === '❤️' || emoji === '🎉') {
        reactionMap[date].likes += item.count
      } else if (emoji === '👎' || emoji === '😢') {
        reactionMap[date].dislikes += item.count
      } else {
        reactionMap[date].other += item.count
      }
    })

    const userMap = usersByDay.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // Generate all dates in range
    const dateArray = []
    let cumulativeUsers = 0

    // Get total users before start date for cumulative count
    const usersBeforeStart = await User.countDocuments({
      createdAt: { $lt: startDate }
    })
    cumulativeUsers = usersBeforeStart

    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const commentData = commentMap[dateStr] || { total: 0, moderated: 0, hidden: 0 }
      const reactionData = reactionMap[dateStr] || { total: 0, likes: 0, dislikes: 0, other: 0 }
      const newUsers = userMap[dateStr] || 0
      cumulativeUsers += newUsers

      dateArray.push({
        date: dateStr,
        comments: commentData.total - commentData.moderated, // Active comments
        moderatedComments: commentData.moderated,
        hiddenComments: commentData.hidden,
        reactions: reactionData.total,
        likes: reactionData.likes,
        dislikes: reactionData.dislikes,
        otherReactions: reactionData.other,
        newUsers: newUsers,
        totalUsers: cumulativeUsers
      })
    }

    log.info(MODULE, `Enhanced time series data retrieved for ${days} days`)

    res.status(200).json({
      success: true,
      data: dateArray
    })
  } catch (error) {
    log.error(MODULE, 'Get time series data failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get time series data'
    })
  }
}

/**
 * Get all users with their activity stats
 * Only accessible by admins
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })

    // Get activity stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [commentCount, reactionCount] = await Promise.all([
          Comment.countDocuments({ userId: user._id, isModerated: false }),
          Reaction.countDocuments({ userId: user._id })
        ])

        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isDev: user.isDev,
          createdAt: user.createdAt,
          stats: {
            comments: commentCount,
            reactions: reactionCount
          }
        }
      })
    )

    log.info(MODULE, 'All users retrieved successfully')

    res.status(200).json({
      success: true,
      data: usersWithStats
    })
  } catch (error) {
    log.error(MODULE, 'Get all users failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    })
  }
}

/**
 * Update user role (promote/demote)
 * Only accessible by admins
 */
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"'
      })
    }

    // Prevent self-demotion
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Prevent changing shieromanu@gmail.com role
    if (user.email === 'shieromanu@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change the role of the system administrator'
      })
    }

    const oldRole = user.role
    user.role = role
    await user.save()

    log.info(MODULE, `User ${user.username} role changed from ${oldRole} to ${role} by admin ${req.user.username}`)

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      message: `User role updated to ${role}`
    })
  } catch (error) {
    log.error(MODULE, 'Update user role failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    })
  }
}

/**
 * Get detailed user activity (comments and reactions)
 * Only accessible by admins
 */
export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20, type = 'all' } = req.query

    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const limitNum = parseInt(limit)

    let comments = []
    let reactions = []
    let totalComments = 0
    let totalReactions = 0

    // Get comments if requested
    if (type === 'all' || type === 'comments') {
      [comments, totalComments] = await Promise.all([
        Comment.find({ userId: user._id })
          .sort({ createdAt: -1 })
          .skip(type === 'comments' ? skip : 0)
          .limit(type === 'comments' ? limitNum : 10)
          .select('cardId content createdAt isModerated isHiddenByUser parentId'),
        Comment.countDocuments({ userId: user._id })
      ])
    }

    // Get reactions if requested
    if (type === 'all' || type === 'reactions') {
      [reactions, totalReactions] = await Promise.all([
        Reaction.find({ userId: user._id })
          .sort({ createdAt: -1 })
          .skip(type === 'reactions' ? skip : 0)
          .limit(type === 'reactions' ? limitNum : 10)
          .select('targetType targetId emoji createdAt'),
        Reaction.countDocuments({ userId: user._id })
      ])

      // Enrich reactions with additional details
      const enrichedReactions = await Promise.all(reactions.map(async (reaction) => {
        const reactionObj = reaction.toObject()

        // For comment reactions, fetch the comment content
        if (reaction.targetType === 'comment') {
          try {
            const comment = await Comment.findById(reaction.targetId)
              .select('content cardId')
              .lean()
            if (comment) {
              reactionObj.commentPreview = comment.content?.substring(0, 100) + (comment.content?.length > 100 ? '...' : '')
              reactionObj.cardId = comment.cardId
            }
          } catch (e) {
            // Ignore errors, comment might be deleted
          }
        }

        // For attack/ability reactions, parse the targetId to get card and index
        // Format: cardId_type_index (e.g., "swsh1-1_attack_0")
        if (reaction.targetType === 'attack' || reaction.targetType === 'ability') {
          const parts = reaction.targetId.split('_')
          if (parts.length >= 3) {
            const index = parseInt(parts[parts.length - 1])
            const itemType = parts[parts.length - 2]
            const cardId = parts.slice(0, -2).join('_')
            reactionObj.cardId = cardId
            reactionObj.itemIndex = index
          }
        }

        // For card reactions, the targetId is already the cardId
        if (reaction.targetType === 'card') {
          reactionObj.cardId = reaction.targetId
        }

        return reactionObj
      }))

      reactions = enrichedReactions
    }

    log.info(MODULE, `User activity retrieved for ${user.username}`)

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          canComment: user.canComment !== false, // default to true
          canReact: user.canReact !== false, // default to true
          createdAt: user.createdAt
        },
        comments: {
          items: comments,
          total: totalComments
        },
        reactions: {
          items: reactions,
          total: totalReactions
        },
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total: type === 'comments' ? totalComments : type === 'reactions' ? totalReactions : Math.max(totalComments, totalReactions)
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get user activity failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user activity'
    })
  }
}

/**
 * Update user restrictions (canComment, canReact)
 * Only accessible by admins
 */
export const updateUserRestrictions = async (req, res) => {
  try {
    const { userId } = req.params
    const { canComment, canReact } = req.body

    // Prevent self-restriction
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot restrict yourself'
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Prevent restricting shieromanu@gmail.com
    if (user.email === 'shieromanu@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Cannot restrict the system administrator'
      })
    }

    // Update restrictions
    if (typeof canComment === 'boolean') {
      user.canComment = canComment
    }
    if (typeof canReact === 'boolean') {
      user.canReact = canReact
    }

    await user.save()

    log.info(MODULE, `User ${user.username} restrictions updated by admin ${req.user.username}: canComment=${user.canComment}, canReact=${user.canReact}`)

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        canComment: user.canComment,
        canReact: user.canReact
      },
      message: 'User restrictions updated'
    })
  } catch (error) {
    log.error(MODULE, 'Update user restrictions failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user restrictions'
    })
  }
}

/**
 * Moderate a specific comment (admin action)
 */
export const moderateCommentById = async (req, res) => {
  try {
    const { commentId } = req.params
    const { isModerated, reason } = req.body

    const comment = await Comment.findById(commentId)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    comment.isModerated = isModerated
    comment.moderationReason = isModerated ? reason : null

    await comment.save()

    log.info(MODULE, `Comment ${commentId} ${isModerated ? 'moderated' : 'restored'} by admin ${req.user.username}`)

    res.status(200).json({
      success: true,
      data: comment,
      message: isModerated ? 'Comment moderated' : 'Comment restored'
    })
  } catch (error) {
    log.error(MODULE, 'Moderate comment failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to moderate comment'
    })
  }
}

/**
 * Get moderation activity summary
 */
export const getModerationSummary = async (req, res) => {
  try {
    const [
      totalComments,
      moderatedComments,
      totalUsers,
      adminUsers,
      recentActivity
    ] = await Promise.all([
      Comment.countDocuments(),
      Comment.countDocuments({ isModerated: true }),
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Comment.find({ isModerated: true })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('userId', 'username')
        .select('cardId content isModerated updatedAt')
    ])

    log.info(MODULE, 'Moderation summary retrieved successfully')

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalComments,
          moderatedComments,
          totalUsers,
          adminUsers
        },
        recentActivity
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get moderation summary failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get moderation summary'
    })
  }
}

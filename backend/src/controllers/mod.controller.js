import Comment from '../models/Comment.js'
import Reaction from '../models/Reaction.js'
import User from '../models/User.js'
import log from '../utils/logger.js'

const MODULE = 'ModController'

/**
 * Get time-series data for comments and reactions
 * Returns daily counts for the last 30 days
 */
export const getTimeSeriesData = async (req, res) => {
  try {
    const { days = 30 } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    // Get comments grouped by day
    const commentsByDay = await Comment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isModerated: false
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

    // Get reactions grouped by day
    const reactionsByDay = await Reaction.aggregate([
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
      acc[item._id] = item.count
      return acc
    }, {})

    const reactionMap = reactionsByDay.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    // Generate all dates in range
    const dateArray = []
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dateArray.push({
        date: dateStr,
        comments: commentMap[dateStr] || 0,
        reactions: reactionMap[dateStr] || 0
      })
    }

    log.info(MODULE, `Time series data retrieved for ${days} days`)

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

import Comment from '../models/Comment.js'
import Reaction from '../models/Reaction.js'
import User from '../models/User.js'
import log from '../utils/logger.js'

const MODULE = 'UsersController'

/**
 * Get user activity by username (public endpoint)
 * Anyone can view user activity, but sensitive data is filtered
 */
export const getUserActivityByUsername = async (req, res) => {
  try {
    const { username } = req.params
    const { page = 1, limit = 20, type = 'all' } = req.query

    // Find user by username (case-insensitive)
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    }).select('-password')

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
          .select('targetType targetId emoji createdAt cardId itemIndex'),
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
            if (comment) {
              reactionObj.commentPreview = comment.content.substring(0, 100)
              reactionObj.cardId = comment.cardId
            }
          } catch (err) {
            // Comment might be deleted
          }
        }

        return reactionObj
      }))

      reactions = enrichedReactions
    }

    log.info(MODULE, `User activity fetched for ${user.username}`, {
      comments: comments.length,
      reactions: reactions.length
    })

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          canComment: user.canComment,
          canReact: user.canReact,
          createdAt: user.createdAt
        },
        comments: {
          items: comments,
          total: totalComments,
          page: parseInt(page),
          pages: Math.ceil(totalComments / limitNum)
        },
        reactions: {
          items: reactions,
          total: totalReactions,
          page: parseInt(page),
          pages: Math.ceil(totalReactions / limitNum)
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get user activity by username failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user activity'
    })
  }
}

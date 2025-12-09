import Reaction from '../models/Reaction.js'
import { generateFingerprint } from '../utils/fingerprint.js'
import { getIO } from '../config/socket.js'

/**
 * Get reactions for a target (card or comment)
 */
export const getReactions = async (req, res) => {
  try {
    const { targetType, targetId } = req.params

    // Aggregate reactions by emoji
    const reactions = await Reaction.aggregate([
      {
        $match: {
          targetType,
          targetId
        }
      },
      {
        $group: {
          _id: '$emoji',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          emoji: '$_id',
          count: 1,
          _id: 0
        }
      }
    ])

    // Check if current user/fingerprint has reacted
    let userReactions = []
    if (req.user) {
      userReactions = await Reaction.find({
        targetType,
        targetId,
        userId: req.user._id
      }).select('emoji')
    } else {
      const fingerprint = generateFingerprint(req)
      userReactions = await Reaction.find({
        targetType,
        targetId,
        fingerprint
      }).select('emoji')
    }

    const userReactedEmojis = userReactions.map(r => r.emoji)

    // Add userReacted flag to each reaction
    const reactionsWithUserFlag = reactions.map(r => ({
      ...r,
      userReacted: userReactedEmojis.includes(r.emoji)
    }))

    const total = reactions.reduce((sum, r) => sum + r.count, 0)

    res.status(200).json({
      success: true,
      data: {
        reactions: reactionsWithUserFlag,
        total
      }
    })
  } catch (error) {
    console.error('Get reactions error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Add a reaction
 */
export const addReaction = async (req, res) => {
  try {
    const { targetType, targetId, emoji } = req.body

    if (!targetType || !targetId || !emoji) {
      return res.status(400).json({
        success: false,
        message: 'Target type, target ID, and emoji are required'
      })
    }

    // Validate target type
    if (!['card', 'comment'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type'
      })
    }

    // Prepare reaction data
    const reactionData = {
      targetType,
      targetId,
      emoji
    }

    // Add userId if authenticated, otherwise use fingerprint
    if (req.user) {
      reactionData.userId = req.user._id

      // Check if user already reacted with this emoji
      const existing = await Reaction.findOne({
        targetType,
        targetId,
        userId: req.user._id,
        emoji
      })

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'You already reacted with this emoji'
        })
      }
    } else {
      reactionData.fingerprint = generateFingerprint(req)

      // Check if fingerprint already reacted with this emoji
      const existing = await Reaction.findOne({
        targetType,
        targetId,
        fingerprint: reactionData.fingerprint,
        emoji
      })

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'You already reacted with this emoji'
        })
      }
    }

    // Create reaction
    const reaction = await Reaction.create(reactionData)

    // Get updated aggregated counts
    const aggregated = await Reaction.aggregate([
      {
        $match: {
          targetType,
          targetId,
          emoji
        }
      },
      {
        $group: {
          _id: '$emoji',
          count: { $sum: 1 }
        }
      }
    ])

    // Emit socket event
    try {
      const io = getIO()
      const room = targetType === 'card' ? `card:${targetId}` : `card:*`

      io.to(room).emit('reaction:updated', {
        targetType,
        targetId,
        emoji,
        count: aggregated[0]?.count || 1,
        action: 'add'
      })
    } catch (socketError) {
      console.error('Socket emit error:', socketError)
    }

    res.status(201).json({
      success: true,
      data: {
        reaction,
        aggregated: {
          emoji,
          count: aggregated[0]?.count || 1
        }
      }
    })
  } catch (error) {
    console.error('Add reaction error:', error)

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You already reacted with this emoji'
      })
    }

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Remove a reaction
 */
export const removeReaction = async (req, res) => {
  try {
    const { targetType, targetId, emoji } = req.body

    if (!targetType || !targetId || !emoji) {
      return res.status(400).json({
        success: false,
        message: 'Target type, target ID, and emoji are required'
      })
    }

    let query = { targetType, targetId, emoji }

    // Add userId or fingerprint to query
    if (req.user) {
      query.userId = req.user._id
    } else {
      query.fingerprint = generateFingerprint(req)
    }

    // Find and delete reaction
    const reaction = await Reaction.findOneAndDelete(query)

    if (!reaction) {
      return res.status(404).json({
        success: false,
        message: 'Reaction not found'
      })
    }

    // Get updated aggregated counts
    const aggregated = await Reaction.aggregate([
      {
        $match: {
          targetType,
          targetId,
          emoji
        }
      },
      {
        $group: {
          _id: '$emoji',
          count: { $sum: 1 }
        }
      }
    ])

    const count = aggregated[0]?.count || 0

    // Emit socket event
    try {
      const io = getIO()
      const room = targetType === 'card' ? `card:${targetId}` : `card:*`

      io.to(room).emit('reaction:updated', {
        targetType,
        targetId,
        emoji,
        count,
        action: 'remove'
      })
    } catch (socketError) {
      console.error('Socket emit error:', socketError)
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Reaction removed',
        aggregated: {
          emoji,
          count
        }
      }
    })
  } catch (error) {
    console.error('Remove reaction error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

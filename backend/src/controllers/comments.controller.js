import Comment from '../models/Comment.js'
import Reaction from '../models/Reaction.js'
import { getIO } from '../config/socket.js'

/**
 * Get comments for a card
 */
export const getCommentsByCard = async (req, res) => {
  try {
    const { cardId } = req.params
    const { page = 1, pageSize = 50, sortBy = 'newest' } = req.query

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    let topLevelComments

    if (sortBy === 'popular') {
      // Sort by reaction count (thumbs up - thumbs down)
      const commentsWithReactions = await Comment.aggregate([
        { $match: { cardId, parentId: null } },
        {
          $lookup: {
            from: 'reactions',
            let: { commentId: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $and: [
                { $eq: ['$targetType', 'comment'] },
                { $eq: ['$targetId', '$$commentId'] }
              ]}}},
              { $group: {
                _id: '$emoji',
                count: { $sum: 1 }
              }}
            ],
            as: 'reactionCounts'
          }
        },
        {
          $addFields: {
            thumbsUp: {
              $ifNull: [
                { $arrayElemAt: [
                  { $filter: { input: '$reactionCounts', cond: { $eq: ['$$this._id', '👍'] } } },
                  0
                ] },
                { count: 0 }
              ]
            },
            thumbsDown: {
              $ifNull: [
                { $arrayElemAt: [
                  { $filter: { input: '$reactionCounts', cond: { $eq: ['$$this._id', '👎'] } } },
                  0
                ] },
                { count: 0 }
              ]
            }
          }
        },
        {
          $addFields: {
            popularityScore: { $subtract: [{ $ifNull: ['$thumbsUp.count', 0] }, { $ifNull: ['$thumbsDown.count', 0] }] }
          }
        },
        { $sort: { popularityScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { reactionCounts: 0, thumbsUp: 0, thumbsDown: 0, popularityScore: 0 } }
      ])

      // Populate userId
      topLevelComments = await Comment.populate(commentsWithReactions, {
        path: 'userId',
        select: 'username role avatar isDev'
      })
    } else {
      // Sort by date
      const sortOrder = sortBy === 'oldest' ? 1 : -1
      topLevelComments = await Comment.find({
        cardId,
        parentId: null
      })
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username role avatar isDev')
        .lean()
    }

    // For each top-level comment, get all nested replies
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await Comment.find({
          cardId,
          path: new RegExp(`^${comment._id}/`)
        })
          .sort({ path: 1 })
          .populate('userId', 'username role avatar isDev')
          .lean()

        return {
          ...comment,
          replies: buildCommentTree(replies, comment._id.toString())
        }
      })
    )

    const totalCount = await Comment.countDocuments({
      cardId,
      parentId: null
    })

    res.status(200).json({
      success: true,
      data: {
        comments: commentsWithReplies,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          totalCount
        }
      }
    })
  } catch (error) {
    console.error('Get comments error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Build nested comment tree
 */
function buildCommentTree(comments, parentId) {
  const tree = []
  const commentMap = {}

  // Create a map of all comments by ID
  comments.forEach(comment => {
    commentMap[comment._id.toString()] = { ...comment, replies: [] }
  })

  // Build the tree
  comments.forEach(comment => {
    const pathParts = comment.path.split('/')
    const immediateParent = pathParts[pathParts.length - 2]

    if (immediateParent === parentId) {
      tree.push(commentMap[comment._id.toString()])
    } else if (commentMap[immediateParent]) {
      commentMap[immediateParent].replies.push(commentMap[comment._id.toString()])
    }
  })

  return tree
}

/**
 * Get comments for a deck
 */
export const getCommentsByDeck = async (req, res) => {
  try {
    const { deckId } = req.params
    const { page = 1, pageSize = 50, sortBy = 'newest' } = req.query

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    // Sort by date
    const sortOrder = sortBy === 'oldest' ? 1 : -1
    const topLevelComments = await Comment.find({
      deckId,
      targetType: 'deck',
      parentId: null
    })
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username role avatar isDev')
      .lean()

    // For each top-level comment, get all nested replies
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await Comment.find({
          deckId,
          targetType: 'deck',
          path: new RegExp(`^${comment._id}/`)
        })
          .sort({ path: 1 })
          .populate('userId', 'username role avatar isDev')
          .lean()

        return {
          ...comment,
          replies: buildCommentTree(replies, comment._id.toString())
        }
      })
    )

    const totalCount = await Comment.countDocuments({
      deckId,
      targetType: 'deck',
      parentId: null
    })

    res.status(200).json({
      success: true,
      data: {
        comments: commentsWithReplies,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          totalCount
        }
      }
    })
  } catch (error) {
    console.error('Get deck comments error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Create a comment
 */
export const createComment = async (req, res) => {
  try {
    const { cardId, deckId, targetType, content, parentId, cardMentions, deckMentions } = req.body

    // Must have either cardId or deckId
    if (!cardId && !deckId) {
      return res.status(400).json({
        success: false,
        message: 'Card ID or Deck ID is required'
      })
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      })
    }

    // Determine target type
    const commentTargetType = targetType || (deckId ? 'deck' : 'card')

    // Create comment instance (doesn't save yet)
    const comment = new Comment({
      targetType: commentTargetType,
      cardId: cardId || null,
      deckId: deckId || null,
      userId: req.user._id,
      content,
      parentId: parentId || null,
      cardMentions: cardMentions || [],
      deckMentions: deckMentions || []
    })

    // Save (triggers pre-save middleware)
    await comment.save()

    // Populate user data
    await comment.populate('userId', 'username role avatar isDev')

    // Emit socket event
    try {
      const io = getIO()
      const room = commentTargetType === 'deck' ? `deck:${deckId}` : `card:${cardId}`
      io.to(room).emit(parentId ? 'comment:reply' : 'comment:new', {
        comment: comment.toObject(),
        parentId
      })
    } catch (socketError) {
      console.error('Socket emit error:', socketError)
    }

    res.status(201).json({
      success: true,
      data: { comment }
    })
  } catch (error) {
    console.error('Create comment error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get replies for a comment
 */
export const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    const replies = await Comment.find({
      path: new RegExp(`^${commentId}/`)
    })
      .sort({ path: 1 })
      .populate('userId', 'username role avatar isDev')
      .lean()

    const tree = buildCommentTree(replies, commentId)

    res.status(200).json({
      success: true,
      data: { replies: tree }
    })
  } catch (error) {
    console.error('Get replies error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Hide/unhide comment (by user)
 */
export const hideComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const { isHidden } = req.body

    const comment = await Comment.findById(commentId)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only hide your own comments'
      })
    }

    comment.isHiddenByUser = isHidden
    comment.hiddenAt = isHidden ? new Date() : null
    await comment.save()

    // Emit socket event
    try {
      const io = getIO()
      io.to(`card:${comment.cardId}`).emit('comment:hidden', {
        commentId,
        isHidden
      })
    } catch (socketError) {
      console.error('Socket emit error:', socketError)
    }

    res.status(200).json({
      success: true,
      data: { comment }
    })
  } catch (error) {
    console.error('Hide comment error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Moderate comment (admin only)
 */
export const moderateComment = async (req, res) => {
  try {
    const { commentId } = req.params
    const { isModerated, reason } = req.body

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can moderate comments'
      })
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Can't moderate your own comment
    if (comment.userId.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot moderate your own comments'
      })
    }

    comment.isModerated = isModerated
    comment.moderatedBy = isModerated ? req.user._id : null
    comment.moderatedAt = isModerated ? new Date() : null
    comment.moderationReason = isModerated ? reason : null
    await comment.save()

    // Emit socket event
    try {
      const io = getIO()
      io.to(`card:${comment.cardId}`).emit('comment:moderated', {
        commentId,
        isModerated,
        moderationReason: comment.moderationReason
      })
    } catch (socketError) {
      console.error('Socket emit error:', socketError)
    }

    res.status(200).json({
      success: true,
      data: { comment }
    })
  } catch (error) {
    console.error('Moderate comment error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Delete comment (within grace period)
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params

    const comment = await Comment.findById(commentId).lean()

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      })
    }

    // Check grace period (5 minutes)
    const gracePeriod = 5 * 60 * 1000 // 5 minutes in ms
    const timeSinceCreation = Date.now() - new Date(comment.createdAt).getTime()

    if (timeSinceCreation > gracePeriod) {
      return res.status(403).json({
        success: false,
        message: 'Grace period expired. You can only delete comments within 5 minutes of posting.'
      })
    }

    // Delete just this comment (replies stay orphaned but hidden)
    await Comment.deleteOne({ _id: commentId })

    // Emit socket event
    try {
      const io = getIO()
      io.to(`card:${comment.cardId}`).emit('comment:deleted', {
        commentId
      })
    } catch (socketError) {
      console.error('Socket emit error:', socketError)
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

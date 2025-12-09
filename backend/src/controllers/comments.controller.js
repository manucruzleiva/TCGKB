import Comment from '../models/Comment.js'
import { getIO } from '../config/socket.js'

/**
 * Get comments for a card
 */
export const getCommentsByCard = async (req, res) => {
  try {
    const { cardId } = req.params
    const { page = 1, pageSize = 50, sortBy = 'newest' } = req.query

    const sortOrder = sortBy === 'oldest' ? 1 : -1

    // Get top-level comments (no parent)
    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const topLevelComments = await Comment.find({
      cardId,
      parentId: null,
      isModerated: false
    })
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username role')
      .lean()

    // For each top-level comment, get all nested replies
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await Comment.find({
          cardId,
          path: new RegExp(`^${comment._id}/`)
        })
          .sort({ path: 1 })
          .populate('userId', 'username role')
          .lean()

        return {
          ...comment,
          replies: buildCommentTree(replies, comment._id.toString())
        }
      })
    )

    const totalCount = await Comment.countDocuments({
      cardId,
      parentId: null,
      isModerated: false
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
 * Create a comment
 */
export const createComment = async (req, res) => {
  try {
    const { cardId, content, parentId, cardMentions } = req.body

    if (!cardId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Card ID and content are required'
      })
    }

    // Create comment
    const comment = await Comment.create({
      cardId,
      userId: req.user._id,
      content,
      parentId: parentId || null,
      cardMentions: cardMentions || []
    })

    // Populate user data
    await comment.populate('userId', 'username role')

    // Emit socket event
    try {
      const io = getIO()
      io.to(`card:${cardId}`).emit(parentId ? 'comment:reply' : 'comment:new', {
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
      .populate('userId', 'username role')
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
 * Delete comment (within grace period)
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params

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
        message: 'You can only delete your own comments'
      })
    }

    // Check grace period (5 minutes)
    const gracePeriod = 5 * 60 * 1000 // 5 minutes in ms
    const timeSinceCreation = Date.now() - comment.createdAt.getTime()

    if (timeSinceCreation > gracePeriod) {
      return res.status(403).json({
        success: false,
        message: 'Grace period expired. You can only delete comments within 5 minutes of posting.'
      })
    }

    // Delete the comment and all its replies
    await Comment.deleteMany({
      $or: [
        { _id: commentId },
        { path: new RegExp(`^${comment.path}/`) }
      ]
    })

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

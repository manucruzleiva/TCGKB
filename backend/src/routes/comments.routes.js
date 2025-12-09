import express from 'express'
import {
  getCommentsByCard,
  createComment,
  getCommentReplies,
  hideComment,
  deleteComment
} from '../controllers/comments.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { commentLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Get comments for a card (public)
router.get('/:cardId', getCommentsByCard)

// Get replies for a comment (public)
router.get('/:commentId/replies', getCommentReplies)

// Create comment (protected, rate limited)
router.post('/', protect, commentLimiter, createComment)

// Hide/unhide comment (protected)
router.patch('/:commentId/hide', protect, hideComment)

// Delete comment (protected)
router.delete('/:commentId', protect, deleteComment)

export default router

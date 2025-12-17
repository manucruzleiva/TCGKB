import express from 'express'
import {
  getCommentsByCard,
  getCommentsByDeck,
  createComment,
  getCommentReplies,
  hideComment,
  moderateComment,
  deleteComment
} from '../controllers/comments.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { commentLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Get comments for a deck (public) - must be before :cardId to avoid conflicts
router.get('/deck/:deckId', getCommentsByDeck)

// Get comments for a card (public)
router.get('/:cardId', getCommentsByCard)

// Get replies for a comment (public)
router.get('/:commentId/replies', getCommentReplies)

// Create comment (protected, rate limited)
router.post('/', protect, commentLimiter, createComment)

// Hide/unhide comment (protected)
router.patch('/:commentId/hide', protect, hideComment)

// Moderate comment (admin only)
router.patch('/:commentId/moderate', protect, moderateComment)

// Delete comment (protected)
router.delete('/:commentId', protect, deleteComment)

export default router

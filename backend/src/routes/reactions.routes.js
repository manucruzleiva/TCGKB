import express from 'express'
import {
  getReactions,
  addReaction,
  removeReaction
} from '../controllers/reactions.controller.js'
import { optionalAuth } from '../middleware/auth.middleware.js'
import { reactionLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Get reactions for a target (public)
router.get('/:targetType/:targetId', optionalAuth, getReactions)

// Add reaction (optional auth, rate limited)
router.post('/', optionalAuth, reactionLimiter, addReaction)

// Remove reaction (optional auth)
router.delete('/', optionalAuth, removeReaction)

export default router

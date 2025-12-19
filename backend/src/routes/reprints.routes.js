import express from 'express'
import {
  detectReprints,
  getCardReprints,
  getReprintStats,
  searchReprints
} from '../controllers/reprints.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Public routes
router.get('/stats', generalLimiter, getReprintStats)
router.get('/search', generalLimiter, searchReprints)
router.get('/:cardId', generalLimiter, getCardReprints)

// Admin only - run detection algorithm
router.post('/detect', protect, adminOnly, detectReprints)

export default router

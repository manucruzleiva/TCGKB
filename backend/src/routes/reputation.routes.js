import express from 'express'
import {
  getMyReputation,
  getUserReputation,
  getLeaderboard,
  getConfig,
  updateConfig,
  getTierThresholds,
  getUserLedger,
  adminAdjustPoints,
  recalculateAll,
  processExpired,
  getConfigHistory
} from '../controllers/reputation.controller.js'
import { protect, adminOnly, adminOrDevOnly } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Public routes
router.get('/leaderboard', generalLimiter, getLeaderboard)
router.get('/tiers', generalLimiter, getTierThresholds)

// Protected routes (any authenticated user)
router.get('/me', protect, getMyReputation)
router.get('/user/:userId', protect, getUserReputation)

// Admin/Dev routes
router.get('/config', protect, adminOrDevOnly, getConfig)
router.put('/config', protect, adminOnly, updateConfig)
router.get('/config/history', protect, adminOrDevOnly, getConfigHistory)
router.get('/ledger/:userId', protect, adminOrDevOnly, getUserLedger)
router.post('/adjust', protect, adminOnly, adminAdjustPoints)
router.post('/recalculate', protect, adminOnly, recalculateAll)
router.post('/process-expired', protect, adminOrDevOnly, processExpired)

export default router

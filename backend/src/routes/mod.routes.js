import express from 'express'
import {
  getTimeSeriesData,
  getAllUsers,
  getUserActivity,
  updateUserRole,
  updateUserRestrictions,
  moderateCommentById,
  getModerationSummary,
  syncRiftboundCards,
  syncPokemonCards,
  getCacheStats,
  verifyCacheIntegrity
} from '../controllers/mod.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect, adminOnly)

// Get time-series data for charts
router.get('/time-series', generalLimiter, getTimeSeriesData)

// Get all users with activity stats
router.get('/users', generalLimiter, getAllUsers)

// Get user activity details (comments and reactions)
router.get('/users/:userId/activity', generalLimiter, getUserActivity)

// Update user role (promote/demote)
router.put('/users/:userId/role', generalLimiter, updateUserRole)

// Update user restrictions (canComment, canReact)
router.put('/users/:userId/restrictions', generalLimiter, updateUserRestrictions)

// Moderate a specific comment
router.put('/comments/:commentId/moderate', generalLimiter, moderateCommentById)

// Get moderation summary
router.get('/summary', generalLimiter, getModerationSummary)

// Cache management routes
router.get('/cache/stats', generalLimiter, getCacheStats)
router.post('/cache/sync/riftbound', syncRiftboundCards)
router.post('/cache/sync/pokemon', syncPokemonCards)
router.get('/cache/verify', generalLimiter, verifyCacheIntegrity)

export default router

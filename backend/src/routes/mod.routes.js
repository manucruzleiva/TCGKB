import express from 'express'
import {
  getTimeSeriesData,
  getAllUsers,
  updateUserRole,
  getModerationSummary
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

// Update user role (promote/demote)
router.put('/users/:userId/role', generalLimiter, updateUserRole)

// Get moderation summary
router.get('/summary', generalLimiter, getModerationSummary)

export default router

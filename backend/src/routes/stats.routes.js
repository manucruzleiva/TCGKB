import express from 'express'
import { getStats, getDetailedStats, getGitHubCommits } from '../controllers/stats.controller.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Get platform statistics
router.get('/', generalLimiter, getStats)

// Get detailed statistics with distributions
router.get('/detailed', generalLimiter, getDetailedStats)

// Get GitHub commits for changelog (supports ?branch=main|stage)
router.get('/commits', generalLimiter, getGitHubCommits)

export default router

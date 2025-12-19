import express from 'express'
import { getStats, getDetailedStats, getGitHubCommits, getRoadmap, getRelationshipMap, addRoadmapItem, getRoadmapSections } from '../controllers/stats.controller.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'
import { protect, adminOrDevOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

// Get platform statistics
router.get('/', generalLimiter, getStats)

// Get detailed statistics with distributions
router.get('/detailed', generalLimiter, getDetailedStats)

// Get GitHub commits for changelog (supports ?branch=main|stage)
router.get('/commits', generalLimiter, getGitHubCommits)

// Get roadmap parsed from TODO.md
router.get('/roadmap', generalLimiter, getRoadmap)

// Get available roadmap sections
router.get('/roadmap/sections', generalLimiter, getRoadmapSections)

// Add item to roadmap (dev/admin only)
router.post('/roadmap', protect, requireDev, generalLimiter, addRoadmapItem)

// Get relationship map data (cards with connections via mentions)
router.get('/relationship-map', generalLimiter, getRelationshipMap)

export default router

import express from 'express'
import { getStats, getDetailedStats, getRoadmap, getRelationshipMap, addRoadmapItem, getRoadmapSections, getPopularityStats } from '../controllers/stats.controller.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'
import { protect, adminOrDevOnly } from '../middleware/auth.middleware.js'

const router = express.Router()

// Get platform statistics
router.get('/', generalLimiter, getStats)

// Get detailed statistics with distributions
router.get('/detailed', generalLimiter, getDetailedStats)

// Get roadmap parsed from TODO.md
router.get('/roadmap', generalLimiter, getRoadmap)

// Get available roadmap sections
router.get('/roadmap/sections', generalLimiter, getRoadmapSections)

// Add item to roadmap (dev/admin only)
router.post('/roadmap', protect, adminOrDevOnly, generalLimiter, addRoadmapItem)

// Get relationship map data (cards with connections via mentions)
router.get('/relationship-map', generalLimiter, getRelationshipMap)

// Get popularity statistics (aggregated engagement data)
router.get('/popularity', generalLimiter, getPopularityStats)

export default router

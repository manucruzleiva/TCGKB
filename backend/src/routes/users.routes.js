import express from 'express'
import { getUserActivityByUsername } from '../controllers/users.controller.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Get public user activity by username (anyone can view)
router.get('/:username/activity', generalLimiter, getUserActivityByUsername)

export default router

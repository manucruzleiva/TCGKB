import express from 'express'
import {
  createBugReport,
  getAllBugReports,
  updateBugReportStatus,
  deleteBugReport
} from '../controllers/bugReport.controller.js'
import { protect, adminOnly } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Authenticated users only can submit bug reports
router.post('/', protect, generalLimiter, createBugReport)

// Admin only routes
router.get('/', protect, adminOnly, generalLimiter, getAllBugReports)
router.put('/:reportId', protect, adminOnly, generalLimiter, updateBugReportStatus)
router.delete('/:reportId', protect, adminOnly, generalLimiter, deleteBugReport)

export default router

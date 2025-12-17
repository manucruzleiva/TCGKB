import express from 'express'
import {
  createBugReport,
  getAllBugReports,
  updateBugReportStatus,
  deleteBugReport,
  getAvailableAssignees
} from '../controllers/bugReport.controller.js'
import { protect, adminOnly, adminOrDevOnly } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Authenticated users only can submit bug reports
router.post('/', protect, generalLimiter, createBugReport)

// Admin or Dev can view bug reports
router.get('/', protect, adminOrDevOnly, generalLimiter, getAllBugReports)

// Get available assignees (admins and devs) - admin only
router.get('/assignees', protect, adminOnly, generalLimiter, getAvailableAssignees)

// Admin only can modify/delete bug reports (devs can view but not change)
router.put('/:reportId', protect, adminOnly, generalLimiter, updateBugReportStatus)
router.delete('/:reportId', protect, adminOnly, generalLimiter, deleteBugReport)

export default router

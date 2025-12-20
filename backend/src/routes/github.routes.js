import express from 'express'
import {
  createIssue,
  getIssues,
  getIssueStats,
  addComment,
  updateIssueState,
  checkConfig,
  getCommits,
  classifyBugReport,
  getProjectItems
} from '../controllers/github.controller.js'
import { protect, optionalAuth } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Check if GitHub integration is configured (public)
router.get('/config', checkConfig)

// Get project items - public endpoint for roadmap
router.get('/project', generalLimiter, getProjectItems)

// Get commits from a branch (public)
router.get('/commits', generalLimiter, getCommits)

// Classify bug report before submission (get suggestions for priority, labels, duplicates)
router.post('/classify', optionalAuth, generalLimiter, classifyBugReport)

// Create issue (public - anyone can report bugs, auth optional for attribution)
router.post('/issues', optionalAuth, generalLimiter, createIssue)

// Get issues (protected - for dashboard)
router.get('/issues', protect, getIssues)

// Get issue statistics (protected - for dashboard)
router.get('/stats', protect, getIssueStats)

// Add comment to issue (protected - admin/dev only, handled by frontend)
router.post('/issues/:issueNumber/comments', protect, addComment)

// Update issue state (protected - admin/dev only)
router.patch('/issues/:issueNumber', protect, updateIssueState)

export default router

import express from 'express'
import {
  createIssue,
  getIssues,
  getIssueStats,
  addComment,
  updateIssueState,
  checkConfig,
  getCommits,
  getChangelog,
  classifyBugReport
} from '../controllers/github.controller.js'
import { protect, optionalAuth } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Check if GitHub integration is configured (public)
router.get('/config', checkConfig)

// Get changelog - public endpoint for showing what's new
router.get('/changelog', generalLimiter, getChangelog)

// Get commits from a branch (public - for changelog page)
router.get('/commits', generalLimiter, getCommits)

// Classify bug report before submission (get suggestions for priority, labels, duplicates)
router.post('/classify', optionalAuth, generalLimiter, classifyBugReport)

// Create issue (protected - any authenticated user can report bugs)
router.post('/issues', protect, generalLimiter, createIssue)

// Get issues (protected - for dashboard)
router.get('/issues', protect, getIssues)

// Get issue statistics (protected - for dashboard)
router.get('/stats', protect, getIssueStats)

// Add comment to issue (protected - admin/dev only, handled by frontend)
router.post('/issues/:issueNumber/comments', protect, addComment)

// Update issue state (protected - admin/dev only)
router.patch('/issues/:issueNumber', protect, updateIssueState)

export default router

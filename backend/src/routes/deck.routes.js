import express from 'express'
import {
  createDeck,
  getDecks,
  getDeckById,
  updateDeck,
  deleteDeck,
  exportDeck,
  copyDeck,
  updateDeckCardInfo,
  getAvailableTags,
  getSuggestedDecks,
  checkDuplicates,
  getDuplicateGroups
} from '../controllers/deck.controller.js'
import { protect, optionalAuth, adminOrDevOnly } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Public routes (with optional auth for checking ownership)
router.get('/', optionalAuth, generalLimiter, getDecks)
router.get('/tags', generalLimiter, getAvailableTags) // Get available tags (must be before :deckId)
router.get('/suggestions', protect, generalLimiter, getSuggestedDecks) // Suggested decks based on collection
router.get('/duplicates', protect, adminOrDevOnly, getDuplicateGroups) // Admin: view duplicate groups
router.get('/:deckId', optionalAuth, generalLimiter, getDeckById)
router.get('/:deckId/export', optionalAuth, generalLimiter, exportDeck)

// Protected routes (require authentication)
router.post('/', protect, generalLimiter, createDeck)
router.post('/check-duplicates', protect, generalLimiter, checkDuplicates) // Check before creating
router.put('/:deckId', protect, generalLimiter, updateDeck)
router.delete('/:deckId', protect, generalLimiter, deleteDeck)
router.post('/:deckId/copy', protect, generalLimiter, copyDeck)
router.put('/:deckId/card-info', protect, generalLimiter, updateDeckCardInfo)

export default router

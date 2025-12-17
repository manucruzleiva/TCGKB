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
  getAvailableTags
} from '../controllers/deck.controller.js'
import { protect, optionalAuth } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Public routes (with optional auth for checking ownership)
router.get('/', optionalAuth, generalLimiter, getDecks)
router.get('/tags', generalLimiter, getAvailableTags) // Get available tags (must be before :deckId)
router.get('/:deckId', optionalAuth, generalLimiter, getDeckById)
router.get('/:deckId/export', optionalAuth, generalLimiter, exportDeck)

// Protected routes (require authentication)
router.post('/', protect, generalLimiter, createDeck)
router.put('/:deckId', protect, generalLimiter, updateDeck)
router.delete('/:deckId', protect, generalLimiter, deleteDeck)
router.post('/:deckId/copy', protect, generalLimiter, copyDeck)
router.put('/:deckId/card-info', protect, generalLimiter, updateDeckCardInfo)

export default router

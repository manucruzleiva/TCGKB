import express from 'express'
import {
  getCards,
  getCardById,
  searchCardsAutocomplete,
  getNewestCards
} from '../controllers/cards.controller.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// All routes have rate limiting
router.use(generalLimiter)

// Get cards with search
router.get('/', getCards)

// Get newest cards
router.get('/newest', getNewestCards)

// Search cards for autocomplete
router.get('/search', searchCardsAutocomplete)

// Get card by ID (must be last to avoid conflicts)
router.get('/:cardId', getCardById)

export default router

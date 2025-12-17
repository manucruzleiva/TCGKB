import express from 'express'
import {
  getCards,
  getCardById,
  getCardAlternateArts,
  searchCardsAutocomplete,
  getNewestCards,
  getMostCommentedCards
} from '../controllers/cards.controller.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// All routes have rate limiting
router.use(generalLimiter)

// Get cards with search
router.get('/', getCards)

// Get newest cards
router.get('/newest', getNewestCards)

// Get most commented cards
router.get('/most-commented', getMostCommentedCards)

// Search cards for autocomplete
router.get('/search', searchCardsAutocomplete)

// Get alternate arts/reprints for a card
router.get('/:cardId/alternate-arts', getCardAlternateArts)

// Get card by ID (must be last to avoid conflicts)
router.get('/:cardId', getCardById)

export default router

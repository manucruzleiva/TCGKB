import express from 'express'
import {
  getCards,
  getCardById,
  getCardsByIds,
  getCardAlternateArts,
  searchCardsAutocomplete,
  getNewestCards,
  getMostCommentedCards,
  getPopularCards,
  getFeaturedCards,
  getCatalog,
  getCatalogFilters
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

// Get popular cards (hybrid ranking: reactions + comments + mentions)
router.get('/popular', getPopularCards)

// Get featured cards for empty queries (top 1 + random from top 50)
router.get('/featured', getFeaturedCards)

// Search cards for autocomplete
router.get('/search', searchCardsAutocomplete)

// Catalog endpoints
router.get('/catalog', getCatalog)
router.get('/catalog/filters', getCatalogFilters)

// Batch get cards by IDs (for deck import)
router.post('/batch', getCardsByIds)

// Get alternate arts/reprints for a card
router.get('/:cardId/alternate-arts', getCardAlternateArts)

// Get card by ID (must be last to avoid conflicts)
router.get('/:cardId', getCardById)

export default router

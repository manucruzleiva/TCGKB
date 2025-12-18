import express from 'express'
import {
  getCollection,
  getCardOwnership,
  addToCollection,
  setQuantity,
  removeFromCollection,
  getCollectionStats,
  getCollectionFilters,
  batchCheckOwnership
} from '../controllers/collection.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(generalLimiter)

// Get collection stats
router.get('/stats', getCollectionStats)

// Get collection filters
router.get('/filters', getCollectionFilters)

// Batch check ownership
router.post('/batch', batchCheckOwnership)

// Get user's full collection
router.get('/', getCollection)

// Check ownership of specific card
router.get('/card/:cardId', getCardOwnership)

// Add card to collection (increment)
router.post('/add', addToCollection)

// Set exact quantity
router.put('/quantity', setQuantity)

// Remove card from collection
router.delete('/card/:cardId', removeFromCollection)

export default router

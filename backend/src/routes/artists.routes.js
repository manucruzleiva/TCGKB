import express from 'express'
import {
  toggleFan,
  getArtistInfo,
  getTopArtists,
  getUserFavoriteArtists,
  batchCheckFanStatus,
  getCardsByArtist,
  getAllArtists
} from '../controllers/artists.controller.js'
import { protect, optionalAuth } from '../middleware/auth.middleware.js'
import { generalLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Get all artists with card counts (public)
router.get('/', getAllArtists)

// Get top artists (public)
router.get('/top', getTopArtists)

// Get artist info (public, but shows isFan if logged in)
router.get('/info/:artistName', optionalAuth, getArtistInfo)

// Get cards by artist (public, but shows isFan if logged in)
router.get('/cards/:artistName', optionalAuth, getCardsByArtist)

// Toggle fan status (protected)
router.post('/toggle-fan', protect, generalLimiter, toggleFan)

// Get user's favorite artists (protected)
router.get('/my-favorites', protect, getUserFavoriteArtists)

// Batch check fan status (protected)
router.post('/batch-status', protect, batchCheckFanStatus)

export default router

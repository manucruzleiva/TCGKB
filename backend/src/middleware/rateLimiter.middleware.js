import rateLimit from 'express-rate-limit'

// Auth endpoints - relaxed limit for serverless
// Note: express-rate-limit uses in-memory storage which doesn't persist across serverless invocations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased for serverless - consider using Redis store for production
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production' // Skip in non-production
})

// Comment creation - moderate limit
export const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many comments, please try again later',
  standardHeaders: true,
  legacyHeaders: false
})

// Reaction creation - generous limit
export const reactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many reactions, please try again later',
  standardHeaders: true,
  legacyHeaders: false
})

// General API limit
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
})

// ============================================
// V3 RATE LIMITERS - Collection & Build/Disarm
// ============================================

/**
 * Collection operations - Add/Remove cards
 * Rate: 100 requests per hour per user
 * Prevents spam and fake collection inflation
 */
export const collectionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Too many collection operations. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip // User-based limit
})

/**
 * Build/Disarm operations
 * Rate: 20 requests per hour per user
 * Prevents transaction spam and abuse
 */
export const buildDisarmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many build/disarm operations. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip
})

/**
 * Deck sync operations
 * Rate: 10 requests per hour per user
 * Prevents sync spam and database load
 */
export const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many sync operations. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip
})

/**
 * Auto-save operations (deck draft updates)
 * Rate: 20 requests per minute per user
 * Debounced on client (3s), this is backup protection
 */
export const autoSaveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many save operations. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip
})

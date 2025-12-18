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

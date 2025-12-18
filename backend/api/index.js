import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import connectDB from '../src/config/database.js'
import { errorHandler } from '../src/middleware/errorHandler.middleware.js'
import authRoutes from '../src/routes/auth.routes.js'
import cardsRoutes from '../src/routes/cards.routes.js'
import commentsRoutes from '../src/routes/comments.routes.js'
import reactionsRoutes from '../src/routes/reactions.routes.js'
import statsRoutes from '../src/routes/stats.routes.js'
import modRoutes from '../src/routes/mod.routes.js'
import deckRoutes from '../src/routes/deck.routes.js'
import bugReportRoutes from '../src/routes/bugReport.routes.js'

// Load environment variables (will use Vercel env vars in production)
dotenv.config()

// Create Express app
const app = express()

// Trust proxy for Vercel/serverless (required for rate limiting to work properly)
app.set('trust proxy', 1)

// Database connection promise for serverless
let dbPromise = null

// Middleware to ensure DB connection before handling requests
const ensureDbConnection = async (req, res, next) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB()
    }
    await dbPromise
    next()
  } catch (error) {
    console.error('Database connection failed:', error)
    res.status(500).json({ error: 'Database connection failed', message: error.message })
  }
}

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check (no DB required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    env: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI
  })
})

// Apply DB middleware to all other API routes
app.use('/api/auth', ensureDbConnection, authRoutes)
app.use('/api/cards', ensureDbConnection, cardsRoutes)
app.use('/api/comments', ensureDbConnection, commentsRoutes)
app.use('/api/reactions', ensureDbConnection, reactionsRoutes)
app.use('/api/stats', ensureDbConnection, statsRoutes)
app.use('/api/mod', ensureDbConnection, modRoutes)
app.use('/api/decks', ensureDbConnection, deckRoutes)
app.use('/api/bug-reports', ensureDbConnection, bugReportRoutes)

// Error handler (must be last)
app.use(errorHandler)

// Export for Vercel serverless
export default app

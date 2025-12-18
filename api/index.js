// Vercel Serverless Function Entry Point
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'

const app = express()

// Database connection
let dbPromise = null
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }
  return mongoose.connect(process.env.MONGODB_URI.trim(), {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
}

const ensureDbConnection = async (req, res, next) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB()
    }
    await dbPromise
    next()
  } catch (error) {
    dbPromise = null
    console.error('Database connection failed:', error)
    res.status(500).json({ error: 'Database connection failed', message: error.message })
  }
}

// Middleware
app.use(helmet())
const corsOrigin = (process.env.CORS_ORIGIN || '*').trim()
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin,
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: (process.env.NODE_ENV || '').trim(),
    hasMongoUri: !!process.env.MONGODB_URI
  })
})

// Lazy load routes on first request
let routesLoaded = false
let routeError = null

app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    return next()
  }

  if (!routesLoaded && !routeError) {
    try {
      const authRoutes = (await import('../backend/src/routes/auth.routes.js')).default
      const cardsRoutes = (await import('../backend/src/routes/cards.routes.js')).default
      const commentsRoutes = (await import('../backend/src/routes/comments.routes.js')).default
      const reactionsRoutes = (await import('../backend/src/routes/reactions.routes.js')).default
      const statsRoutes = (await import('../backend/src/routes/stats.routes.js')).default
      const modRoutes = (await import('../backend/src/routes/mod.routes.js')).default
      const deckRoutes = (await import('../backend/src/routes/deck.routes.js')).default
      const bugReportRoutes = (await import('../backend/src/routes/bugReport.routes.js')).default

      app.use('/api/auth', ensureDbConnection, authRoutes)
      app.use('/api/cards', ensureDbConnection, cardsRoutes)
      app.use('/api/comments', ensureDbConnection, commentsRoutes)
      app.use('/api/reactions', ensureDbConnection, reactionsRoutes)
      app.use('/api/stats', ensureDbConnection, statsRoutes)
      app.use('/api/mod', ensureDbConnection, modRoutes)
      app.use('/api/decks', ensureDbConnection, deckRoutes)
      app.use('/api/bugs', ensureDbConnection, bugReportRoutes)

      routesLoaded = true
    } catch (error) {
      routeError = error
      console.error('Failed to load routes:', error)
    }
  }

  if (routeError) {
    return res.status(500).json({
      error: 'Failed to load routes',
      message: routeError.message,
      stack: routeError.stack
    })
  }

  next()
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

export default app

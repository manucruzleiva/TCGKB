import express from 'express'
import { createServer } from 'http'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import connectDB from './config/database.js'
import { initSocket } from './config/socket.js'
import { errorHandler } from './middleware/errorHandler.middleware.js'
import authRoutes from './routes/auth.routes.js'
import cardsRoutes from './routes/cards.routes.js'
import commentsRoutes from './routes/comments.routes.js'
import reactionsRoutes from './routes/reactions.routes.js'
import statsRoutes from './routes/stats.routes.js'
import modRoutes from './routes/mod.routes.js'
import bugReportRoutes from './routes/bugReport.routes.js'
import deckRoutes from './routes/deck.routes.js'
import usersRoutes from './routes/users.routes.js'
import collectionRoutes from './routes/collection.routes.js'
import artistsRoutes from './routes/artists.routes.js'

// Load environment variables
dotenv.config()

// Connect to database
connectDB()

// Create Express app
const app = express()

// Create HTTP server
const httpServer = createServer(app)

// Initialize Socket.io
initSocket(httpServer)

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '10mb' })) // Increased for screenshots
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoose = (await import('mongoose')).default
    const dbState = mongoose.connection.readyState
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }

    res.json({
      status: dbState === 1 ? 'ok' : 'degraded',
      message: 'Server is running',
      database: {
        status: dbStates[dbState] || 'unknown',
        connected: dbState === 1
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.json({
      status: 'error',
      message: error.message,
      database: { status: 'error', connected: false },
      timestamp: new Date().toISOString()
    })
  }
})

// Comprehensive health check for all major endpoints
app.get('/api/health/endpoints', async (req, res) => {
  const endpoints = [
    { name: 'Cards Search', path: '/api/cards?name=pikachu&pageSize=1' },
    { name: 'Stats MVP', path: '/api/stats/mvp' },
    { name: 'Catalog', path: '/api/cards/catalog?pageSize=1' },
    { name: 'Decks', path: '/api/decks?limit=1' },
    { name: 'Roadmap', path: '/api/stats/roadmap' }
  ]

  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      const start = Date.now()
      try {
        // Internal request simulation
        const baseUrl = `http://localhost:${process.env.PORT || 3001}`
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        const latency = Date.now() - start

        return {
          name: endpoint.name,
          path: endpoint.path,
          status: response.ok ? 'healthy' : 'error',
          statusCode: response.status,
          latency,
          message: response.ok ? 'OK' : `HTTP ${response.status}`
        }
      } catch (error) {
        return {
          name: endpoint.name,
          path: endpoint.path,
          status: 'error',
          statusCode: 0,
          latency: Date.now() - start,
          message: error.message
        }
      }
    })
  )

  const healthyCount = results.filter(r => r.status === 'healthy').length
  const overallStatus = healthyCount === results.length ? 'healthy' :
                        healthyCount > 0 ? 'degraded' : 'unhealthy'

  res.json({
    status: overallStatus,
    healthy: healthyCount,
    total: results.length,
    endpoints: results,
    timestamp: new Date().toISOString()
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/cards', cardsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/reactions', reactionsRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/mod', modRoutes)
app.use('/api/bugs', bugReportRoutes)
app.use('/api/decks', deckRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/collection', collectionRoutes)
app.use('/api/artists', artistsRoutes)

// Error handler (must be last)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app

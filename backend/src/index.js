import express from 'express'
import { createServer } from 'http'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
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
import githubRoutes from './routes/github.routes.js'

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
    // Check MongoDB connection - use the imported mongoose directly
    const dbState = mongoose.connection.readyState
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }

    // Try a simple DB operation to verify actual connectivity
    let dbOperational = false
    try {
      await mongoose.connection.db.admin().ping()
      dbOperational = true
    } catch (pingError) {
      console.error('DB ping failed:', pingError.message)
    }

    res.json({
      status: dbOperational ? 'ok' : 'degraded',
      message: 'Server is running',
      database: {
        status: dbOperational ? 'connected' : dbStates[dbState] || 'unknown',
        connected: dbOperational,
        readyState: dbState
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

// Data sources health check
app.get('/api/health/sources', async (req, res) => {
  const sources = []

  // 1. MongoDB
  try {
    const start = Date.now()
    await mongoose.connection.db.admin().ping()
    sources.push({
      name: 'MongoDB',
      type: 'database',
      status: 'healthy',
      latency: Date.now() - start,
      message: 'Connected'
    })
  } catch (error) {
    sources.push({
      name: 'MongoDB',
      type: 'database',
      status: 'error',
      latency: 0,
      message: error.message
    })
  }

  // 2. Pokemon TCG API
  try {
    const start = Date.now()
    const response = await fetch('https://api.pokemontcg.io/v2/cards?pageSize=1', {
      headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY || '' },
      signal: AbortSignal.timeout(5000)
    })
    sources.push({
      name: 'Pokemon TCG API',
      type: 'external_api',
      status: response.ok ? 'healthy' : 'error',
      latency: Date.now() - start,
      message: response.ok ? 'OK' : `HTTP ${response.status}`
    })
  } catch (error) {
    sources.push({
      name: 'Pokemon TCG API',
      type: 'external_api',
      status: 'error',
      latency: 0,
      message: error.message
    })
  }

  // 3. Riftbound API
  try {
    const start = Date.now()
    const response = await fetch('https://api.riftcodex.com/cards?limit=1', {
      signal: AbortSignal.timeout(5000)
    })
    sources.push({
      name: 'Riftbound API',
      type: 'external_api',
      status: response.ok ? 'healthy' : 'error',
      latency: Date.now() - start,
      message: response.ok ? 'OK' : `HTTP ${response.status}`
    })
  } catch (error) {
    sources.push({
      name: 'Riftbound API',
      type: 'external_api',
      status: 'error',
      latency: 0,
      message: error.message
    })
  }

  // 4. PokeAPI (for sprites)
  try {
    const start = Date.now()
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/1', {
      signal: AbortSignal.timeout(5000)
    })
    sources.push({
      name: 'PokeAPI (Sprites)',
      type: 'external_api',
      status: response.ok ? 'healthy' : 'error',
      latency: Date.now() - start,
      message: response.ok ? 'OK' : `HTTP ${response.status}`
    })
  } catch (error) {
    sources.push({
      name: 'PokeAPI (Sprites)',
      type: 'external_api',
      status: 'error',
      latency: 0,
      message: error.message
    })
  }

  const healthyCount = sources.filter(s => s.status === 'healthy').length
  const overallStatus = healthyCount === sources.length ? 'healthy' :
                        healthyCount > 0 ? 'degraded' : 'unhealthy'

  res.json({
    status: overallStatus,
    healthy: healthyCount,
    total: sources.length,
    sources,
    timestamp: new Date().toISOString()
  })
})

// Comprehensive health check for all major endpoints
app.get('/api/health/endpoints', async (req, res) => {
  const endpoints = [
    // Cards
    { name: 'Cards Search', path: '/api/cards?name=pikachu&pageSize=1', category: 'cards' },
    { name: 'Cards Autocomplete', path: '/api/cards/autocomplete?name=pika&limit=1', category: 'cards' },
    { name: 'Cards Newest', path: '/api/cards/newest?pageSize=1', category: 'cards' },
    { name: 'Cards Catalog', path: '/api/cards/catalog?pageSize=1', category: 'cards' },
    { name: 'Cards Catalog Filters', path: '/api/cards/catalog/filters', category: 'cards' },
    // Stats
    { name: 'Stats MVP', path: '/api/stats/mvp', category: 'stats' },
    { name: 'Stats Roadmap', path: '/api/stats/roadmap', category: 'stats' },
    { name: 'Stats Relationship Map', path: '/api/stats/relationship-map', category: 'stats' },
    // Decks
    { name: 'Decks List', path: '/api/decks?limit=1', category: 'decks' },
    // Comments
    { name: 'Comments (card)', path: '/api/comments?cardId=test&page=1&limit=1', category: 'comments' },
    // Auth (public endpoints)
    { name: 'Auth Check', path: '/api/auth/me', category: 'auth', expectUnauthorized: true },
    // Artists
    { name: 'Artists Top', path: '/api/artists/top', category: 'artists' }
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

        // For auth endpoints, 401 is expected behavior
        const isHealthy = endpoint.expectUnauthorized
          ? response.status === 401 || response.ok
          : response.ok

        return {
          name: endpoint.name,
          path: endpoint.path,
          category: endpoint.category,
          status: isHealthy ? 'healthy' : 'error',
          statusCode: response.status,
          latency,
          message: isHealthy ? 'OK' : `HTTP ${response.status}`
        }
      } catch (error) {
        return {
          name: endpoint.name,
          path: endpoint.path,
          category: endpoint.category,
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
app.use('/api/github', githubRoutes)

// Error handler (must be last)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app

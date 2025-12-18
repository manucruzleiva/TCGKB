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

// Health check - with actual database connectivity test
app.get('/api/health', async (req, res) => {
  let dbStatus = { connected: false, message: 'Not checked' }

  try {
    // Check MongoDB connection state
    const readyState = mongoose.connection.readyState
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting

    if (readyState === 1) {
      // Actually ping the database to verify connectivity
      await mongoose.connection.db.admin().ping()
      dbStatus = { connected: true, message: 'Connected' }
    } else if (readyState === 2) {
      dbStatus = { connected: false, message: 'Connecting...' }
    } else if (readyState === 0 || readyState === 3) {
      // Try to connect if not connected
      if (process.env.MONGODB_URI) {
        try {
          if (!dbPromise) {
            dbPromise = connectDB()
          }
          await dbPromise
          await mongoose.connection.db.admin().ping()
          dbStatus = { connected: true, message: 'Connected' }
        } catch (connError) {
          dbPromise = null
          dbStatus = { connected: false, message: connError.message || 'Connection failed' }
        }
      } else {
        dbStatus = { connected: false, message: 'MONGODB_URI not configured' }
      }
    }
  } catch (error) {
    dbStatus = { connected: false, message: error.message || 'Ping failed' }
  }

  res.json({
    status: dbStatus.connected ? 'ok' : 'degraded',
    env: (process.env.NODE_ENV || '').trim(),
    hasMongoUri: !!process.env.MONGODB_URI,
    database: dbStatus
  })
})

// Health check - External Data Sources
app.get('/api/health/sources', async (req, res) => {
  const sources = []
  let healthyCount = 0
  const totalSources = 3 // MongoDB, Pokemon TCG API, Riftbound API

  // Check MongoDB
  const mongoStart = Date.now()
  try {
    if (!dbPromise && process.env.MONGODB_URI) {
      dbPromise = connectDB()
    }
    if (dbPromise) {
      await dbPromise
      await mongoose.connection.db.admin().ping()
      sources.push({
        name: 'MongoDB',
        type: 'database',
        status: 'healthy',
        message: 'Connected',
        latency: Date.now() - mongoStart
      })
      healthyCount++
    } else {
      sources.push({
        name: 'MongoDB',
        type: 'database',
        status: 'error',
        message: 'Not configured',
        latency: Date.now() - mongoStart
      })
    }
  } catch (error) {
    dbPromise = null
    sources.push({
      name: 'MongoDB',
      type: 'database',
      status: 'error',
      message: error.message || 'Connection failed',
      latency: Date.now() - mongoStart
    })
  }

  // Check Pokemon TCG API
  const pokemonStart = Date.now()
  try {
    const response = await fetch('https://api.pokemontcg.io/v2/sets?pageSize=1', {
      headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY || '' },
      signal: AbortSignal.timeout(10000)
    })
    if (response.ok) {
      sources.push({
        name: 'Pokemon TCG API',
        type: 'external',
        status: 'healthy',
        message: 'Reachable',
        latency: Date.now() - pokemonStart
      })
      healthyCount++
    } else {
      sources.push({
        name: 'Pokemon TCG API',
        type: 'external',
        status: 'error',
        message: `HTTP ${response.status}`,
        latency: Date.now() - pokemonStart
      })
    }
  } catch (error) {
    sources.push({
      name: 'Pokemon TCG API',
      type: 'external',
      status: 'error',
      message: error.name === 'TimeoutError' ? 'Timeout' : (error.message || 'Unreachable'),
      latency: Date.now() - pokemonStart
    })
  }

  // Check Riftbound API
  const riftboundStart = Date.now()
  try {
    const response = await fetch('https://api.riftcodex.com/cards?page=1&limit=1', {
      signal: AbortSignal.timeout(10000)
    })
    if (response.ok) {
      sources.push({
        name: 'Riftbound API',
        type: 'external',
        status: 'healthy',
        message: 'Reachable',
        latency: Date.now() - riftboundStart
      })
      healthyCount++
    } else {
      sources.push({
        name: 'Riftbound API',
        type: 'external',
        status: 'error',
        message: `HTTP ${response.status}`,
        latency: Date.now() - riftboundStart
      })
    }
  } catch (error) {
    sources.push({
      name: 'Riftbound API',
      type: 'external',
      status: 'error',
      message: error.name === 'TimeoutError' ? 'Timeout' : (error.message || 'Unreachable'),
      latency: Date.now() - riftboundStart
    })
  }

  const status = healthyCount === totalSources ? 'healthy' :
                 healthyCount > 0 ? 'degraded' : 'error'

  res.json({
    status,
    total: totalSources,
    healthy: healthyCount,
    sources
  })
})

// Health check - Internal API Endpoints
app.get('/api/health/endpoints', async (req, res) => {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.API_URL || 'http://localhost:5000'

  const endpoints = [
    { name: 'Cards Search', path: '/api/cards/search?q=pikachu&limit=1', category: 'cards' },
    { name: 'Cards Popular', path: '/api/cards/popular?limit=1', category: 'cards' },
    { name: 'Stats Overview', path: '/api/stats/overview', category: 'stats' },
    { name: 'Auth Check', path: '/api/auth/check', category: 'auth' },
    { name: 'GitHub Config', path: '/api/github/config', category: 'github' }
  ]

  const results = []
  let healthyCount = 0

  for (const endpoint of endpoints) {
    const start = Date.now()
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        signal: AbortSignal.timeout(10000)
      })
      const latency = Date.now() - start

      if (response.ok || response.status === 401) {
        // 401 is expected for protected endpoints
        results.push({
          name: endpoint.name,
          path: endpoint.path,
          category: endpoint.category,
          status: 'healthy',
          httpStatus: response.status,
          latency
        })
        healthyCount++
      } else {
        results.push({
          name: endpoint.name,
          path: endpoint.path,
          category: endpoint.category,
          status: 'error',
          httpStatus: response.status,
          latency
        })
      }
    } catch (error) {
      results.push({
        name: endpoint.name,
        path: endpoint.path,
        category: endpoint.category,
        status: 'error',
        httpStatus: 0,
        latency: Date.now() - start,
        error: error.name === 'TimeoutError' ? 'Timeout' : (error.message || 'Failed')
      })
    }
  }

  const status = healthyCount === endpoints.length ? 'healthy' :
                 healthyCount > 0 ? 'degraded' : 'error'

  res.json({
    status,
    total: endpoints.length,
    healthy: healthyCount,
    endpoints: results
  })
})

// Lazy load routes on first request
let routesLoaded = false
let routeError = null

app.use('/api', async (req, res, next) => {
  // Skip health check endpoints - they're handled separately
  if (req.path === '/health' || req.path.startsWith('/health/')) {
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
      const githubRoutes = (await import('../backend/src/routes/github.routes.js')).default

      app.use('/api/auth', ensureDbConnection, authRoutes)
      app.use('/api/cards', ensureDbConnection, cardsRoutes)
      app.use('/api/comments', ensureDbConnection, commentsRoutes)
      app.use('/api/reactions', ensureDbConnection, reactionsRoutes)
      app.use('/api/stats', ensureDbConnection, statsRoutes)
      app.use('/api/mod', ensureDbConnection, modRoutes)
      app.use('/api/decks', ensureDbConnection, deckRoutes)
      app.use('/api/bugs', ensureDbConnection, bugReportRoutes)
      app.use('/api/github', ensureDbConnection, githubRoutes)

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

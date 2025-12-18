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

// Health check - with actual database connectivity and environments check
app.get('/api/health', async (req, res) => {
  let dbStatus = { connected: false, message: 'Not checked' }
  const environments = []

  // Check database
  try {
    const readyState = mongoose.connection.readyState
    if (readyState === 1) {
      await mongoose.connection.db.admin().ping()
      dbStatus = { connected: true, message: 'Connected' }
    } else if (readyState === 2) {
      dbStatus = { connected: false, message: 'Connecting...' }
    } else if (readyState === 0 || readyState === 3) {
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

  // Check Production environment
  const prodStart = Date.now()
  try {
    const response = await fetch('https://tcgkb.app/api/health', {
      signal: AbortSignal.timeout(10000)
    })
    environments.push({
      name: 'Production',
      url: 'https://tcgkb.app',
      status: response.ok ? 'healthy' : 'error',
      message: response.ok ? 'Online' : `HTTP ${response.status}`,
      latency: Date.now() - prodStart
    })
  } catch (error) {
    environments.push({
      name: 'Production',
      url: 'https://tcgkb.app',
      status: 'error',
      message: error.name === 'TimeoutError' ? 'Timeout' : 'Unreachable',
      latency: Date.now() - prodStart
    })
  }

  // Check Staging environment
  const stagingStart = Date.now()
  try {
    const response = await fetch('https://staging.tcgkb.app/api/health', {
      signal: AbortSignal.timeout(10000)
    })
    environments.push({
      name: 'Staging',
      url: 'https://staging.tcgkb.app',
      status: response.ok ? 'healthy' : 'error',
      message: response.ok ? 'Online' : `HTTP ${response.status}`,
      latency: Date.now() - stagingStart
    })
  } catch (error) {
    environments.push({
      name: 'Staging',
      url: 'https://staging.tcgkb.app',
      status: 'error',
      message: error.name === 'TimeoutError' ? 'Timeout' : 'Unreachable',
      latency: Date.now() - stagingStart
    })
  }

  res.json({
    status: dbStatus.connected ? 'ok' : 'degraded',
    env: (process.env.NODE_ENV || '').trim(),
    hasMongoUri: !!process.env.MONGODB_URI,
    database: dbStatus,
    environments
  })
})

// Health check - External Data Sources with URLs
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
        name: 'MongoDB Atlas',
        type: 'database',
        url: 'mongodb+srv://...@cluster.mongodb.net',
        docsUrl: 'https://www.mongodb.com/docs/atlas/',
        status: 'healthy',
        message: 'Connected',
        latency: Date.now() - mongoStart
      })
      healthyCount++
    } else {
      sources.push({
        name: 'MongoDB Atlas',
        type: 'database',
        url: 'mongodb+srv://...@cluster.mongodb.net',
        docsUrl: 'https://www.mongodb.com/docs/atlas/',
        status: 'error',
        message: 'Not configured',
        latency: Date.now() - mongoStart
      })
    }
  } catch (error) {
    dbPromise = null
    sources.push({
      name: 'MongoDB Atlas',
      type: 'database',
      url: 'mongodb+srv://...@cluster.mongodb.net',
      docsUrl: 'https://www.mongodb.com/docs/atlas/',
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
        url: 'https://api.pokemontcg.io/v2',
        docsUrl: 'https://docs.pokemontcg.io/',
        status: 'healthy',
        message: 'Reachable',
        latency: Date.now() - pokemonStart
      })
      healthyCount++
    } else {
      sources.push({
        name: 'Pokemon TCG API',
        type: 'external',
        url: 'https://api.pokemontcg.io/v2',
        docsUrl: 'https://docs.pokemontcg.io/',
        status: 'error',
        message: `HTTP ${response.status}`,
        latency: Date.now() - pokemonStart
      })
    }
  } catch (error) {
    sources.push({
      name: 'Pokemon TCG API',
      type: 'external',
      url: 'https://api.pokemontcg.io/v2',
      docsUrl: 'https://docs.pokemontcg.io/',
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
        url: 'https://api.riftcodex.com',
        docsUrl: 'https://riftcodex.com',
        status: 'healthy',
        message: 'Reachable',
        latency: Date.now() - riftboundStart
      })
      healthyCount++
    } else {
      sources.push({
        name: 'Riftbound API',
        type: 'external',
        url: 'https://api.riftcodex.com',
        docsUrl: 'https://riftcodex.com',
        status: 'error',
        message: `HTTP ${response.status}`,
        latency: Date.now() - riftboundStart
      })
    }
  } catch (error) {
    sources.push({
      name: 'Riftbound API',
      type: 'external',
      url: 'https://api.riftcodex.com',
      docsUrl: 'https://riftcodex.com',
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

// Health check - All API Endpoints (static list for honeycomb view)
// Returns all endpoints with optional health check via ?check=true
app.get('/api/health/endpoints', async (req, res) => {
  const { check } = req.query
  const shouldCheck = check === 'true'

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.API_URL || 'http://localhost:5000'

  // All API endpoints in the project
  const allEndpoints = [
    // Auth
    { name: 'Register', method: 'POST', path: '/api/auth/register', category: 'auth', protected: false },
    { name: 'Login', method: 'POST', path: '/api/auth/login', category: 'auth', protected: false },
    { name: 'Get Me', method: 'GET', path: '/api/auth/me', category: 'auth', protected: true },
    { name: 'Refresh Token', method: 'POST', path: '/api/auth/refresh', category: 'auth', protected: true },
    { name: 'Update Preferences', method: 'PUT', path: '/api/auth/preferences', category: 'auth', protected: true },
    { name: 'Update Avatar', method: 'PUT', path: '/api/auth/avatar', category: 'auth', protected: true },
    { name: 'Update Account', method: 'PUT', path: '/api/auth/update-account', category: 'auth', protected: true },

    // Cards
    { name: 'Get Cards', method: 'GET', path: '/api/cards', category: 'cards', protected: false },
    { name: 'Newest Cards', method: 'GET', path: '/api/cards/newest', category: 'cards', protected: false },
    { name: 'Most Commented', method: 'GET', path: '/api/cards/most-commented', category: 'cards', protected: false },
    { name: 'Search Cards', method: 'GET', path: '/api/cards/search', category: 'cards', protected: false },
    { name: 'Catalog', method: 'GET', path: '/api/cards/catalog', category: 'cards', protected: false },
    { name: 'Catalog Filters', method: 'GET', path: '/api/cards/catalog/filters', category: 'cards', protected: false },
    { name: 'Batch Get Cards', method: 'POST', path: '/api/cards/batch', category: 'cards', protected: false },
    { name: 'Card By ID', method: 'GET', path: '/api/cards/:cardId', category: 'cards', protected: false },
    { name: 'Alternate Arts', method: 'GET', path: '/api/cards/:cardId/alternate-arts', category: 'cards', protected: false },

    // Comments
    { name: 'Connection Comments', method: 'GET', path: '/api/comments/connection', category: 'comments', protected: false },
    { name: 'Deck Comments', method: 'GET', path: '/api/comments/deck/:deckId', category: 'comments', protected: false },
    { name: 'Card Comments', method: 'GET', path: '/api/comments/:cardId', category: 'comments', protected: false },
    { name: 'Comment Replies', method: 'GET', path: '/api/comments/:commentId/replies', category: 'comments', protected: false },
    { name: 'Create Comment', method: 'POST', path: '/api/comments', category: 'comments', protected: true },
    { name: 'Hide Comment', method: 'PATCH', path: '/api/comments/:commentId/hide', category: 'comments', protected: true },
    { name: 'Moderate Comment', method: 'PATCH', path: '/api/comments/:commentId/moderate', category: 'comments', protected: true },
    { name: 'Delete Comment', method: 'DELETE', path: '/api/comments/:commentId', category: 'comments', protected: true },

    // Reactions
    { name: 'Get Reactions', method: 'GET', path: '/api/reactions/:targetType/:targetId', category: 'reactions', protected: false },
    { name: 'Add Reaction', method: 'POST', path: '/api/reactions', category: 'reactions', protected: false },
    { name: 'Remove Reaction', method: 'DELETE', path: '/api/reactions', category: 'reactions', protected: false },

    // Stats
    { name: 'Platform Stats', method: 'GET', path: '/api/stats', category: 'stats', protected: false },
    { name: 'Detailed Stats', method: 'GET', path: '/api/stats/detailed', category: 'stats', protected: false },
    { name: 'GitHub Commits', method: 'GET', path: '/api/stats/commits', category: 'stats', protected: false },
    { name: 'Roadmap', method: 'GET', path: '/api/stats/roadmap', category: 'stats', protected: false },
    { name: 'Relationship Map', method: 'GET', path: '/api/stats/relationship-map', category: 'stats', protected: false },

    // Decks
    { name: 'List Decks', method: 'GET', path: '/api/decks', category: 'decks', protected: false },
    { name: 'Available Tags', method: 'GET', path: '/api/decks/tags', category: 'decks', protected: false },
    { name: 'Get Deck', method: 'GET', path: '/api/decks/:deckId', category: 'decks', protected: false },
    { name: 'Export Deck', method: 'GET', path: '/api/decks/:deckId/export', category: 'decks', protected: false },
    { name: 'Create Deck', method: 'POST', path: '/api/decks', category: 'decks', protected: true },
    { name: 'Update Deck', method: 'PUT', path: '/api/decks/:deckId', category: 'decks', protected: true },
    { name: 'Delete Deck', method: 'DELETE', path: '/api/decks/:deckId', category: 'decks', protected: true },
    { name: 'Copy Deck', method: 'POST', path: '/api/decks/:deckId/copy', category: 'decks', protected: true },
    { name: 'Update Card Info', method: 'PUT', path: '/api/decks/:deckId/card-info', category: 'decks', protected: true },

    // GitHub
    { name: 'GitHub Config', method: 'GET', path: '/api/github/config', category: 'github', protected: false },
    { name: 'Create Issue', method: 'POST', path: '/api/github/issues', category: 'github', protected: true },
    { name: 'Get Issues', method: 'GET', path: '/api/github/issues', category: 'github', protected: true },
    { name: 'Issue Stats', method: 'GET', path: '/api/github/stats', category: 'github', protected: true },
    { name: 'Add Comment', method: 'POST', path: '/api/github/issues/:issueNumber/comments', category: 'github', protected: true },
    { name: 'Update Issue', method: 'PATCH', path: '/api/github/issues/:issueNumber', category: 'github', protected: true },

    // Mod (Admin)
    { name: 'Time Series', method: 'GET', path: '/api/mod/time-series', category: 'mod', protected: true },
    { name: 'All Users', method: 'GET', path: '/api/mod/users', category: 'mod', protected: true },
    { name: 'User Activity', method: 'GET', path: '/api/mod/users/:userId/activity', category: 'mod', protected: true },
    { name: 'Update Role', method: 'PUT', path: '/api/mod/users/:userId/role', category: 'mod', protected: true },
    { name: 'User Restrictions', method: 'PUT', path: '/api/mod/users/:userId/restrictions', category: 'mod', protected: true },
    { name: 'Moderate Comment', method: 'PUT', path: '/api/mod/comments/:commentId/moderate', category: 'mod', protected: true },
    { name: 'Mod Summary', method: 'GET', path: '/api/mod/summary', category: 'mod', protected: true },
    { name: 'Cache Stats', method: 'GET', path: '/api/mod/cache/stats', category: 'mod', protected: true },
    { name: 'Sync Riftbound', method: 'POST', path: '/api/mod/cache/sync/riftbound', category: 'mod', protected: true },
    { name: 'Sync Pokemon', method: 'POST', path: '/api/mod/cache/sync/pokemon', category: 'mod', protected: true },
    { name: 'Verify Cache', method: 'GET', path: '/api/mod/cache/verify', category: 'mod', protected: true },

    // Health
    { name: 'Health Check', method: 'GET', path: '/api/health', category: 'health', protected: false },
    { name: 'Sources Health', method: 'GET', path: '/api/health/sources', category: 'health', protected: false },
    { name: 'Endpoints Health', method: 'GET', path: '/api/health/endpoints', category: 'health', protected: false }
  ]

  // Group by category for response
  const categories = {}
  allEndpoints.forEach(ep => {
    if (!categories[ep.category]) {
      categories[ep.category] = []
    }
    categories[ep.category].push(ep)
  })

  // If check=true, verify some key public endpoints
  let healthyCount = 0
  let checkedCount = 0
  const checkResults = {}

  if (shouldCheck) {
    const endpointsToCheck = [
      { path: '/api/health', name: 'Health' },
      { path: '/api/cards?limit=1', name: 'Cards' },
      { path: '/api/stats', name: 'Stats' },
      { path: '/api/github/config', name: 'GitHub' },
      { path: '/api/decks?limit=1', name: 'Decks' }
    ]

    for (const ep of endpointsToCheck) {
      const start = Date.now()
      try {
        const response = await fetch(`${baseUrl}${ep.path}`, {
          signal: AbortSignal.timeout(10000)
        })
        checkedCount++
        if (response.ok || response.status === 401) {
          healthyCount++
          checkResults[ep.name] = { status: 'healthy', latency: Date.now() - start }
        } else {
          checkResults[ep.name] = { status: 'error', latency: Date.now() - start, httpStatus: response.status }
        }
      } catch (error) {
        checkedCount++
        checkResults[ep.name] = {
          status: 'error',
          latency: Date.now() - start,
          error: error.name === 'TimeoutError' ? 'Timeout' : error.message
        }
      }
    }
  }

  res.json({
    total: allEndpoints.length,
    categories,
    endpoints: allEndpoints,
    ...(shouldCheck && {
      healthCheck: {
        status: healthyCount === checkedCount ? 'healthy' : healthyCount > 0 ? 'degraded' : 'error',
        checked: checkedCount,
        healthy: healthyCount,
        results: checkResults
      }
    })
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

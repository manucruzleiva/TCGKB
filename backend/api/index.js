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

// Load environment variables
dotenv.config()

// Connect to database
let cachedDb = null
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb
  }
  cachedDb = await connectDB()
  return cachedDb
}

// Create Express app
const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/cards', cardsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/reactions', reactionsRoutes)

// Error handler (must be last)
app.use(errorHandler)

// Initialize database connection
connectToDatabase().catch(console.error)

// Export for Vercel serverless
export default app

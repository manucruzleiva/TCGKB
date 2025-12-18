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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
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

// Error handler (must be last)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app

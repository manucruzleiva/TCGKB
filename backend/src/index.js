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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/cards', cardsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/reactions', reactionsRoutes)

// Error handler (must be last)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app

import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

let io = null

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        socket.userId = decoded.id
        socket.isAuthenticated = true
      } catch (error) {
        socket.isAuthenticated = false
      }
    } else {
      socket.isAuthenticated = false
    }

    next()
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    // Join card room
    socket.on('card:join', (cardId) => {
      socket.join(`card:${cardId}`)
      console.log(`Socket ${socket.id} joined room card:${cardId}`)
    })

    // Leave card room
    socket.on('card:leave', (cardId) => {
      socket.leave(`card:${cardId}`)
      console.log(`Socket ${socket.id} left room card:${cardId}`)
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!')
  }
  return io
}

export default { initSocket, getIO }

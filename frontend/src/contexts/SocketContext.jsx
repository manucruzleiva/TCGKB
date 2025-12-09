import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_URL } from '../utils/constants'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token
      },
      autoConnect: true
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const joinCardRoom = (cardId) => {
    if (socket && connected) {
      socket.emit('card:join', cardId)
    }
  }

  const leaveCardRoom = (cardId) => {
    if (socket && connected) {
      socket.emit('card:leave', cardId)
    }
  }

  const value = {
    socket,
    connected,
    joinCardRoom,
    leaveCardRoom
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

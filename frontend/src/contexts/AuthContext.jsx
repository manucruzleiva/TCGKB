import { createContext, useState, useEffect, useContext } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await authService.getMe()
        setUser(response.data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authService.login(email, password)
      const { user, token } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (email, username, password) => {
    try {
      setError(null)
      const response = await authService.register(email, username, password)
      const { user, token } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

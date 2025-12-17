import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        })
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        })
      }

      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    let token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = await User.findById(decoded.id).select('-password')
      } catch (error) {
        // Token is invalid, but we continue without user
        req.user = null
      }
    }

    next()
  } catch (error) {
    next()
  }
}

export const adminOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      })
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      })
    }

    next()
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

// Check if user is dev (includes hardcoded email check)
const isDevUser = (user) => {
  const DEV_EMAILS = ['shieromanu@gmail.com']
  return user.isDev || DEV_EMAILS.includes(user.email)
}

export const adminOrDevOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      })
    }

    const hasAccess = req.user.role === 'admin' || isDevUser(req.user)

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Dev privileges required.'
      })
    }

    next()
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
}

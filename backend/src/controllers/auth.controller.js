import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

export const register = async (req, res) => {
  try {
    const { email, username, password } = req.body

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      })
    }

    // Check if user exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      })
    }

    // Create user
    const user = await User.create({
      email,
      username,
      password
    })

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        token
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      })
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      })
    }

    // Generate token
    const token = generateToken(user._id)

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role
        },
        token
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const token = generateToken(user._id)

    res.status(200).json({
      success: true,
      data: {
        token
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

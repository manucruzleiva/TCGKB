import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const generateToken = (id) => {
  // Validate expiresIn - use default if invalid or empty
  let expiresIn = process.env.JWT_EXPIRES_IN
  if (!expiresIn || expiresIn.trim() === '') {
    expiresIn = '7d'
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn.trim()
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

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      })
    }

    // Username length validation
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long'
      })
    }

    if (username.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username cannot exceed 30 characters'
      })
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      })
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email })
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      })
    }

    // Check if username already exists (case-insensitive)
    const usernameExists = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    })
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken'
      })
    }

    // Create user
    const user = await User.create({
      email,
      username,
      password,
      // Auto-promote shieromanu@gmail.com to admin
      role: email === 'shieromanu@gmail.com' ? 'admin' : 'user'
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
          role: user.role,
          avatar: user.avatar,
          isDev: user.isDev,
          canComment: user.canComment,
          canReact: user.canReact
        },
        token
      }
    })
  } catch (error) {
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({
        success: false,
        message: field === 'email'
          ? 'An account with this email already exists'
          : 'This username is already taken'
      })
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error'
      })
    }

    // Generic error - include error details for debugging
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      errorType: error.name || 'Unknown'
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
        message: 'Please provide email/username and password'
      })
    }

    // Determine if input is email or username
    const isEmail = email.includes('@')

    // Check for user by email or username (include password for comparison)
    let user
    if (isEmail) {
      user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    } else {
      // Username search - case-insensitive
      user = await User.findOne({
        username: { $regex: new RegExp(`^${email}$`, 'i') }
      }).select('+password')
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: isEmail ? 'No account found with this email' : 'No account found with this username',
        errorCode: isEmail ? 'EMAIL_NOT_FOUND' : 'USERNAME_NOT_FOUND'
      })
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
        errorCode: 'WRONG_PASSWORD'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Contact support.',
        errorCode: 'ACCOUNT_INACTIVE'
      })
    }

    // Auto-promote shieromanu@gmail.com to admin if not already
    if (user.email === 'shieromanu@gmail.com' && user.role !== 'admin') {
      user.role = 'admin'
      await user.save()
    }

    // Update lastActivity and mark as active on login
    await User.updateOne(
      { _id: user._id },
      { lastActivity: new Date(), isInactive: false }
    )

    // Generate token
    const token = generateToken(user._id)

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          isDev: user.isDev,
          canComment: user.canComment,
          canReact: user.canReact
        },
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error during login. Please try again.',
      errorCode: 'INTERNAL_ERROR',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
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
          role: user.role,
          avatar: user.avatar,
          isDev: user.isDev,
          canComment: user.canComment,
          canReact: user.canReact
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

export const updatePreferences = async (req, res) => {
  try {
    const { language, theme, dateFormat, showRelativeTime } = req.body

    const updateData = {}
    if (language) updateData['preferences.language'] = language
    if (theme) updateData['preferences.theme'] = theme
    if (dateFormat) updateData['preferences.dateFormat'] = dateFormat
    if (showRelativeTime !== undefined) updateData['preferences.showRelativeTime'] = showRelativeTime

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        preferences: user.preferences
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateAvatar = async (req, res) => {
  try {
    const { avatar, avatarBackground } = req.body

    // At least one field is required
    if (!avatar && !avatarBackground) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL or background is required'
      })
    }

    const updateData = {}
    if (avatar !== undefined) updateData.avatar = avatar
    if (avatarBackground !== undefined) updateData.avatarBackground = avatarBackground

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        avatar: user.avatar,
        avatarBackground: user.avatarBackground
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateAccount = async (req, res) => {
  try {
    const { email, username, currentPassword, newPassword } = req.body

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Verify current password
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required'
      })
    }

    const isPasswordValid = await user.comparePassword(currentPassword)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // Update email if provided
    if (email) {
      const emailRegex = /^\S+@\S+\.\S+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        })
      }

      // Check if email is already taken by another user
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } })
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'This email is already in use'
        })
      }

      user.email = email
    }

    // Update username if provided
    if (username) {
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Username must be between 3 and 30 characters'
        })
      }

      // Check if username is already taken by another user (case-insensitive)
      const usernameExists = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
        _id: { $ne: user._id }
      })
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken'
        })
      }

      user.username = username
    }

    // Update password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        })
      }

      user.password = newPassword
    }

    await user.save()

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          isDev: user.isDev,
          canComment: user.canComment,
          canReact: user.canReact
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

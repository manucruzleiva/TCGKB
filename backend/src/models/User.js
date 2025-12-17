import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isDev: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  canComment: {
    type: Boolean,
    default: true
  },
  canReact: {
    type: Boolean,
    default: true
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'es'],
      default: 'es'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD'],
      default: 'DD/MM/YYYY'
    },
    showRelativeTime: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Virtual to check if user is dev (always true for shieromanu@gmail.com)
userSchema.virtual('isDevUser').get(function() {
  const DEV_EMAILS = ['shieromanu@gmail.com']
  return this.isDev || DEV_EMAILS.includes(this.email)
})

// Ensure virtuals are included in JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Make isDevUser override isDev for response
    ret.isDev = ret.isDevUser
    delete ret.isDevUser
    return ret
  }
})

userSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.isDev = ret.isDevUser
    delete ret.isDevUser
    return ret
  }
})

// Indexes
userSchema.index({ email: 1 })
userSchema.index({ username: 1 })

const User = mongoose.model('User', userSchema)

export default User

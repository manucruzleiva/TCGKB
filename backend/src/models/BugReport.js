import mongoose from 'mongoose'

const bugReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  screenshot: {
    type: String, // Base64 encoded image
    default: null
  },
  pageUrl: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Allow anonymous reports
  },
  status: {
    type: String,
    enum: ['new', 'reviewing', 'in_progress', 'resolved', 'wont_fix'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
})

// Index for faster queries
bugReportSchema.index({ status: 1, createdAt: -1 })
bugReportSchema.index({ userId: 1 })

const BugReport = mongoose.model('BugReport', bugReportSchema)

export default BugReport

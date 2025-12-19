import mongoose from 'mongoose'

/**
 * ConfigChangeHistory - Tracks all changes to reputation configuration
 * Provides an audit trail of who changed what and when
 */
const configChangeHistorySchema = new mongoose.Schema({
  // User who made the change
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Type of change
  changeType: {
    type: String,
    enum: ['weights_updated', 'decay_updated', 'full_recalculation', 'manual_adjustment'],
    required: true
  },

  // Previous values (for weights/decay changes)
  previousValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // New values (for weights/decay changes)
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Summary of what changed
  summary: {
    type: String,
    default: ''
  },

  // For recalculation: stats about the operation
  recalculationStats: {
    usersAffected: { type: Number, default: 0 },
    executionTimeMs: { type: Number, default: 0 }
  }
}, {
  timestamps: true
})

// Index for efficient queries
configChangeHistorySchema.index({ createdAt: -1 })
configChangeHistorySchema.index({ changedBy: 1, createdAt: -1 })

/**
 * Static method to log a config change
 */
configChangeHistorySchema.statics.logChange = async function({
  changedBy,
  changeType,
  previousValues = null,
  newValues = null,
  summary = '',
  recalculationStats = null
}) {
  return this.create({
    changedBy,
    changeType,
    previousValues,
    newValues,
    summary,
    recalculationStats: recalculationStats || { usersAffected: 0, executionTimeMs: 0 }
  })
}

/**
 * Static method to get recent history
 */
configChangeHistorySchema.statics.getRecentHistory = async function(limit = 20) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('changedBy', 'username avatar')
    .lean()
}

const ConfigChangeHistory = mongoose.model('ConfigChangeHistory', configChangeHistorySchema)

export default ConfigChangeHistory

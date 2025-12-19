import mongoose from 'mongoose'

/**
 * ReputationLedger - Tracks all reputation point transactions
 * Each entry represents a single event that added or removed points
 */
const reputationLedgerSchema = new mongoose.Schema({
  // User who received/lost points
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Type of action that triggered points
  actionType: {
    type: String,
    enum: [
      'comment_created',      // User created a comment
      'comment_received_reaction', // User's comment received a reaction
      'mention_used',         // User used @ mention in a comment
      'reaction_given',       // User reacted to content
      'bug_reported',         // User reported a bug
      'bug_processed',        // User's bug was processed (bonus)
      'bug_dismissed',        // User's bug was dismissed (penalty)
      'deck_created',         // User created a deck
      'deck_received_reaction', // User's deck received a reaction
      'comment_moderated',    // User's comment was moderated (penalty)
      'comment_restored',     // Moderated comment was restored (reversal)
      'admin_adjustment'      // Manual adjustment by admin
    ],
    required: true,
    index: true
  },

  // Points awarded (positive) or deducted (negative)
  points: {
    type: Number,
    required: true
  },

  // Reference to the source entity (comment, deck, bug report, etc.)
  sourceType: {
    type: String,
    enum: ['comment', 'deck', 'bug_report', 'card', 'reaction', 'admin'],
    required: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // May be null for admin adjustments
  },

  // For reactions: who triggered the reaction
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Optional description/reason
  description: {
    type: String,
    default: ''
  },

  // For wither system: when these points expire
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },

  // Whether points have expired (withered)
  isExpired: {
    type: Boolean,
    default: false,
    index: true
  },

  // For reversals: reference to the original entry being reversed
  reversesEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReputationLedger',
    default: null
  },

  // Whether this entry has been reversed
  isReversed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
reputationLedgerSchema.index({ userId: 1, createdAt: -1 })
reputationLedgerSchema.index({ userId: 1, actionType: 1 })
reputationLedgerSchema.index({ userId: 1, isExpired: 1 })
reputationLedgerSchema.index({ sourceType: 1, sourceId: 1 })

// Virtual for checking if points are active (not expired, not reversed)
reputationLedgerSchema.virtual('isActive').get(function() {
  return !this.isExpired && !this.isReversed
})

// Static method to get user's total active reputation
reputationLedgerSchema.statics.getUserReputation = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isExpired: false,
        isReversed: false
      }
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$points' }
      }
    }
  ])

  return result[0]?.totalPoints || 0
}

// Static method to get user's reputation breakdown by action type
reputationLedgerSchema.statics.getUserReputationBreakdown = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isExpired: false,
        isReversed: false
      }
    },
    {
      $group: {
        _id: '$actionType',
        points: { $sum: '$points' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { points: -1 }
    }
  ])

  return result
}

const ReputationLedger = mongoose.model('ReputationLedger', reputationLedgerSchema)

export default ReputationLedger

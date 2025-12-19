import mongoose from 'mongoose'

/**
 * ReputationConfig - Stores configurable point weights for each action
 * This is a singleton document that holds all configuration
 */
const reputationConfigSchema = new mongoose.Schema({
  // Identifier (singleton pattern - always 'default')
  configId: {
    type: String,
    default: 'default',
    unique: true
  },

  // Point weights for each action type
  weights: {
    // Comments
    comment_created: {
      type: Number,
      default: 5,
      min: 0
    },
    comment_received_reaction: {
      type: Number,
      default: 2,
      min: 0
    },

    // Mentions
    mention_used: {
      type: Number,
      default: 1,
      min: 0
    },

    // Reactions (giving reactions)
    reaction_given: {
      type: Number,
      default: 1,
      min: 0
    },

    // Bug reports
    bug_reported: {
      type: Number,
      default: 3,
      min: 0
    },
    bug_processed: {
      type: Number,
      default: 10,
      min: 0
    },
    bug_dismissed: {
      type: Number,
      default: -5 // Penalty
    },

    // Decks
    deck_created: {
      type: Number,
      default: 10,
      min: 0
    },
    deck_received_reaction: {
      type: Number,
      default: 3,
      min: 0
    },

    // Moderation penalties
    comment_moderated: {
      type: Number,
      default: -20 // Penalty
    },
    comment_restored: {
      type: Number,
      default: 20 // Reversal (same magnitude as penalty)
    }
  },

  // Decay configuration (in days)
  decay: {
    // How many days until points expire
    comment_created: {
      type: Number,
      default: 60, // 2 months
      min: 0 // 0 = never expires
    },
    comment_received_reaction: {
      type: Number,
      default: 30,
      min: 0
    },
    mention_used: {
      type: Number,
      default: 30,
      min: 0
    },
    reaction_given: {
      type: Number,
      default: 30,
      min: 0
    },
    bug_reported: {
      type: Number,
      default: 90,
      min: 0
    },
    bug_processed: {
      type: Number,
      default: 0, // Never expires
      min: 0
    },
    bug_dismissed: {
      type: Number,
      default: 60,
      min: 0
    },
    deck_created: {
      type: Number,
      default: 0, // Never expires
      min: 0
    },
    deck_received_reaction: {
      type: Number,
      default: 30,
      min: 0
    },
    comment_moderated: {
      type: Number,
      default: 90, // Penalties last 3 months
      min: 0
    },
    comment_restored: {
      type: Number,
      default: 0, // Reversals match original
      min: 0
    }
  },

  // Last modified by (for audit)
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
})

// Static method to get the current config (or create default)
reputationConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne({ configId: 'default' })

  if (!config) {
    // Create default config
    config = await this.create({ configId: 'default' })
  }

  return config
}

// Static method to update config
reputationConfigSchema.statics.updateConfig = async function(updates, modifiedBy) {
  const config = await this.findOneAndUpdate(
    { configId: 'default' },
    {
      $set: {
        ...updates,
        lastModifiedBy: modifiedBy
      }
    },
    { new: true, upsert: true }
  )

  return config
}

// Instance method to get weight for an action
reputationConfigSchema.methods.getWeight = function(actionType) {
  return this.weights[actionType] || 0
}

// Instance method to get decay days for an action
reputationConfigSchema.methods.getDecayDays = function(actionType) {
  return this.decay[actionType] || 0
}

// Instance method to calculate expiration date
reputationConfigSchema.methods.getExpirationDate = function(actionType) {
  const decayDays = this.getDecayDays(actionType)

  if (decayDays === 0) {
    return null // Never expires
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + decayDays)
  return expiresAt
}

const ReputationConfig = mongoose.model('ReputationConfig', reputationConfigSchema)

export default ReputationConfig

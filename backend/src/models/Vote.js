import mongoose from 'mongoose'

const voteSchema = new mongoose.Schema({
  deckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: [true, 'Deck ID is required'],
    index: true
  },
  vote: {
    type: String,
    required: [true, 'Vote type is required'],
    enum: ['up', 'down']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  fingerprint: {
    type: String,
    default: null
  }
}, {
  timestamps: true
})

// Compound indexes for efficient lookups
voteSchema.index({ deckId: 1, userId: 1 }, { unique: true, sparse: true })
voteSchema.index({ deckId: 1, fingerprint: 1 }, { unique: true, sparse: true })

// Validation: Either userId or fingerprint must be present
voteSchema.pre('save', function(next) {
  if (!this.userId && !this.fingerprint) {
    return next(new Error('Either userId or fingerprint must be provided'))
  }
  next()
})

// Static method to get vote counts for a deck
voteSchema.statics.getVoteCounts = async function(deckId) {
  const result = await this.aggregate([
    { $match: { deckId: new mongoose.Types.ObjectId(deckId) } },
    {
      $group: {
        _id: '$vote',
        count: { $sum: 1 }
      }
    }
  ])

  const counts = { up: 0, down: 0 }
  result.forEach(r => {
    counts[r._id] = r.count
  })

  return counts
}

// Static method to get user's vote for a deck
voteSchema.statics.getUserVote = async function(deckId, userId, fingerprint) {
  const query = { deckId }

  if (userId) {
    query.userId = userId
  } else if (fingerprint) {
    query.fingerprint = fingerprint
  } else {
    return null
  }

  const vote = await this.findOne(query)
  return vote?.vote || null
}

const Vote = mongoose.model('Vote', voteSchema)

export default Vote

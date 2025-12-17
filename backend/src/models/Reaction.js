import mongoose from 'mongoose'

const reactionSchema = new mongoose.Schema({
  targetType: {
    type: String,
    required: [true, 'Target type is required'],
    enum: ['card', 'comment', 'attack', 'ability']
  },
  targetId: {
    type: String,
    required: [true, 'Target ID is required'],
    index: true
  },
  emoji: {
    type: String,
    required: [true, 'Emoji is required'],
    maxlength: [10, 'Emoji cannot exceed 10 characters']
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

// Compound indexes
reactionSchema.index({ targetType: 1, targetId: 1, emoji: 1 })
reactionSchema.index({ targetId: 1, userId: 1 }, { unique: true, sparse: true })
reactionSchema.index({ targetId: 1, fingerprint: 1 }, { unique: true, sparse: true })

// Validation: Either userId or fingerprint must be present
reactionSchema.pre('save', function(next) {
  if (!this.userId && !this.fingerprint) {
    return next(new Error('Either userId or fingerprint must be provided'))
  }
  next()
})

const Reaction = mongoose.model('Reaction', reactionSchema)

export default Reaction

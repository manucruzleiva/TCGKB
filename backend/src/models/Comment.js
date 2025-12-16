import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: [true, 'Card ID is required'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [2000, 'Content cannot exceed 2000 characters'],
    trim: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  },
  path: {
    type: String,
    required: true,
    index: true
  },
  depth: {
    type: Number,
    default: 0,
    min: 0
  },
  cardMentions: [{
    cardId: {
      type: String,
      required: true
    },
    cardName: {
      type: String,
      required: true
    },
    position: {
      type: Number,
      required: true
    }
  }],
  isHiddenByUser: {
    type: Boolean,
    default: false
  },
  hiddenAt: {
    type: Date,
    default: null
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  },
  moderationReason: {
    type: String,
    default: null,
    maxlength: [500, 'Moderation reason cannot exceed 500 characters']
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
commentSchema.index({ cardId: 1, createdAt: -1 })
commentSchema.index({ parentId: 1, createdAt: -1 })
commentSchema.index({ userId: 1, createdAt: -1 })
commentSchema.index({ path: 1 })

// Pre-save middleware to generate path
commentSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Ensure _id is generated
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId()
    }

    if (this.parentId) {
      // Find parent comment to build path
      const parent = await mongoose.model('Comment').findById(this.parentId)
      if (parent) {
        this.path = `${parent.path}/${this._id}`
        this.depth = parent.depth + 1
      } else {
        return next(new Error('Parent comment not found'))
      }
    } else {
      // Top-level comment
      this.path = this._id.toString()
      this.depth = 0
    }
  }
  next()
})

const Comment = mongoose.model('Comment', commentSchema)

export default Comment

import mongoose from 'mongoose'

const cardCacheSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: [true, 'Card ID is required'],
    unique: true,
    index: true
  },
  data: {
    type: Object,
    required: [true, 'Card data is required']
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date,
    default: Date.now
  },
  cachedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    index: true
  }
}, {
  timestamps: true
})

// Index for TTL cleanup
cardCacheSchema.index({ expiresAt: 1 })

// Index for sorting by release date (from cached data)
cardCacheSchema.index({ 'data.releaseDate': -1 })

const CardCache = mongoose.model('CardCache', cardCacheSchema)

export default CardCache

import mongoose from 'mongoose'

// Playset constants - maximum copies allowed in a deck
export const PLAYSET = {
  pokemon: 4,
  riftbound: 3
}

const collectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  cardId: {
    type: String,
    required: [true, 'Card ID is required'],
    trim: true,
    index: true
  },
  tcgSystem: {
    type: String,
    enum: ['pokemon', 'riftbound'],
    required: [true, 'TCG system is required'],
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative'],
    default: 1
  },
  // Cached card data for faster queries
  cardName: {
    type: String,
    trim: true
  },
  cardImage: {
    type: String
  },
  cardSet: {
    type: String
  },
  cardRarity: {
    type: String
  }
}, {
  timestamps: true
})

// Compound index for unique user-card combination
collectionSchema.index({ userId: 1, cardId: 1 }, { unique: true })

// Index for sorting and filtering
collectionSchema.index({ userId: 1, tcgSystem: 1 })
collectionSchema.index({ userId: 1, cardSet: 1 })

// Virtual to check if user has a complete playset
collectionSchema.virtual('hasPlayset').get(function() {
  const maxPlayset = PLAYSET[this.tcgSystem] || 4
  return this.quantity >= maxPlayset
})

// Virtual to get playset progress
collectionSchema.virtual('playsetProgress').get(function() {
  const maxPlayset = PLAYSET[this.tcgSystem] || 4
  return {
    owned: this.quantity,
    needed: maxPlayset,
    complete: this.quantity >= maxPlayset,
    percentage: Math.min(100, Math.round((this.quantity / maxPlayset) * 100))
  }
})

// Ensure virtuals are included in JSON
collectionSchema.set('toJSON', { virtuals: true })
collectionSchema.set('toObject', { virtuals: true })

const Collection = mongoose.model('Collection', collectionSchema)

export default Collection

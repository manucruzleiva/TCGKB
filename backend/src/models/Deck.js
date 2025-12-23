import mongoose from 'mongoose'

const deckCardSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    max: 60 // Allow up to 60 for Basic Energy cards (enforced by frontend)
  },
  // Cached card info for display
  name: String,
  supertype: String, // Pokemon: Pokemon/Trainer/Energy, Riftbound: Legend/Battlefield/Rune/Main Deck
  cardType: String, // Riftbound-specific: Legend, Battlefield, Rune (for categorization)
  type: String, // Riftbound card type: Unit, Spell, Gear (from Riftcodex API)
  imageSmall: String
}, { _id: false })

const deckSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Deck name is required'],
    trim: true,
    maxlength: [100, 'Deck name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  cards: {
    type: [deckCardSchema],
    default: [],
    validate: {
      validator: function(cards) {
        // Max 60 cards total
        const total = cards.reduce((sum, card) => sum + card.quantity, 0)
        return total <= 60
      },
      message: 'Deck cannot exceed 60 cards'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  // Predefined tags only - users select from list
  tags: [{
    type: String,
    trim: true,
    enum: [
      // Format tags
      'standard', 'expanded', 'unlimited', 'glc',
      // Archetype tags
      'aggro', 'control', 'combo', 'midrange', 'stall', 'mill', 'turbo',
      // Strategy tags
      'meta', 'budget', 'fun', 'competitive', 'casual', 'beginner-friendly',
      // Type-focused tags
      'fire', 'water', 'grass', 'electric', 'psychic', 'fighting', 'dark', 'steel', 'dragon', 'colorless', 'fairy',
      // Special tags
      'ex-focused', 'v-focused', 'vstar', 'vmax', 'single-prize', 'lost-zone', 'rapid-strike', 'single-strike'
    ]
  }],
  // Stats
  views: {
    type: Number,
    default: 0
  },
  copies: {
    type: Number,
    default: 0
  },
  // Unique hash of the deck composition for duplicate detection
  compositionHash: {
    type: String,
    index: true,
    default: null
  },
  // Flag indicating if this deck is a known duplicate/copy
  isOriginal: {
    type: Boolean,
    default: true
  },
  // Reference to the original deck if this is a copy
  copiedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    default: null
  },
  // TCG system this deck belongs to (pokemon, riftbound)
  // Prevents mixing cards from different TCGs
  tcgSystem: {
    type: String,
    enum: ['pokemon', 'riftbound'],
    default: 'pokemon',
    index: true
  }
}, {
  timestamps: true
})

// Virtual for total card count
deckSchema.virtual('totalCards').get(function() {
  return this.cards.reduce((sum, card) => sum + card.quantity, 0)
})

// Virtual for card breakdown
deckSchema.virtual('breakdown').get(function() {
  const breakdown = { pokemon: 0, trainer: 0, energy: 0 }
  this.cards.forEach(card => {
    const type = (card.supertype || '').toLowerCase()
    if (type === 'pokémon' || type === 'pokemon') {
      breakdown.pokemon += card.quantity
    } else if (type === 'trainer') {
      breakdown.trainer += card.quantity
    } else if (type === 'energy') {
      breakdown.energy += card.quantity
    }
  })
  return breakdown
})

// Include virtuals in JSON
deckSchema.set('toJSON', { virtuals: true })
deckSchema.set('toObject', { virtuals: true })

// Indexes
deckSchema.index({ userId: 1 })
deckSchema.index({ isPublic: 1, createdAt: -1 })
deckSchema.index({ name: 'text', description: 'text' })
deckSchema.index({ tags: 1 })

// Static method to get available tags categorized
deckSchema.statics.getAvailableTags = function() {
  return {
    format: ['standard', 'expanded', 'unlimited', 'glc'],
    archetype: ['aggro', 'control', 'combo', 'midrange', 'stall', 'mill', 'turbo'],
    strategy: ['meta', 'budget', 'fun', 'competitive', 'casual', 'beginner-friendly'],
    type: ['fire', 'water', 'grass', 'electric', 'psychic', 'fighting', 'dark', 'steel', 'dragon', 'colorless', 'fairy'],
    special: ['ex-focused', 'v-focused', 'vstar', 'vmax', 'single-prize', 'lost-zone', 'rapid-strike', 'single-strike']
  }
}

const Deck = mongoose.model('Deck', deckSchema)

export default Deck

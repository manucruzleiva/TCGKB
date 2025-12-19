import mongoose from 'mongoose'

/**
 * Reprint Model
 *
 * Tracks relationships between cards that are reprints of each other.
 * A "canonical" card represents the original or primary version,
 * and other cards are linked as variants.
 */

const reprintSchema = new mongoose.Schema({
  // Unique identifier for this reprint group (normalized card name)
  canonicalName: {
    type: String,
    required: true,
    index: true
  },
  // TCG system this reprint group belongs to
  tcgSystem: {
    type: String,
    enum: ['pokemon', 'riftbound'],
    required: true,
    index: true
  },
  // The "primary" card ID (usually the original/oldest version)
  canonicalCardId: {
    type: String,
    required: true,
    index: true
  },
  // All card IDs that are reprints of this canonical card
  variants: [{
    cardId: {
      type: String,
      required: true
    },
    // Type of reprint
    reprintType: {
      type: String,
      enum: ['exact', 'alternate_art', 'promo', 'special_art', 'regional', 'reverse_holo'],
      default: 'exact'
    },
    // Set the card belongs to
    setId: String,
    setName: String,
    // Release date for sorting
    releaseDate: Date,
    // Card image URL for quick preview
    imageUrl: String,
    // Rarity of this variant
    rarity: String,
    // Additional notes
    notes: String,
    // Whether this was auto-detected or manually curated
    autoDetected: {
      type: Boolean,
      default: true
    },
    // Confidence score from auto-detection (0-100)
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    // Flag for manual review needed
    needsReview: {
      type: Boolean,
      default: false
    }
  }],
  // Total count of variants (for quick queries)
  variantCount: {
    type: Number,
    default: 0
  },
  // Normalized data for matching (lowercase, stripped of special chars)
  normalizedName: {
    type: String,
    index: true
  },
  // Key attributes for matching (attacks, abilities, HP, etc.)
  matchingAttributes: {
    hp: Number,
    attacks: [{
      name: String,
      damage: String,
      cost: [String]
    }],
    abilities: [{
      name: String,
      text: String
    }]
  },
  // Last time this group was updated
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound index for finding reprints by card ID
reprintSchema.index({ 'variants.cardId': 1 })

// Compound index for TCG system and normalized name
reprintSchema.index({ tcgSystem: 1, normalizedName: 1 })

// Helper to normalize card names for matching
reprintSchema.statics.normalizeName = function(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')        // Normalize whitespace
    .trim()
}

// Find all reprints for a given card ID
reprintSchema.statics.findReprintsForCard = async function(cardId) {
  const group = await this.findOne({
    $or: [
      { canonicalCardId: cardId },
      { 'variants.cardId': cardId }
    ]
  })
  return group
}

// Get all card IDs in a reprint group
reprintSchema.methods.getAllCardIds = function() {
  const ids = [this.canonicalCardId]
  this.variants.forEach(v => {
    if (!ids.includes(v.cardId)) {
      ids.push(v.cardId)
    }
  })
  return ids
}

const Reprint = mongoose.model('Reprint', reprintSchema)

export default Reprint

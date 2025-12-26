#!/usr/bin/env node
/**
 * Clear Pokemon Cache Script
 * Deletes all Pokemon cards from CardCache to force re-caching with TCGdex
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

function buildMongoUri() {
  const endpoint = process.env.DB_ENDPOINT
  const clientId = process.env.DB_CLIENT_ID
  const clientSecret = process.env.DB_CLIENT_SECRET
  const legacyUri = process.env.MONGODB_URI

  if (endpoint && clientId && clientSecret) {
    const host = endpoint.replace(/^mongodb\+srv:\/\//, '').replace(/\/$/, '')
    const encodedId = encodeURIComponent(clientId)
    const encodedSecret = encodeURIComponent(clientSecret)
    return `mongodb+srv://${encodedId}:${encodedSecret}@${host}/tcgkb?retryWrites=true&w=majority`
  }

  if (legacyUri) {
    return legacyUri.trim()
  }

  return null
}

const MONGODB_URI = buildMongoUri()

const cardCacheSchema = new mongoose.Schema({
  cardId: { type: String, required: true, unique: true, index: true },
  data: { type: Object, required: true },
  tcgSystem: { type: String, enum: ['pokemon', 'riftbound'], default: 'pokemon', index: true },
  viewCount: { type: Number, default: 0 },
  lastViewed: { type: Date, default: Date.now },
  cachedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
}, { timestamps: true })

const CardCache = mongoose.model('CardCache', cardCacheSchema)

async function main() {
  console.log('='.repeat(60))
  console.log('Clear Pokemon Cache Script')
  console.log('='.repeat(60))

  if (!MONGODB_URI) {
    console.error('ERROR: Database connection not configured')
    process.exit(1)
  }

  console.log('Connecting to MongoDB...')
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✓ Connected to MongoDB')
  } catch (error) {
    console.error('✗ Failed to connect:', error.message)
    process.exit(1)
  }

  // Get current count
  const currentCount = await CardCache.countDocuments({ tcgSystem: 'pokemon' })
  console.log(`\nCurrent Pokemon cards in cache: ${currentCount}`)

  if (currentCount === 0) {
    console.log('No Pokemon cards to delete. Cache is already empty.')
    await mongoose.disconnect()
    process.exit(0)
  }

  // Confirm deletion
  console.log('\n⚠️  WARNING: This will delete ALL Pokemon cards from the cache!')
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...')

  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log('\nDeleting Pokemon cards...')
  const result = await CardCache.deleteMany({ tcgSystem: 'pokemon' })

  console.log(`✓ Deleted ${result.deletedCount} Pokemon cards`)

  // Verify deletion
  const remainingCount = await CardCache.countDocuments({ tcgSystem: 'pokemon' })
  console.log(`Remaining Pokemon cards: ${remainingCount}`)

  const riftboundCount = await CardCache.countDocuments({ tcgSystem: 'riftbound' })
  console.log(`Riftbound cards (preserved): ${riftboundCount}`)

  console.log('\n' + '='.repeat(60))
  console.log('CACHE CLEARED SUCCESSFULLY')
  console.log('='.repeat(60))
  console.log('\nNext steps:')
  console.log('1. Run: node scripts/sync-pokemon-tcgdex.js')
  console.log('2. Or use admin panel to trigger cache sync')
  console.log('')

  await mongoose.disconnect()
  console.log('Disconnected from MongoDB')
  process.exit(0)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

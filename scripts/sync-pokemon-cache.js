#!/usr/bin/env node
/**
 * Pokemon Card Cache Sync Script
 *
 * This script fetches all Pokemon cards from TCGdex API
 * and inserts them into the MongoDB CardCache collection.
 *
 * Usage:
 *   node scripts/sync-pokemon-cache.js
 *
 * Environment variables (choose one method):
 *   Method 1 (Recommended - Service User):
 *     - DB_ENDPOINT: MongoDB cluster endpoint (mongodb+srv://cluster.mongodb.net)
 *     - DB_CLIENT_ID: Service user username
 *     - DB_CLIENT_SECRET: Service user password
 *
 *   Method 2 (Legacy):
 *     - MONGODB_URI: Full MongoDB connection string
 *
 * You can create a .env file in the project root or pass them inline:
 *   DB_ENDPOINT="mongodb+srv://cluster.mongodb.net" DB_CLIENT_ID="user" DB_CLIENT_SECRET="pass" node scripts/sync-pokemon-cache.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en'

/**
 * Build MongoDB URI from environment variables
 * Supports both new service user method and legacy MONGODB_URI
 */
function buildMongoUri() {
  const endpoint = process.env.DB_ENDPOINT
  const clientId = process.env.DB_CLIENT_ID
  const clientSecret = process.env.DB_CLIENT_SECRET
  const legacyUri = process.env.MONGODB_URI

  // New system: construct URI from separate components
  if (endpoint && clientId && clientSecret) {
    const host = endpoint.replace(/^mongodb\+srv:\/\//, '').replace(/\/$/, '')
    const encodedId = encodeURIComponent(clientId)
    const encodedSecret = encodeURIComponent(clientSecret)
    return `mongodb+srv://${encodedId}:${encodedSecret}@${host}/tcgkb?retryWrites=true&w=majority`
  }

  // Legacy fallback
  if (legacyUri) {
    return legacyUri.trim()
  }

  return null
}

const MONGODB_URI = buildMongoUri()

// CardCache schema (inline to make script standalone)
const cardCacheSchema = new mongoose.Schema({
  cardId: { type: String, required: true, unique: true, index: true },
  data: { type: Object, required: true },
  tcgSystem: { type: String, enum: ['pokemon', 'riftbound'], default: 'pokemon', index: true },
  viewCount: { type: Number, default: 0 },
  lastViewed: { type: Date, default: Date.now },
  cachedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 days
}, { timestamps: true })

const CardCache = mongoose.model('CardCache', cardCacheSchema)

// Helper to make API requests with retry logic
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (i === retries - 1) throw error
      console.log(`  Retry ${i + 1}/${retries} after error: ${error.message}`)
      await sleep(delay)
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchAllSets() {
  console.log('Fetching all Pokemon sets from TCGdex...')
  const allSets = await fetchWithRetry(`${TCGDEX_API_BASE}/sets`)

  // Filter: Only Scarlet & Violet sets (sv01, sv02, etc.)
  const svSets = allSets.filter(set => {
    const id = set.id?.toLowerCase() || ''
    return id.startsWith('sv') || id.startsWith('swsh') || id.startsWith('sm')
  })

  console.log(`Found ${allSets.length} total sets, filtered to ${svSets.length} SV/SWSH/SM sets`)

  // Map TCGdex sets to expected format
  return svSets.map(set => ({
    id: set.id,
    name: set.name,
    logo: set.logo,
    symbol: set.symbol,
    cardCount: set.cardCount,
    series: inferSeries(set.id),
    releaseDate: inferReleaseDate(set.id),
    printedTotal: set.cardCount?.total || 0,
    total: set.cardCount?.total || 0
  }))
}

async function fetchCardsForSet(setId, setName) {
  // Get set details from TCGdex
  const setData = await fetchWithRetry(`${TCGDEX_API_BASE}/sets/${setId}`)
  const cardSummaries = setData.cards || []

  console.log(`  Fetching ${cardSummaries.length} cards for set "${setName}"`)

  // Fetch full details for each card in batches of 10
  const cards = []
  for (let i = 0; i < cardSummaries.length; i += 10) {
    const batch = cardSummaries.slice(i, i + 10)
    const batchPromises = batch.map(card =>
      fetchWithRetry(`${TCGDEX_API_BASE}/cards/${card.id}`)
        .catch(err => {
          console.error(`    Failed to fetch card ${card.id}: ${err.message}`)
          return null
        })
    )

    const batchResults = await Promise.all(batchPromises)
    const validCards = batchResults.filter(Boolean)
    cards.push(...validCards)

    console.log(`  Progress: ${Math.min(i + 10, cardSummaries.length)}/${cardSummaries.length} cards fetched`)

    // Rate limiting - 100ms between batches
    if (i + 10 < cardSummaries.length) {
      await sleep(100)
    }
  }

  console.log(`  Fetched ${cards.length}/${cardSummaries.length} cards successfully`)

  // Transform all cards to Pokemon TCG API format
  return cards.map(transformCard)
}

/**
 * Store TCGdex card with minimal transformation
 * Just add images URLs and keep everything else as-is
 */
function transformCard(card) {
  if (!card) return null

  return {
    ...card,  // Keep ALL TCGdex fields as-is
    // Add image URLs
    images: card.image ? {
      small: `${card.image}/low.webp`,
      large: `${card.image}/high.webp`
    } : undefined,
    // System marker
    tcgSystem: 'pokemon'
  }
}

/**
 * Infer series from set ID
 */
function inferSeries(setId) {
  if (!setId) return 'Unknown'

  const prefixMap = {
    'sv': 'Scarlet & Violet',
    'swsh': 'Sword & Shield',
    'sm': 'Sun & Moon',
    'xy': 'XY',
    'bw': 'Black & White',
    'dp': 'Diamond & Pearl',
    'pl': 'Platinum',
    'hgss': 'HeartGold & SoulSilver',
    'col': 'Call of Legends',
    'ex': 'EX',
    'pop': 'POP',
    'base': 'Base'
  }

  const lowerSetId = setId.toLowerCase()
  for (const [prefix, series] of Object.entries(prefixMap)) {
    if (lowerSetId.startsWith(prefix)) return series
  }

  return 'Other'
}

/**
 * Infer release date from set ID (approximate for newer sets)
 */
function inferReleaseDate(setId) {
  if (!setId) return null

  // Scarlet & Violet sets with known dates
  const svDates = {
    'sv01': '2023-03-31',
    'sv02': '2023-06-09',
    'sv03': '2023-08-11',
    'sv03.5': '2023-09-22',
    'sv04': '2023-11-03',
    'sv04.5': '2024-01-26',
    'sv05': '2024-03-22',
    'sv06': '2024-05-24',
    'sv06.5': '2024-08-02',
    'sv07': '2024-09-13',
    'sv08': '2024-11-08',
    'sv09': '2025-02-07',
    'sv10': '2025-05-09'
  }

  return svDates[setId] || null
}

async function upsertCards(cards) {
  const operations = cards.map(card => ({
    updateOne: {
      filter: { cardId: card.id },
      update: {
        $set: {
          cardId: card.id,
          data: { ...card, tcgSystem: 'pokemon' },
          tcgSystem: 'pokemon',
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        $setOnInsert: {
          viewCount: 0,
          lastViewed: new Date()
        }
      },
      upsert: true
    }
  }))

  if (operations.length > 0) {
    const result = await CardCache.bulkWrite(operations, { ordered: false })
    return {
      inserted: result.upsertedCount,
      modified: result.modifiedCount
    }
  }

  return { inserted: 0, modified: 0 }
}

async function main() {
  console.log('='.repeat(60))
  console.log('Pokemon Card Cache Sync Script')
  console.log('='.repeat(60))

  // Check environment
  if (!MONGODB_URI) {
    console.error('ERROR: Database connection not configured')
    console.error('')
    console.error('Option 1 (Recommended - Service User):')
    console.error('  DB_ENDPOINT="mongodb+srv://cluster.mongodb.net" \\')
    console.error('  DB_CLIENT_ID="username" \\')
    console.error('  DB_CLIENT_SECRET="password" \\')
    console.error('  node scripts/sync-pokemon-cache.js')
    console.error('')
    console.error('Option 2 (Legacy):')
    console.error('  MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/dbname" node scripts/sync-pokemon-cache.js')
    process.exit(1)
  }

  console.log('Using TCGdex API (free, no API key required)')
  console.log('')

  // Connect to MongoDB
  console.log('Connecting to MongoDB...')
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message)
    process.exit(1)
  }

  // Get initial count
  const initialCount = await CardCache.countDocuments({ tcgSystem: 'pokemon' })
  console.log(`Current Pokemon cards in cache: ${initialCount}`)
  console.log('')

  // Fetch all sets
  const sets = await fetchAllSets()

  let totalInserted = 0
  let totalModified = 0
  let totalCards = 0
  let processedSets = 0

  console.log('')
  console.log('Processing sets...')
  console.log('-'.repeat(60))

  for (const set of sets) {
    processedSets++
    console.log(`[${processedSets}/${sets.length}] Processing set: ${set.name} (${set.id})`)

    try {
      const cards = await fetchCardsForSet(set.id, set.name)
      totalCards += cards.length

      if (cards.length > 0) {
        const result = await upsertCards(cards)
        totalInserted += result.inserted
        totalModified += result.modified
        console.log(`  Saved: ${result.inserted} new, ${result.modified} updated`)
      }

      // Small delay between sets to be nice to the API
      await sleep(200)

    } catch (error) {
      console.error(`  ERROR processing set ${set.name}: ${error.message}`)
    }
  }

  // Final count
  const finalCount = await CardCache.countDocuments({ tcgSystem: 'pokemon' })

  console.log('')
  console.log('='.repeat(60))
  console.log('SYNC COMPLETE')
  console.log('='.repeat(60))
  console.log(`Sets processed: ${processedSets}`)
  console.log(`Cards fetched from API: ${totalCards}`)
  console.log(`New cards inserted: ${totalInserted}`)
  console.log(`Existing cards updated: ${totalModified}`)
  console.log(`Total Pokemon cards in cache: ${finalCount}`)
  console.log('')

  await mongoose.disconnect()
  console.log('Disconnected from MongoDB')
  process.exit(0)
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

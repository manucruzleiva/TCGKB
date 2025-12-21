#!/usr/bin/env node
/**
 * Pokemon Card Cache Sync Script
 *
 * This script fetches all Pokemon cards from the Pokemon TCG API
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
 *   Optional:
 *     - POKEMON_TCG_API_KEY: Pokemon TCG API key (recommended for higher rate limits)
 *
 * You can create a .env file in the project root or pass them inline:
 *   DB_ENDPOINT="mongodb+srv://cluster.mongodb.net" DB_CLIENT_ID="user" DB_CLIENT_SECRET="pass" node scripts/sync-pokemon-cache.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const POKEMON_API_BASE = 'https://api.pokemontcg.io/v2'
const POKEMON_API_KEY = process.env.POKEMON_TCG_API_KEY || ''

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

// Helper to make API requests with rate limiting
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  const headers = {}
  if (POKEMON_API_KEY) {
    headers['X-Api-Key'] = POKEMON_API_KEY
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { headers })

      if (response.status === 429) {
        // Rate limited - wait longer
        console.log(`  Rate limited, waiting ${delay * 2}ms...`)
        await sleep(delay * 2)
        continue
      }

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
  console.log('Fetching all Pokemon TCG sets...')
  const data = await fetchWithRetry(`${POKEMON_API_BASE}/sets?orderBy=-releaseDate`)
  console.log(`Found ${data.data.length} sets`)
  return data.data
}

async function fetchCardsForSet(setId, setName) {
  const cards = []
  let page = 1
  const pageSize = 250

  while (true) {
    const url = `${POKEMON_API_BASE}/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}`
    const data = await fetchWithRetry(url)

    if (!data.data || data.data.length === 0) break

    cards.push(...data.data)

    const totalCount = data.totalCount || 0
    console.log(`  Set "${setName}": Page ${page}, got ${data.data.length} cards (total: ${cards.length}/${totalCount})`)

    if (cards.length >= totalCount || data.data.length < pageSize) break

    page++
    await sleep(100) // Small delay between pages
  }

  return cards
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

  console.log(`API Key: ${POKEMON_API_KEY ? 'Configured' : 'Not set (rate limits may apply)'}`)
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

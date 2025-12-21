#!/usr/bin/env node
/**
 * Pokemon Card Cache Sync Script (TCGdex)
 *
 * This script fetches all Pokemon cards from TCGdex API
 * and inserts them into the MongoDB CardCache collection.
 *
 * TCGdex is faster and more reliable than pokemontcg.io
 *
 * Usage:
 *   node scripts/sync-pokemon-tcgdex.js
 *
 * Environment variables:
 *   - DB_ENDPOINT: MongoDB cluster endpoint
 *   - DB_CLIENT_ID: Database user username
 *   - DB_CLIENT_SECRET: Database user password
 *   - MONGODB_URI: (Alternative) Full MongoDB connection string
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import TCGdex from '@tcgdex/sdk'

// Load environment variables from .env file
dotenv.config()

// Initialize TCGdex SDK
const tcgdex = new TCGdex('en')

/**
 * Build MongoDB URI from environment variables
 */
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

// CardCache schema (inline to make script standalone)
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

/**
 * Transform TCGdex card to our standard format
 */
function transformCard(card, setInfo = null) {
  if (!card) return null

  const images = {}
  if (card.image) {
    images.small = `${card.image}/low.webp`
    images.large = `${card.image}/high.webp`
  }

  const set = setInfo ? {
    id: setInfo.id,
    name: setInfo.name,
    series: setInfo.serie?.name || null,
    releaseDate: setInfo.releaseDate || null,
    logo: setInfo.logo ? `${setInfo.logo}/high.webp` : null,
    symbol: setInfo.symbol ? `${setInfo.symbol}/high.webp` : null,
    legalities: {
      standard: setInfo.legal?.standard ? 'Legal' : 'Not Legal',
      expanded: setInfo.legal?.expanded ? 'Legal' : 'Not Legal'
    }
  } : {
    id: card.set?.id,
    name: card.set?.name || 'Unknown Set',
    series: card.set?.serie?.name || null,
    releaseDate: card.set?.releaseDate || null
  }

  const attacks = (card.attacks || []).map(attack => ({
    name: attack.name,
    cost: attack.cost || [],
    damage: attack.damage || '',
    text: attack.effect || ''
  }))

  const abilities = (card.abilities || []).map(ability => ({
    name: ability.name,
    text: ability.effect || '',
    type: ability.type || 'Ability'
  }))

  return {
    id: `${set.id || 'unknown'}-${card.localId || card.id}`,
    localId: card.localId || card.id,
    name: card.name,
    tcgSystem: 'pokemon',
    supertype: card.category || 'Pokemon',
    subtypes: card.stage ? [card.stage] : [],
    hp: card.hp ? String(card.hp) : null,
    types: card.types || [],
    evolvesFrom: card.evolveFrom || null,
    evolvesTo: card.evolvesTo || [],
    attacks,
    abilities,
    weaknesses: card.weaknesses || [],
    resistances: card.resistances || [],
    retreatCost: card.retreat ? Array(card.retreat).fill('Colorless') : [],
    regulationMark: card.regulationMark || null,
    rarity: card.rarity || 'Common',
    artist: card.illustrator || null,
    number: card.localId || card.id,
    images,
    set,
    description: card.description || null,
    dexId: card.dexId || [],
    level: card.level || null,
    suffix: card.suffix || null
  }
}

/**
 * Upsert cards to MongoDB
 */
async function upsertCards(cards) {
  const operations = cards.map(card => ({
    updateOne: {
      filter: { cardId: card.id },
      update: {
        $set: {
          cardId: card.id,
          data: card,
          tcgSystem: 'pokemon',
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
  console.log('Pokemon Card Cache Sync Script (TCGdex)')
  console.log('='.repeat(60))

  if (!MONGODB_URI) {
    console.error('ERROR: Database connection not configured')
    console.error('')
    console.error('Set environment variables:')
    console.error('  DB_ENDPOINT="mongodb+srv://cluster.mongodb.net"')
    console.error('  DB_CLIENT_ID="username"')
    console.error('  DB_CLIENT_SECRET="password"')
    process.exit(1)
  }

  console.log('Data Source: TCGdex (api.tcgdex.net)')
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

  // Fetch all sets from TCGdex
  console.log('Fetching all sets from TCGdex...')
  let sets
  try {
    sets = await tcgdex.fetch('sets')
    console.log(`Found ${sets.length} sets`)
  } catch (error) {
    console.error('Failed to fetch sets:', error.message)
    process.exit(1)
  }

  let totalInserted = 0
  let totalModified = 0
  let totalCards = 0
  let processedSets = 0
  let failedSets = 0

  console.log('')
  console.log('Processing sets...')
  console.log('-'.repeat(60))

  for (const setRef of sets) {
    processedSets++

    try {
      // Fetch full set details
      const set = await tcgdex.fetch('sets', setRef.id)

      if (!set || !set.cards || set.cards.length === 0) {
        console.log(`[${processedSets}/${sets.length}] Set "${setRef.name}" (${setRef.id}): No cards`)
        continue
      }

      console.log(`[${processedSets}/${sets.length}] Processing set: ${set.name} (${set.id}) - ${set.cards.length} cards`)

      // Fetch all cards from this set
      const cards = []
      for (const cardRef of set.cards) {
        try {
          const card = await tcgdex.fetch('cards', set.id, cardRef.localId)
          if (card) {
            const transformed = transformCard(card, set)
            if (transformed) {
              cards.push(transformed)
            }
          }
        } catch (cardError) {
          // Skip individual card errors
        }

        // Small delay between cards to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      totalCards += cards.length

      if (cards.length > 0) {
        const result = await upsertCards(cards)
        totalInserted += result.inserted
        totalModified += result.modified
        console.log(`  Saved: ${result.inserted} new, ${result.modified} updated (${cards.length} total)`)
      }

      // Small delay between sets
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`  ERROR processing set ${setRef.name}: ${error.message}`)
      failedSets++
    }
  }

  // Final count
  const finalCount = await CardCache.countDocuments({ tcgSystem: 'pokemon' })

  console.log('')
  console.log('='.repeat(60))
  console.log('SYNC COMPLETE')
  console.log('='.repeat(60))
  console.log(`Sets processed: ${processedSets}`)
  console.log(`Sets failed: ${failedSets}`)
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

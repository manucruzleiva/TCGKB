import mongoose from 'mongoose'
import dotenv from 'dotenv'
import CardCache from '../models/CardCache.js'
import riftboundService from '../services/riftboundTCG.service.js'
import log from '../utils/logger.js'
import { buildMongoUri } from '../utils/mongoUri.js'

// Load environment variables
dotenv.config()

const MODULE = 'CacheRiftbound'

/**
 * Cache all cards from Riftbound TCG
 * Uses api.riftcodex.com as the data source
 */
async function cacheRiftboundCards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(buildMongoUri())
    log.info(MODULE, 'Connected to MongoDB')

    log.info(MODULE, '=== Starting Riftbound card cache ===')

    // Fetch all Riftbound cards using the existing service
    const cards = await riftboundService.getAllCards()

    if (!cards || cards.length === 0) {
      log.warn(MODULE, 'No cards returned from Riftbound API')
      return { success: false, count: 0, message: 'No cards returned from API' }
    }

    log.info(MODULE, `Fetched ${cards.length} cards from Riftbound API`)

    // Cache all cards
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    let cachedCount = 0
    let errors = 0

    for (const card of cards) {
      try {
        await CardCache.findOneAndUpdate(
          { cardId: card.id },
          {
            cardId: card.id,
            data: card,
            tcgSystem: 'riftbound',
            cachedAt: new Date(),
            expiresAt,
            viewCount: 0,
            lastViewed: new Date()
          },
          { upsert: true, new: true }
        )
        cachedCount++

        // Log progress every 50 cards
        if (cachedCount % 50 === 0) {
          log.info(MODULE, `Progress: ${cachedCount}/${cards.length} cards cached`)
        }
      } catch (cardError) {
        log.error(MODULE, `Failed to cache card ${card.id}:`, cardError.message)
        errors++
      }
    }

    log.info(MODULE, '\n=== CACHING COMPLETE ===')
    log.info(MODULE, `Total cards cached: ${cachedCount}`)
    if (errors > 0) {
      log.warn(MODULE, `Errors encountered: ${errors}`)
    }

    // Get cache statistics
    const totalRiftbound = await CardCache.countDocuments({ tcgSystem: 'riftbound' })
    const totalCache = await CardCache.countDocuments()
    log.info(MODULE, `Riftbound cards in cache: ${totalRiftbound}`)
    log.info(MODULE, `Total cards in cache: ${totalCache}`)

    return {
      success: true,
      count: cachedCount,
      errors,
      totalRiftbound,
      totalCache
    }

  } catch (error) {
    log.error(MODULE, 'Caching failed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    log.info(MODULE, 'MongoDB connection closed')
  }
}

// Export for use as module
export { cacheRiftboundCards }

// Run as standalone script
if (process.argv[1].includes('cacheRiftbound')) {
  cacheRiftboundCards()
    .then((result) => {
      console.log('✅ Script completed successfully')
      console.log(`   Cached: ${result.count} cards`)
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

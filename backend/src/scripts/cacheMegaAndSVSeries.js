import pokemon from 'pokemontcgsdk'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import CardCache from '../models/CardCache.js'
import log from '../utils/logger.js'

// Load environment variables
dotenv.config()

// Configure Pokemon TCG SDK
pokemon.configure({ apiKey: process.env.POKEMON_TCG_API_KEY })

const MODULE = 'CacheMegaSVSeries'

/**
 * Cache all cards from Mega Evolution and Scarlet & Violet series
 */
async function cacheMegaAndSVSeries() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    log.info(MODULE, 'Connected to MongoDB')

    // Fetch all Pokemon sets
    const allSets = await pokemon.set.all()
    log.info(MODULE, `Found ${allSets.length} total sets`)

    // Filter for Mega Evolution (me1) and Scarlet & Violet (sv*) series
    const megaSets = allSets.filter(set =>
      set.series === 'XY' && set.id === 'me1'
    )

    const svSets = allSets.filter(set =>
      set.series === 'Scarlet & Violet'
    )

    const targetSets = [...megaSets, ...svSets]

    log.info(MODULE, `Found ${megaSets.length} Mega Evolution sets`)
    log.info(MODULE, `Found ${svSets.length} Scarlet & Violet sets`)
    log.info(MODULE, `Total sets to cache: ${targetSets.length}`)

    let totalCardsCached = 0
    let setsProcessed = 0

    // Process each set
    for (const set of targetSets) {
      try {
        log.info(MODULE, `\n=== Processing set: ${set.name} (${set.id}) ===`)
        log.info(MODULE, `Set total cards: ${set.total}`)

        // Fetch all cards from this set (with pagination)
        let allCardsFromSet = []
        let page = 1
        let hasMore = true

        while (hasMore) {
          const result = await pokemon.card.where({
            q: `set.id:${set.id}`,
            page,
            pageSize: 250
          })

          const cards = result.data || []
          allCardsFromSet = allCardsFromSet.concat(cards)

          log.info(MODULE, `  Page ${page}: fetched ${cards.length} cards`)

          if (cards.length < 250) {
            hasMore = false
          } else {
            page++
          }

          // Rate limit - wait 100ms between requests
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        log.info(MODULE, `  Total cards fetched from ${set.name}: ${allCardsFromSet.length}`)

        // Cache all cards from this set
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        for (const card of allCardsFromSet) {
          const cardData = { ...card, tcgSystem: 'pokemon' }

          await CardCache.findOneAndUpdate(
            { cardId: cardData.id },
            {
              cardId: cardData.id,
              data: cardData,
              cachedAt: new Date(),
              expiresAt,
              viewCount: 0,
              lastViewed: new Date()
            },
            { upsert: true, new: true }
          )

          totalCardsCached++
        }

        setsProcessed++
        log.info(MODULE, `  ✅ Cached ${allCardsFromSet.length} cards from ${set.name}`)
        log.info(MODULE, `  Progress: ${setsProcessed}/${targetSets.length} sets`)

      } catch (setError) {
        log.error(MODULE, `Failed to process set ${set.name}:`, setError)
      }
    }

    log.info(MODULE, '\n=== CACHING COMPLETE ===')
    log.info(MODULE, `Total sets processed: ${setsProcessed}/${targetSets.length}`)
    log.info(MODULE, `Total cards cached: ${totalCardsCached}`)

    // Get cache statistics
    const cacheStats = await CardCache.countDocuments()
    log.info(MODULE, `Total cards in cache: ${cacheStats}`)

  } catch (error) {
    log.error(MODULE, 'Caching failed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    log.info(MODULE, 'MongoDB connection closed')
  }
}

// Run the script
cacheMegaAndSVSeries()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

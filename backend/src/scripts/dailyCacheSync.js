import mongoose from 'mongoose'
import dotenv from 'dotenv'
import pokemon from 'pokemontcgsdk'
import CardCache from '../models/CardCache.js'
import User from '../models/User.js'
import riftboundService from '../services/riftboundTCG.service.js'
import log from '../utils/logger.js'

// Load environment variables
dotenv.config()

const MODULE = 'DailyCacheSync'

// Configure Pokemon TCG SDK
pokemon.configure({ apiKey: process.env.POKEMON_TCG_API_KEY })

// Valid regulation marks for Standard format
const VALID_REGULATION_MARKS = ['G', 'H', 'I', 'J', 'K']

/**
 * Daily cache sync script
 * - Verifies cache integrity
 * - Syncs missing cards from both Pokemon and Riftbound
 * - Reports any discrepancies
 *
 * Can be run via:
 * - npm run cache:daily
 * - Vercel Cron Jobs
 * - External cron service (cron-job.org, etc.)
 */
async function dailyCacheSync() {
  const report = {
    startTime: new Date(),
    pokemon: {
      checked: 0,
      missing: 0,
      synced: 0,
      errors: 0
    },
    riftbound: {
      checked: 0,
      missing: 0,
      synced: 0,
      errors: 0
    },
    users: {
      checked: 0,
      markedInactive: 0,
      markedActive: 0,
      errors: 0
    },
    endTime: null,
    success: true
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    log.info(MODULE, 'Connected to MongoDB')
    log.info(MODULE, '=== Starting daily cache sync ===')

    // 1. Check and sync Pokemon cards
    log.info(MODULE, '\n--- Pokemon TCG Sync ---')
    await syncPokemonCards(report)

    // 2. Check and sync Riftbound cards
    log.info(MODULE, '\n--- Riftbound Sync ---')
    await syncRiftboundCards(report)

    // 3. Update inactive users
    log.info(MODULE, '\n--- User Activity Check ---')
    await updateInactiveUsers(report)

    report.endTime = new Date()
    const duration = (report.endTime - report.startTime) / 1000

    log.info(MODULE, '\n=== DAILY SYNC COMPLETE ===')
    log.info(MODULE, `Duration: ${duration.toFixed(1)} seconds`)
    log.info(MODULE, `Pokemon: ${report.pokemon.synced} synced, ${report.pokemon.errors} errors`)
    log.info(MODULE, `Riftbound: ${report.riftbound.synced} synced, ${report.riftbound.errors} errors`)
    log.info(MODULE, `Users: ${report.users.markedInactive} marked inactive, ${report.users.markedActive} marked active`)

    return report

  } catch (error) {
    log.error(MODULE, 'Daily sync failed:', error)
    report.success = false
    report.error = error.message
    throw error
  } finally {
    await mongoose.connection.close()
    log.info(MODULE, 'MongoDB connection closed')
  }
}

/**
 * Sync Pokemon cards - check for new/missing cards from recent sets
 */
async function syncPokemonCards(report) {
  try {
    // Get newest Pokemon sets (Scarlet & Violet)
    const allSets = await pokemon.set.all()
    const svSets = allSets
      .filter(set => set.series === 'Scarlet & Violet')
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      .slice(0, 5) // Check the 5 most recent sets

    log.info(MODULE, `Checking ${svSets.length} recent Pokemon sets`)

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    for (const set of svSets) {
      log.info(MODULE, `Checking set: ${set.name} (${set.id})`)

      // Fetch all cards from this set
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

        if (cards.length < 250) {
          hasMore = false
        } else {
          page++
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Check each card
      for (const card of allCardsFromSet) {
        if (!VALID_REGULATION_MARKS.includes(card.regulationMark)) continue

        report.pokemon.checked++

        // Check if card exists in cache
        const cached = await CardCache.findOne({ cardId: card.id })

        if (!cached) {
          report.pokemon.missing++

          // Sync missing card
          try {
            const cardData = { ...card, tcgSystem: 'pokemon' }
            await CardCache.findOneAndUpdate(
              { cardId: card.id },
              {
                cardId: card.id,
                data: cardData,
                tcgSystem: 'pokemon',
                cachedAt: new Date(),
                expiresAt,
                viewCount: 0,
                lastViewed: new Date()
              },
              { upsert: true, new: true }
            )
            report.pokemon.synced++
            log.info(MODULE, `  Synced missing card: ${card.name} (${card.id})`)
          } catch (cardError) {
            report.pokemon.errors++
            log.error(MODULE, `  Failed to sync card ${card.id}:`, cardError.message)
          }
        }
      }
    }

    log.info(MODULE, `Pokemon check complete: ${report.pokemon.checked} cards checked, ${report.pokemon.missing} missing, ${report.pokemon.synced} synced`)

  } catch (error) {
    log.error(MODULE, 'Pokemon sync failed:', error.message)
    report.pokemon.errors++
  }
}

/**
 * Sync Riftbound cards - check for new/missing cards
 */
async function syncRiftboundCards(report) {
  try {
    // Get all Riftbound cards from API
    const allCards = await riftboundService.getAllCards()
    log.info(MODULE, `Checking ${allCards.length} Riftbound cards`)

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    for (const card of allCards) {
      report.riftbound.checked++

      // Check if card exists in cache
      const cached = await CardCache.findOne({ cardId: card.id })

      if (!cached) {
        report.riftbound.missing++

        // Sync missing card
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
          report.riftbound.synced++
          log.info(MODULE, `  Synced missing card: ${card.name} (${card.id})`)
        } catch (cardError) {
          report.riftbound.errors++
          log.error(MODULE, `  Failed to sync card ${card.id}:`, cardError.message)
        }
      }
    }

    log.info(MODULE, `Riftbound check complete: ${report.riftbound.checked} cards checked, ${report.riftbound.missing} missing, ${report.riftbound.synced} synced`)

  } catch (error) {
    log.error(MODULE, 'Riftbound sync failed:', error.message)
    report.riftbound.errors++
  }
}

/**
 * Update inactive users - mark users as inactive if no activity in 2 months
 */
async function updateInactiveUsers(report) {
  try {
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    // Get all users
    const allUsers = await User.find({}, '_id lastActivity isInactive')
    report.users.checked = allUsers.length

    log.info(MODULE, `Checking ${allUsers.length} users for activity status`)

    for (const user of allUsers) {
      try {
        // User's last activity (use createdAt as fallback if lastActivity not set)
        const lastActivityDate = user.lastActivity || user.createdAt

        // Check if user should be marked inactive (no activity in 2 months)
        const shouldBeInactive = !lastActivityDate || lastActivityDate < twoMonthsAgo

        if (shouldBeInactive && !user.isInactive) {
          // Mark user as inactive
          await User.updateOne(
            { _id: user._id },
            { isInactive: true }
          )
          report.users.markedInactive++
          log.info(MODULE, `  User ${user._id} marked inactive (last activity: ${lastActivityDate?.toISOString() || 'never'})`)
        } else if (!shouldBeInactive && user.isInactive) {
          // Mark user as active (they've had recent activity)
          await User.updateOne(
            { _id: user._id },
            { isInactive: false }
          )
          report.users.markedActive++
          log.info(MODULE, `  User ${user._id} marked active`)
        }
      } catch (userError) {
        report.users.errors++
        log.error(MODULE, `  Failed to update user ${user._id}:`, userError.message)
      }
    }

    log.info(MODULE, `User activity check complete: ${report.users.checked} users checked, ${report.users.markedInactive} marked inactive, ${report.users.markedActive} marked active`)

  } catch (error) {
    log.error(MODULE, 'User activity check failed:', error.message)
    report.users.errors++
  }
}

// Export for use as module (Vercel serverless function)
export { dailyCacheSync }

// Run as standalone script
if (process.argv[1].includes('dailyCacheSync')) {
  dailyCacheSync()
    .then((report) => {
      console.log('\\n✅ Daily cache sync completed successfully')
      console.log(`   Pokemon: ${report.pokemon.synced} synced`)
      console.log(`   Riftbound: ${report.riftbound.synced} synced`)
      process.exit(0)
    })
    .catch(error => {
      console.error('\\n❌ Daily cache sync failed:', error)
      process.exit(1)
    })
}

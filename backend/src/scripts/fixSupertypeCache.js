/**
 * Fix Supertype Cache
 * Re-caches cards using Pokemon TCG SDK to get correct supertype field
 *
 * Problem: Cards cached via TCGdex have "category" instead of "supertype"
 * Solution: Re-fetch from Pokemon TCG SDK which has proper structure
 */
import pokemon from 'pokemontcgsdk'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import CardCache from '../models/CardCache.js'
import log from '../utils/logger.js'
import { buildMongoUri } from '../utils/mongoUri.js'

dotenv.config()

const MODULE = 'FixSupertypeCache'

// Configure Pokemon TCG SDK
pokemon.configure({ apiKey: process.env.POKEMON_TCG_API_KEY })

// Card IDs that need to be re-cached (Pokemon TCG SDK format: sv8-97 not sv08-97)
const CARDS_TO_FIX = [
  // SSP (Surging Sparks) - sv8
  { deckCode: 'ssp-97', tcgId: 'sv8-97', name: 'Gimmighoul' },

  // PAR (Paradox Rift) - sv4
  { deckCode: 'par-139', tcgId: 'sv4-139', name: 'Gholdengo ex' },
  { deckCode: 'par-163', tcgId: 'sv4-163', name: 'Earthen Vessel' },
  { deckCode: 'par-160', tcgId: 'sv4-160', name: 'Counter Catcher' },
  { deckCode: 'par-177', tcgId: 'sv4-177', name: 'Technical Machine: Devolution' },

  // MEG (Mega/XY) - Need to find correct set
  { deckCode: 'meg-75', tcgId: null, name: 'Solrock' }, // Will search by name
  { deckCode: 'meg-74', tcgId: null, name: 'Lunatone' },

  // SFA (Shrouded Fable) - sv6
  { deckCode: 'sfa-38', tcgId: 'sv6-38', name: 'Fezandipiti ex' },
  { deckCode: 'sfa-61', tcgId: 'sv6-61', name: 'Night Stretcher' },

  // BLK/JTG (Battle Partners) - sv9
  { deckCode: 'blk-67', tcgId: 'sv09-67', name: 'Genesect ex' },
  { deckCode: 'jtg-138', tcgId: 'sv09-138', name: "Hop's Cramorant" },

  // OBF (Obsidian Flames) - sv3
  { deckCode: 'obf-192', tcgId: 'sv3-192', name: 'Pokémon League Headquarters' },

  // PAL (Paldea Evolved) - sv2
  { deckCode: 'pal-185', tcgId: 'sv2-185', name: 'Iono' },
  { deckCode: 'pal-172', tcgId: 'sv2-172', name: "Boss's Orders" },
  { deckCode: 'pal-188', tcgId: 'sv2-188', name: 'Super Rod' },

  // SVI (Scarlet & Violet Base) - sv1
  { deckCode: 'svi-196', tcgId: 'sv1-196', name: 'Ultra Ball' },
  { deckCode: 'svi-191', tcgId: 'sv1-191', name: 'Rare Candy' },
  { deckCode: 'svi-182', tcgId: 'sv1-182', name: 'Pal Pad' },
  { deckCode: 'svi-189', tcgId: 'sv1-189', name: "Professor's Research" },

  // TEF (Temporal Forces) - sv5
  { deckCode: 'tef-144', tcgId: 'sv5-144', name: 'Buddy-Buddy Poffin' },
  { deckCode: 'tef-159', tcgId: 'sv5-159', name: 'Rescue Board' },

  // LOR (Lost Origin) - swsh11
  { deckCode: 'lor-162', tcgId: 'swsh11-162', name: 'Lost Vacuum' },

  // BRS (Brilliant Stars) - swsh9
  { deckCode: 'brs-137', tcgId: 'swsh9-137', name: 'PokéStop' },

  // SIT (Silver Tempest) - swsh12
  { deckCode: 'sit-156', tcgId: 'swsh12-156', name: 'Forest Seal Stone' },

  // ASR (Astral Radiance) - swsh10
  { deckCode: 'asr-154', tcgId: 'swsh10-154', name: 'Switch Cart' },

  // MEE (Paldean Fates) - sv4pt5
  { deckCode: 'mee-6', tcgId: 'sv4pt5-6', name: 'Fighting Energy' },
  { deckCode: 'mee-8', tcgId: 'sv4pt5-8', name: 'Metal Energy' }
]

async function fixSupertypeCache() {
  const stats = {
    total: CARDS_TO_FIX.length,
    fixed: 0,
    notFound: 0,
    errors: 0
  }

  try {
    await mongoose.connect(buildMongoUri())
    log.info(MODULE, 'Connected to MongoDB')
    log.info(MODULE, `Fixing ${CARDS_TO_FIX.length} cards with incorrect supertype data`)

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    for (const cardInfo of CARDS_TO_FIX) {
      try {
        log.info(MODULE, `\nProcessing: ${cardInfo.name} (${cardInfo.deckCode})`)

        let card = null

        // Try to fetch by exact ID first
        if (cardInfo.tcgId) {
          try {
            card = await pokemon.card.find(cardInfo.tcgId)
            log.info(MODULE, `  Found by ID: ${cardInfo.tcgId}`)
          } catch (err) {
            log.warn(MODULE, `  Not found by ID ${cardInfo.tcgId}, trying name search`)
          }
        }

        // Fallback: search by name
        if (!card) {
          const searchResults = await pokemon.card.where({
            q: `name:"${cardInfo.name}"`,
            pageSize: 10
          })

          if (searchResults.data && searchResults.data.length > 0) {
            // Prefer cards from SV series if available
            card = searchResults.data.find(c => c.set.series === 'Scarlet & Violet') || searchResults.data[0]
            log.info(MODULE, `  Found by name search: ${card.id} (${card.set.name})`)
          }
        }

        if (!card) {
          log.error(MODULE, `  ❌ Not found: ${cardInfo.name}`)
          stats.notFound++
          continue
        }

        // Verify card has supertype
        if (!card.supertype) {
          log.warn(MODULE, `  ⚠️  Card found but missing supertype: ${card.id}`)
        }

        // Update cache with correct data
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

        log.info(MODULE, `  ✅ Fixed: ${card.name} (${card.id})`)
        log.info(MODULE, `     supertype: ${card.supertype}`)
        log.info(MODULE, `     subtypes: ${card.subtypes?.join(', ') || 'none'}`)
        stats.fixed++

        // Rate limit to avoid API throttling
        await new Promise(resolve => setTimeout(resolve, 150))

      } catch (error) {
        log.error(MODULE, `  ❌ Error processing ${cardInfo.name}:`, error.message)
        stats.errors++
      }
    }

    log.info(MODULE, '\n=== FIX COMPLETE ===')
    log.info(MODULE, `Total: ${stats.total}`)
    log.info(MODULE, `Fixed: ${stats.fixed}`)
    log.info(MODULE, `Not found: ${stats.notFound}`)
    log.info(MODULE, `Errors: ${stats.errors}`)

    if (stats.fixed > 0) {
      log.info(MODULE, '\n✅ Cards re-cached with correct supertype data')
      log.info(MODULE, 'Deck import should now show correct Pokemon count')
    }

    return stats

  } catch (error) {
    log.error(MODULE, 'Fix failed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    log.info(MODULE, 'MongoDB connection closed')
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  fixSupertypeCache()
    .then(stats => {
      if (stats.fixed === stats.total) {
        console.log('\n✅ All cards fixed successfully')
        process.exit(0)
      } else {
        console.log(`\n⚠️  Fixed ${stats.fixed}/${stats.total} cards`)
        process.exit(stats.errors > 0 ? 1 : 0)
      }
    })
    .catch(error => {
      console.error('\n❌ Fix failed:', error.message)
      process.exit(1)
    })
}

export default fixSupertypeCache

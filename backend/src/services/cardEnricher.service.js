/**
 * Card Enrichment Service
 * Enriches parsed deck cards with metadata from CardCache for validation.
 *
 * Adds: supertype, subtypes, types, regulationMark
 * Used by: deck validation, format detection
 */
import CardCache from '../models/CardCache.js'
import log from '../utils/logger.js'

const MODULE = 'CardEnricherService'

/**
 * Pokemon deck abbreviation to TCGdex set code mapping.
 * Maps common deck list abbreviations (SSP, PAR, etc.) to TCGdex codes (sv08, sv04, etc.)
 */
const DECK_CODE_TO_TCGDEX = {
  // Scarlet & Violet era
  'SSP': 'sv08',    // Surging Sparks
  'PAR': 'sv04',    // Paradox Rift
  'MEG': 'sv10',    // Mega (custom set)
  'SFA': 'sv06',    // Shrouded Fable
  'BLK': 'sv09',    // Battle Partners
  'JTG': 'sv09',    // Journey Together (same as BLK)
  'OBF': 'sv03',    // Obsidian Flames
  'TWM': 'sv06',    // Twilight Masquerade
  'PAL': 'sv02',    // Paldea Evolved
  'SVI': 'sv01',    // Scarlet & Violet Base
  'TEF': 'sv05',    // Temporal Forces
  'MEE': 'sv04.5',  // Paldean Fates (energy set)

  // Sword & Shield era
  'CRZ': 'swsh12.5', // Crown Zenith
  'SIT': 'swsh12',   // Silver Tempest
  'LOR': 'swsh11',   // Lost Origin
  'PGO': 'swsh11.5', // Pokemon GO
  'ASR': 'swsh10',   // Astral Radiance
  'BRS': 'swsh9',    // Brilliant Stars
  'FST': 'swsh8',    // Fusion Strike
  'CEL': 'swsh7.5',  // Celebrations
  'EVS': 'swsh7',    // Evolving Skies
  'CRE': 'swsh6',    // Chilling Reign
  'BST': 'swsh5',    // Battle Styles
  'SHF': 'swsh4.5',  // Shining Fates
  'VIV': 'swsh4',    // Vivid Voltage
  'CPA': 'swsh3.5',  // Champion's Path
  'DAA': 'swsh3',    // Darkness Ablaze
  'RCL': 'swsh2',    // Rebel Clash
  'SSH': 'swsh1',    // Sword & Shield Base
}

/**
 * Normalizes a card ID by converting deck abbreviations to TCGdex codes.
 * Example: "ssp-97" -> "sv08-97"
 *
 * @param {string} cardId - Original card ID from deck string
 * @returns {Array<string>} - Array of possible cardId variations to try
 */
function getNormalizedCardIds(cardId) {
  if (!cardId) return []

  const variations = [cardId.toLowerCase()] // Try original first

  // Extract set code and number
  const match = cardId.match(/^([a-z]+)-(.+)$/i)
  if (match) {
    const [, setCode, number] = match
    const upperSetCode = setCode.toUpperCase()

    // Check if there's a TCGdex mapping
    if (DECK_CODE_TO_TCGDEX[upperSetCode]) {
      const tcgdexCode = DECK_CODE_TO_TCGDEX[upperSetCode]
      variations.push(`${tcgdexCode}-${number}`)
    }
  }

  return variations
}

/**
 * Enriches an array of parsed cards with metadata from CardCache.
 * Uses batch query for performance (<500ms for 60 cards).
 *
 * @param {Array} cards - Parsed cards with cardId, name, quantity
 * @param {string} tcg - TCG system ('pokemon' or 'riftbound')
 * @returns {Object} - { cards, stats }
 */
export async function enrichDeckCards(cards, tcg = 'pokemon') {
  const startTime = Date.now()

  if (!cards || cards.length === 0) {
    return {
      cards: [],
      stats: {
        total: 0,
        enriched: 0,
        notFound: 0,
        byName: 0,
        duration: 0
      }
    }
  }

  // Separate cards by lookup method
  const cardsByCardId = cards.filter(c => c.cardId && !c.needsResolution)
  const cardsByName = cards.filter(c => !c.cardId || c.needsResolution)

  // Get unique card IDs for batch query - include all variations
  const allCardIdVariations = []
  const cardIdToVariations = new Map() // Track which variations belong to which original ID

  for (const card of cardsByCardId) {
    const variations = getNormalizedCardIds(card.cardId)
    cardIdToVariations.set(card.cardId, variations)
    allCardIdVariations.push(...variations)
  }

  const uniqueCardIds = [...new Set(allCardIdVariations)]

  log.info(MODULE, `Enriching ${cards.length} cards (${uniqueCardIds.length} unique IDs including variations, ${cardsByName.length} by name)`)

  // Batch query CardCache by cardId using $in
  let cachedByCardId = new Map()
  if (uniqueCardIds.length > 0) {
    try {
      const cachedCards = await CardCache.find({
        cardId: { $in: uniqueCardIds },
        tcgSystem: tcg
      }).lean()

      // Map found cards back to all their variation IDs
      for (const cached of cachedCards) {
        // Store by the TCGdex ID that was found
        cachedByCardId.set(cached.cardId, cached.data)

        // Also map original card IDs that resolve to this TCGdex ID
        for (const [originalId, variations] of cardIdToVariations) {
          if (variations.includes(cached.cardId)) {
            cachedByCardId.set(originalId.toLowerCase(), cached.data)
          }
        }
      }

      log.info(MODULE, `Found ${cachedCards.length} cards in cache (${cachedByCardId.size} total mappings)`)
    } catch (error) {
      log.error(MODULE, 'CardCache batch query failed', error)
    }
  }

  // Fallback: search by name for cards without cardId
  let cachedByName = new Map()
  if (cardsByName.length > 0) {
    const uniqueNames = [...new Set(cardsByName.map(c => c.name?.toLowerCase()))]

    try {
      // Search by partial name match in cached data
      const cachedCards = await CardCache.find({
        'data.name': { $regex: new RegExp(uniqueNames.map(n => `^${escapeRegex(n)}$`).join('|'), 'i') },
        tcgSystem: tcg
      }).lean()

      for (const cached of cachedCards) {
        const lowerName = cached.data?.name?.toLowerCase()
        if (lowerName) {
          cachedByName.set(lowerName, cached.data)
        }
      }

      log.info(MODULE, `Found ${cachedByName.size}/${uniqueNames.length} cards by name`)
    } catch (error) {
      log.error(MODULE, 'CardCache name query failed', error)
    }
  }

  // Enrich each card
  const enrichedCards = []
  let enrichedCount = 0
  let notFoundCount = 0
  let byNameCount = 0

  for (const card of cards) {
    let cardData = null

    // Try by cardId first
    if (card.cardId && cachedByCardId.has(card.cardId)) {
      cardData = cachedByCardId.get(card.cardId)
    }

    // Fall back to name lookup
    if (!cardData && card.name) {
      const lowerName = card.name.toLowerCase()
      // Try exact match first
      if (cachedByName.has(lowerName)) {
        cardData = cachedByName.get(lowerName)
        byNameCount++
      } else {
        // Try without parenthetical suffix
        const cleanName = lowerName.replace(/\s*\([^)]+\)\s*$/, '').trim()
        for (const [cachedName, data] of cachedByName) {
          if (cachedName === cleanName ||
              cachedName.replace(/\s*\([^)]+\)\s*$/, '').trim() === cleanName) {
            cardData = data
            byNameCount++
            break
          }
        }
      }
    }

    // Build enriched card
    const enrichedCard = {
      ...card,
      // Preserve original data
      cardId: card.cardId,
      quantity: card.quantity,
      name: card.name || cardData?.name || 'Unknown',
      setCode: card.setCode,
      number: card.number,
      // Add enriched metadata
      // Map TCGdex 'category' to 'supertype' for consistency
      supertype: cardData?.supertype || cardData?.category || card.supertype || null,
      category: cardData?.category || null,  // Preserve category for Pokemon type detection
      stage: cardData?.stage || null,         // CRITICAL: Preserve stage for Basic Pokemon detection
      subtypes: cardData?.subtypes || [],
      types: cardData?.types || [],
      regulationMark: cardData?.regulationMark || null,
      // Additional useful fields for display
      imageSmall: cardData?.images?.small || null,
      rarity: cardData?.rarity || null,
      // Enrichment status
      enriched: !!cardData,
      enrichedFrom: cardData ? (card.cardId ? 'cardId' : 'name') : null
    }

    if (cardData) {
      enrichedCount++
    } else {
      notFoundCount++
    }

    enrichedCards.push(enrichedCard)
  }

  const duration = Date.now() - startTime

  log.info(MODULE, `Enrichment complete: ${enrichedCount}/${cards.length} enriched in ${duration}ms`)

  if (notFoundCount > 0) {
    log.warn(MODULE, `${notFoundCount} cards not found in cache`)
  }

  return {
    cards: enrichedCards,
    stats: {
      total: cards.length,
      enriched: enrichedCount,
      notFound: notFoundCount,
      byName: byNameCount,
      duration
    }
  }
}

/**
 * Check if a card has Rule Box properties (ex, V, VSTAR, VMAX, Radiant).
 * Uses enriched subtypes for accurate detection.
 *
 * @param {Object} card - Enriched card with subtypes
 * @returns {boolean}
 */
export function hasRuleBox(card) {
  if (!card) return false

  const subtypes = card.subtypes || []
  const ruleBoxSubtypes = ['ex', 'V', 'VMAX', 'VSTAR', 'Radiant', 'V-UNION']

  return subtypes.some(st => ruleBoxSubtypes.includes(st)) ||
         ruleBoxSubtypes.some(rb => card.name?.includes(rb))
}

/**
 * Check if a card is a Basic Pokemon.
 * Uses enriched subtypes for accurate detection.
 *
 * @param {Object} card - Enriched card with supertype and subtypes
 * @returns {boolean}
 */
export function isBasicPokemon(card) {
  if (!card) return false

  // Must be a Pokemon
  if (card.supertype?.toLowerCase() !== 'pokémon' &&
      card.supertype?.toLowerCase() !== 'pokemon') {
    return false
  }

  const subtypes = card.subtypes || []
  return subtypes.includes('Basic')
}

/**
 * Check if a card is an ACE SPEC.
 * Uses enriched subtypes for accurate detection.
 *
 * @param {Object} card - Enriched card with subtypes
 * @returns {boolean}
 */
export function isAceSpec(card) {
  if (!card) return false
  const subtypes = card.subtypes || []
  return subtypes.includes('ACE SPEC')
}

/**
 * Check if a card is Standard legal based on regulation mark.
 *
 * @param {Object} card - Enriched card with regulationMark
 * @param {Array} legalMarks - Array of legal regulation marks (e.g., ['G', 'H', 'I'])
 * @returns {boolean}
 */
export function isStandardLegal(card, legalMarks = ['G', 'H', 'I']) {
  if (!card || !card.regulationMark) return false
  return legalMarks.includes(card.regulationMark)
}

/**
 * Get Pokemon types from an enriched deck.
 * Used for GLC mono-type validation.
 *
 * @param {Array} cards - Enriched cards
 * @returns {Set} - Set of unique Pokemon types
 */
export function getPokemonTypes(cards) {
  const types = new Set()

  for (const card of cards) {
    if (card.supertype?.toLowerCase() === 'pokémon' ||
        card.supertype?.toLowerCase() === 'pokemon') {
      for (const type of (card.types || [])) {
        types.add(type)
      }
    }
  }

  return types
}

/**
 * Escape special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  if (!str) return ''
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default {
  enrichDeckCards,
  hasRuleBox,
  isBasicPokemon,
  isAceSpec,
  isStandardLegal,
  getPokemonTypes
}

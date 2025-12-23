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

  // Get unique card IDs for batch query
  const uniqueCardIds = [...new Set(cardsByCardId.map(c => c.cardId))]

  log.info(MODULE, `Enriching ${cards.length} cards (${uniqueCardIds.length} unique IDs, ${cardsByName.length} by name)`)

  // Batch query CardCache by cardId using $in
  let cachedByCardId = new Map()
  if (uniqueCardIds.length > 0) {
    try {
      const cachedCards = await CardCache.find({
        cardId: { $in: uniqueCardIds },
        tcgSystem: tcg
      }).lean()

      for (const cached of cachedCards) {
        cachedByCardId.set(cached.cardId, cached.data)
      }

      log.info(MODULE, `Found ${cachedByCardId.size}/${uniqueCardIds.length} cards in cache`)
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
      supertype: cardData?.supertype || card.supertype || null,
      subtypes: cardData?.subtypes || [],
      types: cardData?.types || [],
      type: cardData?.type || null, // Riftbound: Unit, Spell, Gear
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
 * Uses multiple detection strategies for robustness.
 *
 * Detection strategy:
 * 1. Check subtypes array for 'Basic' (case-insensitive)
 * 2. Check evolutionStage field for 'Basic'
 * 3. Fallback: Check if card has NO evolvesFrom field (likely Basic)
 *
 * @param {Object} card - Enriched card with supertype, subtypes, evolutionStage
 * @returns {boolean}
 */
export function isBasicPokemon(card) {
  if (!card) return false

  const supertype = card.supertype?.toLowerCase() || ''

  // Must be a Pokemon
  if (supertype !== 'pokémon' && supertype !== 'pokemon') {
    return false
  }

  // Strategy 1: Check subtypes array (case-insensitive)
  if (card.subtypes && Array.isArray(card.subtypes)) {
    const hasBasicSubtype = card.subtypes.some(subtype =>
      typeof subtype === 'string' && subtype.toLowerCase() === 'basic'
    )
    if (hasBasicSubtype) return true
  }

  // Strategy 2: Check evolutionStage field
  const evolutionStage = card.evolutionStage?.toLowerCase() || ''
  if (evolutionStage === 'basic') return true

  // Strategy 3: Fallback - Basic Pokemon typically have no evolvesFrom
  if (!card.evolvesFrom && !card.evolves_from) {
    // Exclude evolved Pokemon that might lack evolvesFrom in data
    if (card.subtypes && Array.isArray(card.subtypes)) {
      const evolvedTypes = card.subtypes.some(subtype => {
        const lower = (subtype || '').toLowerCase()
        return lower.includes('stage') || lower.includes('vmax') ||
               lower.includes('vstar') || lower === 'ex' || lower === 'gx'
      })
      if (evolvedTypes) return false
    }

    // If no evolves info and no evolved subtype markers, assume Basic
    return true
  }

  return false
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

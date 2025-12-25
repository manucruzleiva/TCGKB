/**
 * TCGdex Service
 * Handles all Pokemon card data fetching from TCGdex API (https://tcgdex.dev)
 *
 * CRITICAL: TCGdex uses 'category' instead of 'supertype'
 * This service transforms all cards to match Pokemon TCG API format for compatibility
 */
import log from '../utils/logger.js'

const MODULE = 'TCGdexService'
const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en'

class TCGdexService {
  /**
   * Fetch all Pokemon sets from TCGdex
   * @returns {Promise<Array>} Array of sets with normalized format
   */
  async getAllSets() {
    try {
      const response = await fetch(`${TCGDEX_API_BASE}/sets`)
      if (!response.ok) {
        throw new Error(`TCGdex API returned ${response.status}`)
      }

      const sets = await response.json()
      log.info(MODULE, `Fetched ${sets.length} sets from TCGdex`)

      return sets.map(set => ({
        id: set.id,
        name: set.name,
        logo: set.logo,
        symbol: set.symbol,
        cardCount: set.cardCount,
        series: this.inferSeries(set.id),
        releaseDate: this.inferReleaseDate(set.id),
        printedTotal: set.cardCount?.total || 0,
        total: set.cardCount?.total || 0
      }))
    } catch (error) {
      log.error(MODULE, 'Failed to fetch sets from TCGdex:', error)
      return []
    }
  }

  /**
   * Fetch all cards from a specific set
   * @param {string} setId - Set ID (e.g., 'sv08', 'sv04')
   * @returns {Promise<Array>} Array of transformed cards
   */
  async getCardsBySet(setId) {
    try {
      // Get set details (includes card list)
      const response = await fetch(`${TCGDEX_API_BASE}/sets/${setId}`)
      if (!response.ok) {
        log.warn(MODULE, `Set ${setId} not found in TCGdex (${response.status})`)
        return []
      }

      const setData = await response.json()
      const cardSummaries = setData.cards || []

      log.info(MODULE, `Fetching ${cardSummaries.length} cards for set ${setId}`)

      // Fetch full details for each card in batches of 10
      const cards = []
      for (let i = 0; i < cardSummaries.length; i += 10) {
        const batch = cardSummaries.slice(i, i + 10)
        const batchPromises = batch.map(card =>
          fetch(`${TCGDEX_API_BASE}/cards/${card.id}`)
            .then(res => res.ok ? res.json() : null)
            .catch(err => {
              log.error(MODULE, `Failed to fetch card ${card.id}:`, err)
              return null
            })
        )

        const batchResults = await Promise.all(batchPromises)
        const validCards = batchResults.filter(Boolean)
        cards.push(...validCards)

        // Rate limiting - 100ms between batches
        if (i + 10 < cardSummaries.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      log.info(MODULE, `Successfully fetched ${cards.length}/${cardSummaries.length} cards for ${setId}`)

      return cards.map(card => this.transformCard(card))
    } catch (error) {
      log.error(MODULE, `Failed to fetch cards for set ${setId}:`, error)
      return []
    }
  }

  /**
   * Get single card by ID
   * @param {string} cardId - Card ID (e.g., 'sv08-97')
   * @returns {Promise<Object|null>} Transformed card or null
   */
  async getCardById(cardId) {
    try {
      const response = await fetch(`${TCGDEX_API_BASE}/cards/${cardId}`)
      if (!response.ok) {
        log.warn(MODULE, `Card ${cardId} not found in TCGdex (${response.status})`)
        return null
      }

      const card = await response.json()
      return this.transformCard(card)
    } catch (error) {
      log.error(MODULE, `Failed to fetch card ${cardId}:`, error)
      return null
    }
  }

  /**
   * Search cards by name
   * @param {string} name - Card name to search
   * @param {number} page - Page number (1-indexed)
   * @param {number} pageSize - Results per page
   * @returns {Promise<Array>} Array of transformed cards
   */
  async searchCards(name, page = 1, pageSize = 20) {
    try {
      const response = await fetch(`${TCGDEX_API_BASE}/cards?name=${encodeURIComponent(name)}`)
      if (!response.ok) {
        throw new Error(`TCGdex search failed: ${response.status}`)
      }

      const results = await response.json()

      // TCGdex returns card summaries, fetch full details for each
      const fullCards = []
      for (const summary of results.slice(0, pageSize * 3)) {
        const card = await this.getCardById(summary.id)
        if (card) fullCards.push(card)
      }

      // Client-side pagination
      const start = (page - 1) * pageSize
      const end = start + pageSize

      return fullCards
        .sort((a, b) => new Date(b.set?.releaseDate || 0) - new Date(a.set?.releaseDate || 0))
        .slice(start, end)
    } catch (error) {
      log.error(MODULE, 'Search cards failed:', error)
      return []
    }
  }

  /**
   * Transform TCGdex card to Pokemon TCG API format
   * CRITICAL: Maps category → supertype for frontend compatibility
   *
   * @param {Object} card - TCGdex card object
   * @returns {Object} Transformed card matching Pokemon TCG API structure
   */
  transformCard(card) {
    if (!card) return null

    return {
      id: card.id,
      name: card.name,
      // ⚠️ CRITICAL MAPPING: TCGdex uses 'category', we need 'supertype'
      supertype: card.category || 'Unknown',
      subtypes: card.stage ? [card.stage] : (card.dexId ? ['Basic'] : []),
      types: card.types || [],
      hp: card.hp ? String(card.hp) : undefined,
      regulationMark: card.regulationMark,
      rarity: card.rarity,
      number: card.localId,
      artist: card.illustrator,

      // Set information
      set: {
        id: card.set?.id,
        name: card.set?.name,
        series: this.inferSeries(card.set?.id),
        releaseDate: this.inferReleaseDate(card.set?.id),
        printedTotal: card.set?.cardCount?.total || 0,
        total: card.set?.cardCount?.total || 0,
        legalities: card.legal ? {
          standard: card.legal.standard ? 'Legal' : 'Not Legal',
          expanded: card.legal.expanded ? 'Legal' : 'Not Legal'
        } : undefined
      },

      // Images
      images: card.image ? {
        small: `${card.image}/low.webp`,
        large: `${card.image}/high.webp`
      } : undefined,

      // Attacks
      attacks: card.attacks?.map(a => ({
        name: a.name,
        cost: a.cost || [],
        convertedEnergyCost: a.cost?.length || 0,
        damage: a.damage || '',
        text: a.effect || ''
      })),

      // Abilities
      abilities: card.abilities?.map(ab => ({
        name: ab.name,
        text: ab.effect,
        type: ab.type || 'Ability'
      })),

      // Evolution
      evolvesFrom: card.evolveFrom,

      // Retreat cost
      retreatCost: card.retreat ? Array(card.retreat).fill('Colorless') : [],

      // Weaknesses and resistances
      weaknesses: card.weaknesses?.map(w => ({
        type: w.type,
        value: w.value || '×2'
      })),
      resistances: card.resistances?.map(r => ({
        type: r.type,
        value: r.value || '-20'
      })),

      // System marker
      tcgSystem: 'pokemon'
    }
  }

  /**
   * Infer series from set ID
   * @param {string} setId - Set ID
   * @returns {string} Series name
   */
  inferSeries(setId) {
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
   * @param {string} setId - Set ID
   * @returns {string|null} Release date in YYYY-MM-DD format
   */
  inferReleaseDate(setId) {
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
}

export default new TCGdexService()

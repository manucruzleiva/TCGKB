import TCGdex from '@tcgdex/sdk'
import log from '../utils/logger.js'

const MODULE = 'TCGdexService'

// Initialize TCGdex SDK with English language
const tcgdex = new TCGdex('en')

/**
 * TCGdex Service - Fast Pokemon TCG data provider
 * Replaces pokemontcgsdk for better performance
 *
 * API: https://api.tcgdex.net/v2/{lang}/
 * Docs: https://tcgdex.dev/
 */
class TCGdexService {
  /**
   * Search cards by name
   * @param {string} name - Card name to search
   * @param {number} page - Page number (1-indexed)
   * @param {number} pageSize - Results per page
   */
  async searchCards(name, page = 1, pageSize = 20) {
    const startTime = Date.now()

    try {
      // TCGdex returns all matching cards, we paginate client-side
      const cards = await tcgdex.fetch('cards', { name })

      if (!cards || cards.length === 0) {
        return { data: [], totalCount: 0 }
      }

      // Transform to our format
      const transformedCards = cards.map(card => this.transformCard(card))

      // Sort by release date (newest first)
      transformedCards.sort((a, b) => {
        const dateA = a.set?.releaseDate || '1900-01-01'
        const dateB = b.set?.releaseDate || '1900-01-01'
        return dateB.localeCompare(dateA)
      })

      // Paginate
      const startIndex = (page - 1) * pageSize
      const paginatedCards = transformedCards.slice(startIndex, startIndex + pageSize)

      log.perf(MODULE, `Search "${name}" page ${page}`, Date.now() - startTime)

      return {
        data: paginatedCards,
        totalCount: transformedCards.length
      }
    } catch (error) {
      log.error(MODULE, `Search failed for "${name}"`, error)
      return { data: [], totalCount: 0 }
    }
  }

  /**
   * Get card by ID (format: {setId}-{localId})
   * @param {string} cardId - Card ID like "swsh3-136"
   */
  async getCardById(cardId) {
    const startTime = Date.now()

    try {
      // TCGdex card IDs are {setId}-{localId}
      const [setId, localId] = cardId.includes('-')
        ? cardId.split('-', 2)
        : [null, cardId]

      if (!setId || !localId) {
        log.warn(MODULE, `Invalid card ID format: ${cardId}`)
        return null
      }

      const card = await tcgdex.fetch('cards', setId, localId)

      if (!card) {
        return null
      }

      log.perf(MODULE, `Get card ${cardId}`, Date.now() - startTime)
      return this.transformCard(card)
    } catch (error) {
      log.error(MODULE, `Get card ${cardId} failed`, error)
      return null
    }
  }

  /**
   * Get all sets
   */
  async getAllSets() {
    const startTime = Date.now()

    try {
      const sets = await tcgdex.fetch('sets')
      log.perf(MODULE, `Get all sets (${sets?.length || 0})`, Date.now() - startTime)
      return sets || []
    } catch (error) {
      log.error(MODULE, 'Get all sets failed', error)
      return []
    }
  }

  /**
   * Get set by ID
   * @param {string} setId - Set ID like "swsh3"
   */
  async getSetById(setId) {
    try {
      const set = await tcgdex.fetch('sets', setId)
      return set
    } catch (error) {
      log.error(MODULE, `Get set ${setId} failed`, error)
      return null
    }
  }

  /**
   * Get all cards from a specific set
   * @param {string} setId - Set ID like "swsh3"
   */
  async getCardsBySet(setId) {
    const startTime = Date.now()

    try {
      const set = await tcgdex.fetch('sets', setId)

      if (!set || !set.cards) {
        log.warn(MODULE, `Set ${setId} not found or has no cards`)
        return []
      }

      // set.cards contains card references, need to fetch full details
      const cardPromises = set.cards.map(async (cardRef) => {
        try {
          const card = await tcgdex.fetch('cards', setId, cardRef.localId)
          return card ? this.transformCard(card) : null
        } catch {
          return null
        }
      })

      const cards = (await Promise.all(cardPromises)).filter(Boolean)

      log.perf(MODULE, `Get cards for set ${setId} (${cards.length})`, Date.now() - startTime)
      return cards
    } catch (error) {
      log.error(MODULE, `Get cards for set ${setId} failed`, error)
      return []
    }
  }

  /**
   * Get newest cards across all sets
   * @param {number} limit - Max cards to return
   */
  async getNewestCards(limit = 20) {
    const startTime = Date.now()

    try {
      // Get recent sets
      const sets = await this.getAllSets()

      if (!sets || sets.length === 0) {
        return []
      }

      // Sort by release date and get the 3 most recent sets
      const sortedSets = sets
        .filter(s => s.releaseDate)
        .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
        .slice(0, 3)

      // Fetch cards from each recent set
      const allCards = []
      for (const set of sortedSets) {
        const cards = await this.getCardsBySet(set.id)
        allCards.push(...cards)

        if (allCards.length >= limit) break
      }

      // Sort by release date and limit
      const result = allCards
        .sort((a, b) => {
          const dateA = a.set?.releaseDate || '1900-01-01'
          const dateB = b.set?.releaseDate || '1900-01-01'
          return dateB.localeCompare(dateA)
        })
        .slice(0, limit)

      log.perf(MODULE, `Get newest cards (${result.length})`, Date.now() - startTime)
      return result
    } catch (error) {
      log.error(MODULE, 'Get newest cards failed', error)
      return []
    }
  }

  /**
   * Transform TCGdex card format to our standard format
   * Compatible with existing Pokemon TCG API format
   */
  transformCard(card) {
    if (!card) return null

    // Build images object
    const images = {}
    if (card.image) {
      // TCGdex provides image URLs in format: https://assets.tcgdex.net/en/{setId}/{localId}/{quality}
      images.small = `${card.image}/low.webp`
      images.large = `${card.image}/high.webp`
    }

    // Transform types (TCGdex uses 'types' array)
    const types = card.types || []

    // Build set object
    const set = {
      id: card.set?.id || null,
      name: card.set?.name || 'Unknown Set',
      series: card.set?.serie?.name || null,
      releaseDate: card.set?.releaseDate || null,
      logo: card.set?.logo ? `${card.set.logo}/high.webp` : null,
      symbol: card.set?.symbol ? `${card.set.symbol}/high.webp` : null,
      legalities: {
        standard: card.set?.legal?.standard ? 'Legal' : 'Not Legal',
        expanded: card.set?.legal?.expanded ? 'Legal' : 'Not Legal'
      }
    }

    // Build attacks array
    const attacks = (card.attacks || []).map(attack => ({
      name: attack.name,
      cost: attack.cost || [],
      damage: attack.damage || '',
      text: attack.effect || ''
    }))

    // Build abilities array
    const abilities = (card.abilities || []).map(ability => ({
      name: ability.name,
      text: ability.effect || '',
      type: ability.type || 'Ability'
    }))

    return {
      id: `${card.set?.id || 'unknown'}-${card.localId || card.id}`,
      localId: card.localId || card.id,
      name: card.name,
      tcgSystem: 'pokemon',
      supertype: card.category || 'Pokemon', // Pokemon, Trainer, Energy
      subtypes: card.stage ? [card.stage] : [], // Basic, Stage 1, Stage 2
      hp: card.hp ? String(card.hp) : null,
      types,
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
      // Additional TCGdex fields
      description: card.description || null,
      dexId: card.dexId || [],
      level: card.level || null,
      suffix: card.suffix || null
    }
  }

  /**
   * Get all cards for bulk caching
   * Fetches cards set by set for reliability
   */
  async getAllCards(onProgress = null) {
    const startTime = Date.now()
    const allCards = []

    try {
      const sets = await this.getAllSets()
      log.info(MODULE, `Found ${sets.length} sets to process`)

      for (let i = 0; i < sets.length; i++) {
        const set = sets[i]

        try {
          const cards = await this.getCardsBySet(set.id)
          allCards.push(...cards)

          if (onProgress) {
            onProgress({
              current: i + 1,
              total: sets.length,
              setName: set.name,
              cardsInSet: cards.length,
              totalCards: allCards.length
            })
          }

          log.info(MODULE, `[${i + 1}/${sets.length}] Set "${set.name}": ${cards.length} cards`)

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (setError) {
          log.error(MODULE, `Failed to process set ${set.name}`, setError)
        }
      }

      log.perf(MODULE, `Get all cards (${allCards.length} total)`, Date.now() - startTime)
      return allCards

    } catch (error) {
      log.error(MODULE, 'Get all cards failed', error)
      return allCards // Return what we have so far
    }
  }
}

export default new TCGdexService()

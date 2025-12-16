import pokemonTCGService from './pokemonTCG.service.js'
import rifboundTCGService from './rifboundTCG.service.js'
import log from '../utils/logger.js'

const MODULE = 'UnifiedTCG'

/**
 * Unified TCG Service
 * Transparently searches across multiple TCG APIs (Pokemon, Rifbound, etc.)
 * Users don't need to select which TCG - the system handles it automatically
 */
class UnifiedTCGService {
  /**
   * Search cards across all TCGs
   * @param {string} name - Card name to search
   * @param {number} page - Page number
   * @param {number} pageSize - Results per page
   */
  async searchCards(name = '', page = 1, pageSize = 20) {
    const startTime = Date.now()

    try {
      // Search both TCGs in parallel
      log.info(MODULE, `Searching all TCGs for: "${name}"`)

      const [pokemonResults, rifboundResults] = await Promise.all([
        pokemonTCGService.searchCards(name, page, pageSize).catch(err => {
          log.error(MODULE, 'Pokemon search failed', err)
          return { cards: [], pagination: { count: 0 } }
        }),
        rifboundTCGService.searchCards(name, page, pageSize).catch(err => {
          log.error(MODULE, 'Rifbound search failed', err)
          return { cards: [], pagination: { count: 0 } }
        })
      ])

      // Merge results
      const allCards = [
        ...pokemonResults.cards,
        ...rifboundResults.cards
      ]

      // Sort by release date (newest first)
      allCards.sort((a, b) => {
        const dateA = new Date(a.set?.releaseDate || 0)
        const dateB = new Date(b.set?.releaseDate || 0)
        return dateB - dateA
      })

      // Limit to pageSize
      const limitedCards = allCards.slice(0, pageSize)

      const totalDuration = Date.now() - startTime
      log.perf(MODULE, `Unified search completed`, totalDuration)
      log.info(MODULE, `Found ${pokemonResults.cards.length} Pokemon + ${rifboundResults.cards.length} Rifbound = ${limitedCards.length} total`)

      return {
        cards: limitedCards,
        pagination: {
          page,
          pageSize: limitedCards.length,
          count: limitedCards.length,
          totalCount: allCards.length
        },
        fromCache: pokemonResults.fromCache || rifboundResults.fromCache
      }
    } catch (error) {
      log.error(MODULE, 'Unified search failed', error)
      throw new Error('Failed to search cards')
    }
  }

  /**
   * Get card by ID from any TCG
   * @param {string} cardId - Card ID (format: tcg-id or just id)
   */
  async getCardById(cardId) {
    try {
      // Try Pokemon first (most likely)
      try {
        const card = await pokemonTCGService.getCardById(cardId)
        if (card) return card
      } catch (err) {
        log.info(MODULE, `Card ${cardId} not found in Pokemon`)
      }

      // Try Rifbound
      try {
        const card = await rifboundTCGService.getCardById(cardId)
        if (card) return card
      } catch (err) {
        log.info(MODULE, `Card ${cardId} not found in Rifbound`)
      }

      throw new Error('Card not found in any TCG')
    } catch (error) {
      log.error(MODULE, `Get card ${cardId} failed`, error)
      throw new Error('Card not found')
    }
  }

  /**
   * Search cards for autocomplete across all TCGs
   * @param {string} name - Card name
   * @param {number} limit - Max results
   */
  async searchCardsAutocomplete(name, limit = 10) {
    try {
      if (!name || name.length < 2) {
        return []
      }

      // Search both TCGs in parallel
      const [pokemonCards, rifboundCards] = await Promise.all([
        pokemonTCGService.searchCardsAutocomplete(name, limit).catch(() => []),
        rifboundTCGService.searchCardsAutocomplete(name, limit).catch(() => [])
      ])

      // Merge and limit
      const allCards = [...pokemonCards, ...rifboundCards]

      // Sort by release date
      allCards.sort((a, b) => {
        const dateA = new Date(a.releaseDate || 0)
        const dateB = new Date(b.releaseDate || 0)
        return dateB - dateA
      })

      return allCards.slice(0, limit)
    } catch (error) {
      log.error(MODULE, 'Autocomplete search failed', error)
      return []
    }
  }

  /**
   * Get newest cards from all TCGs
   * @param {number} pageSize - Number of cards
   */
  async getNewestCards(pageSize = 20) {
    const startTime = Date.now()

    try {
      // Fetch from both TCGs in parallel
      const [pokemonResults, rifboundResults] = await Promise.all([
        pokemonTCGService.getNewestCards(pageSize).catch(err => {
          log.error(MODULE, 'Pokemon newest cards failed', err)
          return { cards: [], pagination: { count: 0 } }
        }),
        rifboundTCGService.getNewestCards(pageSize).catch(err => {
          log.error(MODULE, 'Rifbound newest cards failed', err)
          return { cards: [], pagination: { count: 0 } }
        })
      ])

      // Merge results
      const allCards = [
        ...pokemonResults.cards,
        ...rifboundResults.cards
      ]

      // Sort by release date (newest first)
      allCards.sort((a, b) => {
        const dateA = new Date(a.set?.releaseDate || 0)
        const dateB = new Date(b.set?.releaseDate || 0)
        return dateB - dateA
      })

      // Limit to pageSize
      const limitedCards = allCards.slice(0, pageSize)

      const totalDuration = Date.now() - startTime
      log.perf(MODULE, 'Get newest cards completed', totalDuration)

      return {
        cards: limitedCards,
        pagination: {
          page: 1,
          pageSize: limitedCards.length,
          count: limitedCards.length,
          totalCount: allCards.length
        },
        fromCache: pokemonResults.fromCache || rifboundResults.fromCache
      }
    } catch (error) {
      log.error(MODULE, 'Get newest cards failed', error)
      throw new Error('Failed to fetch newest cards')
    }
  }
}

export default new UnifiedTCGService()

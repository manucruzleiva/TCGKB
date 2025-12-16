import CardCache from '../models/CardCache.js'
import log from '../utils/logger.js'

const MODULE = 'RifboundTCG'

/**
 * Rifbound TCG Service
 * Placeholder service for Rifbound TCG cards
 * Can be updated later when Rifbound API is available
 */
class RifboundTCGService {
  /**
   * Search Rifbound cards
   * @param {string} name - Card name to search
   * @param {number} page - Page number
   * @param {number} pageSize - Results per page
   */
  async searchCards(name = '', page = 1, pageSize = 20) {
    try {
      // For now, check if we have any Rifbound cards in cache
      const query = {
        'data.tcg': 'rifbound'
      }

      if (name) {
        query['data.name'] = { $regex: name, $options: 'i' }
      }

      const cachedCards = await CardCache.find(query)
        .sort({ 'data.set.releaseDate': -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)

      const cards = cachedCards.map(c => c.data)

      log.info(MODULE, `Search: "${name}" - Found ${cards.length} cards`)

      return {
        cards,
        pagination: {
          page,
          pageSize,
          count: cards.length,
          totalCount: cards.length
        },
        fromCache: true
      }
    } catch (error) {
      log.error(MODULE, 'Search failed', error)
      return {
        cards: [],
        pagination: {
          page,
          pageSize,
          count: 0,
          totalCount: 0
        }
      }
    }
  }

  /**
   * Get Rifbound card by ID
   * @param {string} cardId - Card ID
   */
  async getCardById(cardId) {
    try {
      const cached = await CardCache.findOne({
        cardId,
        'data.tcg': 'rifbound'
      })

      if (cached) {
        // Update view stats
        cached.viewCount += 1
        cached.lastViewed = new Date()
        await cached.save()

        return cached.data
      }

      throw new Error('Rifbound card not found')
    } catch (error) {
      log.error(MODULE, `Get card ${cardId} failed`, error)
      throw new Error('Card not found')
    }
  }

  /**
   * Search Rifbound cards for autocomplete
   * @param {string} name - Card name
   * @param {number} limit - Max results
   */
  async searchCardsAutocomplete(name, limit = 10) {
    try {
      if (!name || name.length < 2) {
        return []
      }

      const query = {
        'data.tcg': 'rifbound',
        'data.name': { $regex: name, $options: 'i' }
      }

      const cachedCards = await CardCache.find(query)
        .sort({ 'data.set.releaseDate': -1 })
        .limit(limit)

      return cachedCards.map(c => ({
        id: c.data.id,
        name: c.data.name,
        image: c.data.images?.small || c.data.images?.large,
        set: c.data.set?.name,
        releaseDate: c.data.set?.releaseDate,
        tcg: 'rifbound'
      }))
    } catch (error) {
      log.error(MODULE, 'Autocomplete search failed', error)
      return []
    }
  }

  /**
   * Get newest Rifbound cards
   * @param {number} pageSize - Number of cards
   */
  async getNewestCards(pageSize = 20) {
    try {
      const cachedCards = await CardCache.find({ 'data.tcg': 'rifbound' })
        .sort({ 'data.set.releaseDate': -1 })
        .limit(pageSize)

      const cards = cachedCards.map(c => c.data)

      log.info(MODULE, `Got ${cards.length} newest cards`)

      return {
        cards,
        pagination: {
          page: 1,
          pageSize,
          count: cards.length,
          totalCount: cards.length
        },
        fromCache: true
      }
    } catch (error) {
      log.error(MODULE, 'Get newest cards failed', error)
      return {
        cards: [],
        pagination: {
          page: 1,
          pageSize,
          count: 0,
          totalCount: 0
        }
      }
    }
  }

  /**
   * Cache a Rifbound card
   * @param {Object} card - Card data
   */
  async cacheCard(card) {
    try {
      // Ensure card has tcg field
      const cardData = {
        ...card,
        tcg: 'rifbound'
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      await CardCache.findOneAndUpdate(
        { cardId: cardData.id },
        {
          cardId: cardData.id,
          data: cardData,
          cachedAt: new Date(),
          expiresAt,
          $inc: { viewCount: 1 },
          lastViewed: new Date()
        },
        { upsert: true, new: true }
      )

      log.info(MODULE, `Cached card: ${cardData.id}`)
    } catch (error) {
      log.error(MODULE, 'Cache card failed', error)
    }
  }

  /**
   * Cache multiple Rifbound cards
   * @param {Array} cards - Array of cards
   */
  async cacheCards(cards) {
    try {
      const cachePromises = cards.map(card => this.cacheCard(card))
      await Promise.all(cachePromises)
      log.info(MODULE, `Cached ${cards.length} cards`)
    } catch (error) {
      log.error(MODULE, 'Batch cache failed', error)
    }
  }
}

export default new RifboundTCGService()

import pokemon from 'pokemontcgsdk'
import CardCache from '../models/CardCache.js'

// Configure Pokemon TCG SDK
pokemon.configure({ apiKey: process.env.POKEMON_TCG_API_KEY })

class PokemonTCGService {
  /**
   * Search cards with caching
   * @param {string} name - Card name to search
   * @param {number} page - Page number
   * @param {number} pageSize - Results per page
   */
  async searchCards(name = '', page = 1, pageSize = 20, excludeSpecialRares = true) {
    try {
      // Build query - exclude special rares by default
      let queryParts = []

      if (name) {
        queryParts.push(`name:"${name}*"`)
      }

      // Exclude Special Illustration Rare, Hyper Rare, and other ultra-rare variants
      if (excludeSpecialRares) {
        queryParts.push(
          '!rarity:"Special Illustration Rare"',
          '!rarity:"Hyper Rare"',
          '!rarity:"Illustration Rare"',
          '!rarity:"Ultra Rare"'
        )
      }

      const query = queryParts.join(' ')

      // Fetch from Pokemon TCG API
      const result = await pokemon.card.where({
        q: query || undefined,
        page,
        pageSize,
        orderBy: '-set.releaseDate' // Newest first
      })

      // Cache each card
      if (result.data && result.data.length > 0) {
        await this.cacheCards(result.data)
      }

      return {
        cards: result.data || [],
        pagination: {
          page: result.page || page,
          pageSize: result.pageSize || pageSize,
          count: result.count || 0,
          totalCount: result.totalCount || 0
        }
      }
    } catch (error) {
      console.error('Pokemon TCG API Error:', error)
      throw new Error('Failed to fetch cards from Pokemon TCG API')
    }
  }

  /**
   * Get card by ID with caching
   * @param {string} cardId - Pokemon TCG card ID
   */
  async getCardById(cardId) {
    try {
      // Check cache first
      const cached = await CardCache.findOne({ cardId })

      // Return cached if valid
      if (cached && new Date() < cached.expiresAt) {
        // Update view stats
        cached.viewCount += 1
        cached.lastViewed = new Date()
        await cached.save()

        return cached.data
      }

      // Fetch from API
      const card = await pokemon.card.find(cardId)

      if (!card) {
        throw new Error('Card not found')
      }

      // Cache the card
      await this.cacheCard(card)

      return card
    } catch (error) {
      console.error('Get card error:', error)

      // If API fails, try returning stale cache
      if (cached) {
        console.log('Returning stale cache for card:', cardId)
        return cached.data
      }

      throw new Error('Card not found')
    }
  }

  /**
   * Search cards for autocomplete (@ mentions)
   * @param {string} name - Card name to search
   * @param {number} limit - Max results
   */
  async searchCardsAutocomplete(name, limit = 10) {
    try {
      if (!name || name.length < 2) {
        return []
      }

      const result = await pokemon.card.where({
        q: `name:"${name}*"`,
        pageSize: limit,
        orderBy: '-set.releaseDate'
      })

      return (result.data || []).map(card => ({
        id: card.id,
        name: card.name,
        image: card.images?.small || card.images?.large,
        set: card.set?.name,
        releaseDate: card.set?.releaseDate
      }))
    } catch (error) {
      console.error('Autocomplete search error:', error)
      return []
    }
  }

  /**
   * Cache a single card
   */
  async cacheCard(card) {
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      await CardCache.findOneAndUpdate(
        { cardId: card.id },
        {
          cardId: card.id,
          data: card,
          cachedAt: new Date(),
          expiresAt,
          $inc: { viewCount: 1 },
          lastViewed: new Date()
        },
        { upsert: true, new: true }
      )
    } catch (error) {
      console.error('Cache error:', error)
    }
  }

  /**
   * Cache multiple cards
   */
  async cacheCards(cards) {
    try {
      const cachePromises = cards.map(card => this.cacheCard(card))
      await Promise.all(cachePromises)
    } catch (error) {
      console.error('Batch cache error:', error)
    }
  }

  /**
   * Get newest cards (for homepage)
   */
  async getNewestCards(pageSize = 20) {
    try {
      const result = await pokemon.card.where({
        pageSize,
        orderBy: '-set.releaseDate'
      })

      if (result.data && result.data.length > 0) {
        await this.cacheCards(result.data)
      }

      return {
        cards: result.data || [],
        pagination: {
          page: 1,
          pageSize,
          count: result.count || 0,
          totalCount: result.totalCount || 0
        }
      }
    } catch (error) {
      console.error('Get newest cards error:', error)
      throw new Error('Failed to fetch newest cards')
    }
  }
}

export default new PokemonTCGService()

import pokemon from 'pokemontcgsdk'
import CardCache from '../models/CardCache.js'
import log from '../utils/logger.js'

// Configure Pokemon TCG SDK
pokemon.configure({ apiKey: process.env.POKEMON_TCG_API_KEY })

const MODULE = 'PokemonTCG'

// Excluded rarities
const EXCLUDED_RARITIES = [
  'Hyper Rare',
  'Ultra Rare',
  'Special Illustration Rare',
  'Shiny Rare',
  'Illustration Rare',
  'Rare Secret',
  'Trainer Gallery Rare',
  'Rare Holo',
  'Rare Holo EX',
  'Rare Holo GX',
  'Rare Holo V',
  'Rare Holo VMAX',
  'Rare Holo VSTAR'
]

// Valid regulation marks (G, H, I onwards - non-rotated)
const VALID_REGULATION_MARKS = ['G', 'H', 'I', 'J', 'K']

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length
  const len2 = str2.length
  const matrix = []

  if (len1 === 0) return len2
  if (len2 === 0) return len1

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[len2][len1]
}

/**
 * Check if card name matches search with fuzzy tolerance
 */
function fuzzyMatch(cardName, searchTerm) {
  const cardLower = cardName.toLowerCase()
  const searchLower = searchTerm.toLowerCase()

  // Exact match or contains
  if (cardLower.includes(searchLower)) {
    return true
  }

  // Fuzzy match - allow 1-2 character differences
  const maxDistance = searchLower.length <= 5 ? 1 : 2
  const distance = levenshteinDistance(cardLower, searchLower)

  return distance <= maxDistance
}

class PokemonTCGService {
  /**
   * Add TCG identifier to card
   */
  addTCGField(card) {
    return {
      ...card,
      tcg: 'pokemon'
    }
  }

  /**
   * Add TCG identifier to multiple cards
   */
  addTCGFields(cards) {
    return cards.map(card => this.addTCGField(card))
  }

  /**
   * Filter cards by excluding certain rarities and rotated cards
   */
  filterCards(cards, searchTerm = null) {
    return cards.filter(card => {
      // Filter by regulation mark (only G, H, I onwards)
      if (card.regulationMark && !VALID_REGULATION_MARKS.includes(card.regulationMark)) {
        return false
      }

      // Filter by rarity
      if (card.rarity && EXCLUDED_RARITIES.includes(card.rarity)) {
        return false
      }

      // Fuzzy match if search term provided
      if (searchTerm && card.name) {
        return fuzzyMatch(card.name, searchTerm)
      }

      return true
    })
  }
  /**
   * Search cards with caching
   * @param {string} name - Card name to search
   * @param {number} page - Page number
   * @param {number} pageSize - Results per page
   */
  async searchCards(name = '', page = 1, pageSize = 20, excludeSpecialRares = true) {
    const startTime = Date.now()
    const searchKey = name || 'all'

    try {
      // PRIORITY 1: Check MongoDB cache first for ultra-fast results
      if (page === 1) {
        const cacheStartTime = Date.now()
        const query = name
          ? { 'data.name': { $regex: name, $options: 'i' } }
          : {}

        const cachedCards = await CardCache.find(query)
          .sort({ 'data.set.releaseDate': -1 })
          .limit(pageSize)

        if (cachedCards.length > 0) {
          const cacheDuration = Date.now() - cacheStartTime
          log.perf(MODULE, `Cache hit for "${searchKey}"`, cacheDuration)

          // Filter by regulation, rarity and fuzzy match
          const filteredCards = this.addTCGFields(
            this.filterCards(cachedCards.map(c => c.data), name)
          )

          return {
            cards: filteredCards,
            pagination: {
              page: 1,
              pageSize,
              count: filteredCards.length,
              totalCount: filteredCards.length
            },
            fromCache: true
          }
        }
        log.info(MODULE, `Cache miss for "${searchKey}", fetching from API`)
      }

      // PRIORITY 2: Fetch from Pokemon TCG API
      let query = ''
      if (name) {
        query = `name:${name}*`
      }

      const queryParams = {
        page,
        pageSize,
        orderBy: '-set.releaseDate'
      }

      if (query) {
        queryParams.q = query
      }

      log.info(MODULE, `Fetching from TCG API: "${searchKey}"`, { page, pageSize })
      const apiStartTime = Date.now()

      const result = await pokemon.card.where(queryParams)

      const apiDuration = Date.now() - apiStartTime
      log.perf(MODULE, `TCG API call for "${searchKey}"`, apiDuration)

      // Filter by regulation, rarity and fuzzy match
      const filteredCards = this.addTCGFields(
        this.filterCards(result.data || [], name)
      )
      log.info(MODULE, `Filtered ${(result.data || []).length - filteredCards.length} cards`)

      // Cache results asynchronously (don't wait)
      if (result.data && result.data.length > 0) {
        this.cacheCards(result.data).catch(err =>
          log.error(MODULE, 'Background cache failed', err)
        )
      }

      const totalDuration = Date.now() - startTime
      log.perf(MODULE, `Total search for "${searchKey}"`, totalDuration)

      return {
        cards: filteredCards,
        pagination: {
          page: result.page || page,
          pageSize: filteredCards.length,
          count: filteredCards.length,
          totalCount: filteredCards.length
        }
      }
    } catch (error) {
      log.error(MODULE, `Search failed for "${searchKey}"`, error)

      // Fallback to cache on error
      try {
        const query = name
          ? { 'data.name': { $regex: name, $options: 'i' } }
          : {}

        const cachedCards = await CardCache.find(query)
          .sort({ 'data.set.releaseDate': -1 })
          .limit(pageSize)

        if (cachedCards.length > 0) {
          log.warn(MODULE, `Returning cached fallback for "${searchKey}"`, { count: cachedCards.length })

          // Filter by regulation, rarity and fuzzy match
          const filteredCards = this.addTCGFields(
            this.filterCards(cachedCards.map(c => c.data), name)
          )

          return {
            cards: filteredCards,
            pagination: {
              page: 1,
              pageSize,
              count: filteredCards.length,
              totalCount: filteredCards.length
            },
            fromCache: true
          }
        }
      } catch (cacheError) {
        log.error(MODULE, 'Cache fallback failed', cacheError)
      }

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

        return this.addTCGField(cached.data)
      }

      // Fetch from API
      const card = await pokemon.card.find(cardId)

      if (!card) {
        throw new Error('Card not found')
      }

      // Cache the card
      await this.cacheCard(card)

      return this.addTCGField(card)
    } catch (error) {
      console.error('Get card error:', error)

      // If API fails, try returning stale cache
      if (cached) {
        console.log('Returning stale cache for card:', cardId)
        return this.addTCGField(cached.data)
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
        releaseDate: card.set?.releaseDate,
        tcg: 'pokemon'
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

      // Ensure card has tcg field
      const cardData = this.addTCGField(card)

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
    const startTime = Date.now()

    try {
      // Check cache first
      const cachedCards = await CardCache.find()
        .sort({ 'data.set.releaseDate': -1 })
        .limit(pageSize)

      if (cachedCards.length >= pageSize) {
        log.perf(MODULE, 'Newest cards from cache', Date.now() - startTime)

        // Filter by regulation and rarity
        const filteredCards = this.addTCGFields(
          this.filterCards(cachedCards.map(c => c.data))
        )

        return {
          cards: filteredCards,
          pagination: {
            page: 1,
            pageSize,
            count: filteredCards.length,
            totalCount: filteredCards.length
          },
          fromCache: true
        }
      }

      // Fetch from API if cache insufficient
      log.info(MODULE, 'Fetching newest cards from API')
      const result = await pokemon.card.where({
        pageSize,
        orderBy: '-set.releaseDate'
      })

      if (result.data && result.data.length > 0) {
        this.cacheCards(result.data).catch(err =>
          log.error(MODULE, 'Background cache failed', err)
        )
      }

      log.perf(MODULE, 'Newest cards from API', Date.now() - startTime)

      // Filter by regulation and rarity
      const filteredCards = this.addTCGFields(
        this.filterCards(result.data || [])
      )

      return {
        cards: filteredCards,
        pagination: {
          page: 1,
          pageSize,
          count: filteredCards.length,
          totalCount: filteredCards.length
        }
      }
    } catch (error) {
      log.error(MODULE, 'Get newest cards failed', error)

      // Fallback to any cached cards
      try {
        const cachedCards = await CardCache.find()
          .sort({ 'data.set.releaseDate': -1 })
          .limit(pageSize)

        if (cachedCards.length > 0) {
          log.warn(MODULE, 'Returning cached fallback', { count: cachedCards.length })

          // Filter by regulation and rarity
          const filteredCards = this.addTCGFields(
            this.filterCards(cachedCards.map(c => c.data))
          )

          return {
            cards: filteredCards,
            pagination: {
              page: 1,
              pageSize,
              count: filteredCards.length,
              totalCount: filteredCards.length
            },
            fromCache: true
          }
        }
      } catch (cacheError) {
        log.error(MODULE, 'Cache fallback failed', cacheError)
      }

      throw new Error('Failed to fetch newest cards')
    }
  }
}

export default new PokemonTCGService()

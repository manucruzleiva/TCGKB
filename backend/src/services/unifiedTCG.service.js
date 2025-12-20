import pokemon from 'pokemontcgsdk'
import CardCache from '../models/CardCache.js'
import log from '../utils/logger.js'
import { searchCache, cardCache } from '../utils/memoryCache.js'
import riftboundService from './riftboundTCG.service.js'

// Configure Pokemon TCG SDK
pokemon.configure({ apiKey: process.env.POKEMON_TCG_API_KEY })

const MODULE = 'UnifiedTCG'

// Excluded rarities for Pokemon
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

/**
 * Sort cards by Standard legal and rarity
 * Priority: Standard legal + low rarity first
 */
function sortByStandardAndRarity(cards) {
  const rarityOrder = {
    'Common': 1,
    'Uncommon': 2,
    'Rare': 3,
    'Double Rare': 4,
    'Rare Holo': 5,
    'Rare Holo V': 6,
    'Rare Holo VMAX': 7,
    'Rare Holo ex': 8,
    'Ultra Rare': 9,
    'Rare Ultra': 10,
    'Rare Secret': 11,
    'Rare Rainbow': 12,
    'Hyper Rare': 13,
    'Special Illustration Rare': 14
  }

  return cards.sort((a, b) => {
    // 1. Prioritize Standard legal
    const aStandard = a.set?.legalities?.standard === 'Legal' ? 0 : 1
    const bStandard = b.set?.legalities?.standard === 'Legal' ? 0 : 1

    if (aStandard !== bStandard) {
      return aStandard - bStandard
    }

    // 2. Then by rarity (lower is better)
    const aRarity = rarityOrder[a.rarity] || 999
    const bRarity = rarityOrder[b.rarity] || 999

    if (aRarity !== bRarity) {
      return aRarity - bRarity
    }

    // 3. Finally by release date (newer first)
    const aDate = a.set?.releaseDate || '1900-01-01'
    const bDate = b.set?.releaseDate || '1900-01-01'
    return bDate.localeCompare(aDate)
  })
}

/**
 * Unified TCG Service
 * Ultra-fast search with 3-level cache across all TCG systems
 */
class UnifiedTCGService {
  /**
   * Filter Pokemon cards by regulation mark and rarity
   */
  filterPokemonCards(cards, searchTerm = null) {
    return cards.filter(card => {
      // Skip if not Pokemon card
      if (card.tcgSystem && card.tcgSystem !== 'pokemon') return true

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
   * Search Pokemon TCG API
   */
  async searchPokemon(name, page, pageSize) {
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

    const result = await pokemon.card.where(queryParams)
    return result.data || []
  }

  /**
   * Search Rifbound (cache first, then API)
   */
  async searchRifbound(name, page, pageSize) {
    try {
      // Try cache first
      const query = {
        'data.tcgSystem': 'riftbound'
      }

      if (name) {
        query['data.name'] = { $regex: name, $options: 'i' }
      }

      const cachedCards = await CardCache.find(query)
        .sort({ 'data.set.releaseDate': -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()

      if (cachedCards.length > 0) {
        return cachedCards.map(c => c.data)
      }

      // Fallback to Riftbound API
      const cards = await riftboundService.searchCards(name, pageSize)

      // Background cache
      if (cards.length > 0) {
        this.cacheCards(cards, 'riftbound').catch(err =>
          log.error(MODULE, 'Background Riftbound cache failed', err)
        )
      }

      return cards
    } catch (error) {
      log.error(MODULE, 'Rifbound search failed', error)
      return []
    }
  }

  /**
   * Search cards across all TCGs with ultra-fast 3-level cache
   * LEVEL 1: Memory cache (1-5ms)
   * LEVEL 2: MongoDB cache with indexes (10-50ms)
   * LEVEL 3: External APIs (200-500ms)
   */
  async searchCards(name = '', page = 1, pageSize = 20) {
    const startTime = Date.now()
    const searchKey = `${name.toLowerCase().trim()}_p${page}_s${pageSize}`

    try {
      // LEVEL 1: Memory cache (ultra-fast)
      const memCached = searchCache.get('search', searchKey)
      if (memCached) {
        log.perf(MODULE, `L1 cache hit for "${name}"`, Date.now() - startTime)
        return {
          cards: memCached.cards,
          pagination: memCached.pagination,
          fromCache: true
        }
      }

      // LEVEL 2: MongoDB cache (fast)
      if (page === 1) {
        const query = name
          ? { 'data.name': { $regex: name, $options: 'i' } }
          : {}

        const cachedCards = await CardCache.find(query)
          .sort({ 'data.set.releaseDate': -1 })
          .limit(pageSize * 2) // Get extra for filtering
          .lean()

        if (cachedCards.length > 0) {
          const filteredCards = this.filterPokemonCards(
            cachedCards.map(c => c.data),
            name
          ).slice(0, pageSize)

          const result = {
            cards: filteredCards,
            pagination: {
              page: 1,
              pageSize,
              count: filteredCards.length,
              totalCount: filteredCards.length
            },
            fromCache: true
          }

          // Store in memory cache (4 hours)
          searchCache.set('search', searchKey, result, 14400000)

          log.perf(MODULE, `L2 cache hit for "${name}"`, Date.now() - startTime)
          return result
        }
      }

      log.info(MODULE, `Cache miss for "${name}", fetching from APIs`)

      // LEVEL 3: Fetch from external APIs (parallel)
      const [pokemonCards, rifboundCards] = await Promise.all([
        this.searchPokemon(name, page, pageSize).catch(err => {
          log.error(MODULE, 'Pokemon API failed', err)
          return []
        }),
        this.searchRifbound(name, page, pageSize).catch(err => {
          log.error(MODULE, 'Rifbound search failed', err)
          return []
        })
      ])

      // Add tcgSystem field
      const pokemonCardsTagged = pokemonCards.map(c => ({ ...c, tcgSystem: 'pokemon' }))
      const rifboundCardsTagged = rifboundCards.map(c => ({ ...c, tcgSystem: 'rifbound' }))

      // Filter Pokemon cards
      const filteredPokemon = this.filterPokemonCards(pokemonCardsTagged, name)

      // Merge and sort
      const allCards = [...filteredPokemon, ...rifboundCardsTagged]
      allCards.sort((a, b) => {
        const dateA = new Date(a.set?.releaseDate || 0)
        const dateB = new Date(b.set?.releaseDate || 0)
        return dateB - dateA
      })

      const limitedCards = allCards.slice(0, pageSize)

      const result = {
        cards: limitedCards,
        pagination: {
          page,
          pageSize: limitedCards.length,
          count: limitedCards.length,
          totalCount: allCards.length
        }
      }

      // Cache results (async, don't wait)
      if (pokemonCards.length > 0) {
        this.cacheCards(pokemonCardsTagged, 'pokemon').catch(err =>
          log.error(MODULE, 'Background cache failed', err)
        )
      }

      // Store in memory cache (4 hours)
      searchCache.set('search', searchKey, result, 14400000)

      log.perf(MODULE, `API search for "${name}"`, Date.now() - startTime)
      log.info(MODULE, `Found ${filteredPokemon.length} Pokemon + ${rifboundCardsTagged.length} Rifbound = ${limitedCards.length} total`)

      return result

    } catch (error) {
      log.error(MODULE, 'Search failed', error)

      // Emergency fallback to cache
      try {
        const query = name
          ? { 'data.name': { $regex: name, $options: 'i' } }
          : {}

        const cachedCards = await CardCache.find(query)
          .sort({ 'data.set.releaseDate': -1 })
          .limit(pageSize)
          .lean()

        if (cachedCards.length > 0) {
          const filteredCards = this.filterPokemonCards(
            cachedCards.map(c => c.data),
            name
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
        log.error(MODULE, 'Fallback cache failed', cacheError)
      }

      throw new Error('Failed to search cards')
    }
  }

  /**
   * Search cards for autocomplete (ultra-fast with 3-level cache)
   * @param {string} name - Search query
   * @param {number} limit - Max results
   * @param {string|null} tcgSystem - Optional TCG filter ('pokemon' or 'riftbound')
   */
  async searchCardsAutocomplete(name, limit = 10, tcgSystem = null) {
    const startTime = Date.now()

    try {
      if (!name || name.length < 2) {
        return []
      }

      const searchKey = `${name.toLowerCase().trim()}_${tcgSystem || 'all'}`

      // LEVEL 1: Memory cache (1-2ms response time)
      const memCached = searchCache.get('autocomplete', searchKey)
      if (memCached) {
        log.perf(MODULE, `L1 autocomplete hit "${searchKey}"`, Date.now() - startTime)
        return memCached.slice(0, limit)
      }

      // LEVEL 2: MongoDB cache with index (5-20ms response time)
      const dbQuery = {
        'data.name': { $regex: `^${name}`, $options: 'i' }
      }
      // Filter by TCG system if specified
      if (tcgSystem) {
        dbQuery.tcgSystem = tcgSystem
      }

      const dbCached = await CardCache.find(dbQuery)
        .limit(limit * 3)
        .sort({ 'data.set.releaseDate': -1 })
        .lean()

      if (dbCached.length > 0) {
        const filtered = dbCached
          .filter(c => fuzzyMatch(c.data.name, name))
          .map(c => c.data)

        const sorted = sortByStandardAndRarity(filtered)

        const results = sorted
          .slice(0, limit)
          .map(card => ({
            id: card.id,
            name: card.name,
            supertype: card.supertype, // Include supertype for deck building
            images: card.images,
            set: card.set,
            number: card.number,
            rarity: card.rarity,
            tcgSystem: card.tcgSystem || 'pokemon',
            attacks: card.attacks || [],
            abilities: card.abilities || []
          }))

        searchCache.set('autocomplete', searchKey, results, 14400000) // 4 hours
        log.perf(MODULE, `L2 autocomplete hit "${searchKey}"`, Date.now() - startTime)
        return results
      }

      log.info(MODULE, `Autocomplete cache miss for "${searchKey}", fetching from API`)

      // LEVEL 3: Fetch from external APIs (200-500ms)
      // Only fetch from relevant TCG if filter is specified
      let pokemonResults = []
      let rifboundResults = []

      if (!tcgSystem || tcgSystem === 'pokemon') {
        pokemonResults = await pokemon.card.where({
          q: `name:${name}*`,
          pageSize: limit * 2,
          orderBy: '-set.releaseDate'
        }).then(res => res.data || []).catch(() => [])
      }

      if (!tcgSystem || tcgSystem === 'riftbound') {
        rifboundResults = await this.searchRifbound(name, 1, limit).catch(() => [])
      }

      // Combine results
      const allResults = [
        ...pokemonResults.map(c => ({ ...c, tcgSystem: 'pokemon' })),
        ...rifboundResults
      ]

      const filtered = allResults.filter(card => fuzzyMatch(card.name, name))
      const sorted = sortByStandardAndRarity(filtered)

      const filteredResults = sorted
        .slice(0, limit)
        .map(card => ({
          id: card.id,
          name: card.name,
          supertype: card.supertype, // Include supertype for deck building
          images: card.images,
          set: card.set,
          number: card.number,
          rarity: card.rarity,
          tcgSystem: card.tcgSystem || 'pokemon',
          attacks: card.attacks || [],
          abilities: card.abilities || []
        }))

      // Cache results (4 hours)
      searchCache.set('autocomplete', searchKey, filteredResults, 14400000)

      // Background cache to MongoDB
      if (pokemonResults.length > 0) {
        this.cacheCards(pokemonResults.map(c => ({ ...c, tcgSystem: 'pokemon' })), 'pokemon').catch(err =>
          log.error(MODULE, 'Background autocomplete cache failed', err)
        )
      }

      log.perf(MODULE, `API autocomplete "${searchKey}"`, Date.now() - startTime)
      return filteredResults

    } catch (error) {
      log.error(MODULE, 'Autocomplete failed', error)

      // Emergency fallback
      try {
        const fallbackQuery = {
          'data.name': { $regex: name, $options: 'i' }
        }
        if (tcgSystem) {
          fallbackQuery.tcgSystem = tcgSystem
        }

        const fallbackResults = await CardCache.find(fallbackQuery)
          .limit(limit)
          .lean()

        if (fallbackResults.length > 0) {
          return fallbackResults.map(c => ({
            id: c.data.id,
            name: c.data.name,
            supertype: c.data.supertype, // Include supertype for deck building
            images: c.data.images,
            set: c.data.set,
            number: c.data.number,
            tcgSystem: c.data.tcgSystem || 'pokemon',
            attacks: c.data.attacks || [],
            abilities: c.data.abilities || []
          }))
        }
      } catch (fallbackError) {
        log.error(MODULE, 'Fallback autocomplete failed', fallbackError)
      }

      return []
    }
  }

  /**
   * Get card by ID from any TCG (with memory cache)
   */
  async getCardById(cardId) {
    const startTime = Date.now()

    try {
      // LEVEL 1: Memory cache
      const memCached = cardCache.get('card', cardId)
      if (memCached) {
        log.perf(MODULE, `L1 card cache hit ${cardId}`, Date.now() - startTime)
        return memCached
      }

      // LEVEL 2: MongoDB cache
      const cached = await CardCache.findOne({ cardId })

      if (cached && new Date() < cached.expiresAt) {
        // Update stats
        cached.viewCount += 1
        cached.lastViewed = new Date()
        await cached.save()

        // Store in memory cache (24 hours)
        cardCache.set('card', cardId, cached.data, 86400000)

        log.perf(MODULE, `L2 card cache hit ${cardId}`, Date.now() - startTime)
        return cached.data
      }

      // LEVEL 3: Try Pokemon API first
      try {
        const card = await pokemon.card.find(cardId)
        if (card) {
          const cardData = { ...card, tcgSystem: 'pokemon' }
          await this.cacheCard(cardData, 'pokemon')
          cardCache.set('card', cardId, cardData, 86400000) // 24 hours
          log.perf(MODULE, `Pokemon API card ${cardId}`, Date.now() - startTime)
          return cardData
        }
      } catch (pokemonErr) {
        log.info(MODULE, `Card ${cardId} not found in Pokemon`)
      }

      // Try Riftbound API
      try {
        const card = await riftboundService.getCardById(cardId)
        if (card) {
          await this.cacheCard(card, 'riftbound')
          cardCache.set('card', cardId, card, 86400000) // 24 hours
          log.perf(MODULE, `Riftbound API card ${cardId}`, Date.now() - startTime)
          return card
        }
      } catch (riftboundErr) {
        log.info(MODULE, `Card ${cardId} not found in Riftbound`)
      }

      // Return stale cache if API failed
      if (cached) {
        log.warn(MODULE, `Returning stale cache for ${cardId}`)
        return cached.data
      }

      throw new Error('Card not found in any TCG')
    } catch (error) {
      log.error(MODULE, `Get card ${cardId} failed`, error)
      throw new Error('Card not found')
    }
  }

  /**
   * Get newest cards from all TCGs
   */
  async getNewestCards(pageSize = 20) {
    const startTime = Date.now()

    try {
      // Check cache first
      const cachedCards = await CardCache.find()
        .sort({ 'data.set.releaseDate': -1 })
        .limit(pageSize * 2)
        .lean()

      if (cachedCards.length >= pageSize) {
        const filteredCards = this.filterPokemonCards(
          cachedCards.map(c => c.data)
        ).slice(0, pageSize)

        log.perf(MODULE, 'Newest cards from cache', Date.now() - startTime)

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

      // Fetch from Pokemon API
      const result = await pokemon.card.where({
        pageSize,
        orderBy: '-set.releaseDate'
      })

      const pokemonCards = (result.data || []).map(c => ({ ...c, tcgSystem: 'pokemon' }))
      const filteredCards = this.filterPokemonCards(pokemonCards)

      // Background cache
      if (pokemonCards.length > 0) {
        this.cacheCards(pokemonCards, 'pokemon').catch(err =>
          log.error(MODULE, 'Background cache failed', err)
        )
      }

      log.perf(MODULE, 'Newest cards from API', Date.now() - startTime)

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

      // Fallback to cache
      try {
        const cachedCards = await CardCache.find()
          .sort({ 'data.set.releaseDate': -1 })
          .limit(pageSize)
          .lean()

        if (cachedCards.length > 0) {
          const filteredCards = this.filterPokemonCards(
            cachedCards.map(c => c.data)
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

  /**
   * Cache a single card
   */
  async cacheCard(card, tcgSystem) {
    try {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      const cardData = { ...card, tcgSystem }

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
      log.error(MODULE, 'Cache card failed', error)
    }
  }

  /**
   * Cache multiple cards
   */
  async cacheCards(cards, tcgSystem) {
    try {
      const cachePromises = cards.map(card => this.cacheCard(card, tcgSystem))
      await Promise.all(cachePromises)
    } catch (error) {
      log.error(MODULE, 'Batch cache failed', error)
    }
  }
}

export default new UnifiedTCGService()

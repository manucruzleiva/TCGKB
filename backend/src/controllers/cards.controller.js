import unifiedTCGService from '../services/unifiedTCG.service.js'
import Reaction from '../models/Reaction.js'
import Comment from '../models/Comment.js'
import CardCache from '../models/CardCache.js'
import Reprint from '../models/Reprint.js'
import log from '../utils/logger.js'
import { popularityCache } from '../utils/memoryCache.js'

const MODULE = 'CardsController'

/**
 * Get cards with search and pagination
 */
export const getCards = async (req, res) => {
  const startTime = Date.now()
  try {
    const { name = '', page = 1, pageSize = 20 } = req.query
    const normalizedPageSize = Math.min(parseInt(pageSize), 20) // Max 20 per page for speed

    log.info(MODULE, `GET /cards - name:"${name}" page:${page} size:${normalizedPageSize}`)

    const result = await unifiedTCGService.searchCards(
      name,
      parseInt(page),
      normalizedPageSize
    )

    log.perf(MODULE, 'GET /cards completed', Date.now() - startTime)

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    log.error(MODULE, 'GET /cards failed', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get card by ID with stats
 */
export const getCardById = async (req, res) => {
  try {
    const { cardId } = req.params

    // Fetch card data
    const card = await unifiedTCGService.getCardById(cardId)

    // Get stats
    const [commentCount, reactions] = await Promise.all([
      Comment.countDocuments({ cardId, isModerated: false }),
      Reaction.aggregate([
        { $match: { targetType: 'card', targetId: cardId } },
        {
          $group: {
            _id: '$emoji',
            count: { $sum: 1 }
          }
        }
      ])
    ])

    // Format reaction counts
    const reactionCounts = reactions.reduce((acc, r) => {
      acc[r._id] = r.count
      return acc
    }, {})

    res.status(200).json({
      success: true,
      data: {
        card,
        stats: {
          commentCount,
          reactionCounts
        }
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Search cards for autocomplete
 */
export const searchCardsAutocomplete = async (req, res) => {
  try {
    const { name = '', limit = 10 } = req.query

    const cards = await unifiedTCGService.searchCardsAutocomplete(
      name,
      parseInt(limit)
    )

    res.status(200).json({
      success: true,
      data: { cards }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get newest cards (homepage)
 */
export const getNewestCards = async (req, res) => {
  try {
    const { pageSize = 20 } = req.query

    const result = await unifiedTCGService.getNewestCards(
      Math.min(parseInt(pageSize), 100)
    )

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get alternate arts/reprints of a card
 * Cards are considered reprints if they have:
 * - Same name
 * - Same attacks (100% match)
 * - Same abilities (100% match)
 */
export const getCardAlternateArts = async (req, res) => {
  try {
    const { cardId } = req.params

    // Get the original card
    const originalCard = await unifiedTCGService.getCardById(cardId)

    if (!originalCard) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      })
    }

    // Search for cards with the same name
    const searchResults = await unifiedTCGService.searchCards(
      originalCard.name,
      1,
      50 // Get up to 50 potential matches
    )

    const allCards = searchResults.cards || []

    // Helper function to compare attacks
    const attacksMatch = (attacks1, attacks2) => {
      if (!attacks1 && !attacks2) return true
      if (!attacks1 || !attacks2) return false
      if (attacks1.length !== attacks2.length) return false

      return attacks1.every((attack1, idx) => {
        const attack2 = attacks2[idx]
        return attack1.name === attack2.name &&
          attack1.damage === attack2.damage &&
          JSON.stringify(attack1.cost || []) === JSON.stringify(attack2.cost || [])
      })
    }

    // Helper function to compare abilities
    const abilitiesMatch = (abilities1, abilities2) => {
      if (!abilities1 && !abilities2) return true
      if (!abilities1 || !abilities2) return false
      if (abilities1.length !== abilities2.length) return false

      return abilities1.every((ability1, idx) => {
        const ability2 = abilities2[idx]
        return ability1.name === ability2.name &&
          ability1.type === ability2.type
      })
    }

    // Filter to find reprints/alternate arts
    const alternateArts = allCards.filter(card => {
      // Skip the original card
      if (card.id === cardId) return false

      // Must have exact same name
      if (card.name !== originalCard.name) return false

      // Attacks must match 100%
      if (!attacksMatch(card.attacks, originalCard.attacks)) return false

      // Abilities must match 100%
      if (!abilitiesMatch(card.abilities, originalCard.abilities)) return false

      return true
    })

    // Sort by release date (newest first)
    alternateArts.sort((a, b) => {
      const dateA = a.set?.releaseDate || '1999-01-01'
      const dateB = b.set?.releaseDate || '1999-01-01'
      return dateB.localeCompare(dateA)
    })

    // Include the original card at the beginning
    const allArts = [originalCard, ...alternateArts]

    log.info(MODULE, `Found ${alternateArts.length} alternate arts for ${originalCard.name}`)

    res.status(200).json({
      success: true,
      data: {
        original: originalCard,
        alternateArts,
        allArts,
        totalCount: allArts.length
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get alternate arts failed', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get multiple cards by IDs (batch endpoint for deck import)
 */
export const getCardsByIds = async (req, res) => {
  const startTime = Date.now()
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids array is required'
      })
    }

    // Limit to 60 cards max (one deck)
    const cardIds = ids.slice(0, 60)

    log.info(MODULE, `POST /cards/batch - fetching ${cardIds.length} cards`)

    // Fetch all cards in parallel with concurrency limit
    const results = await Promise.allSettled(
      cardIds.map(cardId => unifiedTCGService.getCardById(cardId))
    )

    const cards = {}
    const notFound = []

    results.forEach((result, index) => {
      const cardId = cardIds[index]
      if (result.status === 'fulfilled' && result.value) {
        cards[cardId] = {
          id: result.value.id,
          name: result.value.name,
          supertype: result.value.supertype,
          images: result.value.images,
          set: result.value.set,
          tcgSystem: result.value.tcgSystem
        }
      } else {
        notFound.push(cardId)
      }
    })

    log.perf(MODULE, `POST /cards/batch completed (${Object.keys(cards).length} found, ${notFound.length} not found)`, Date.now() - startTime)

    res.status(200).json({
      success: true,
      data: {
        cards,
        notFound
      }
    })
  } catch (error) {
    log.error(MODULE, 'POST /cards/batch failed', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Invalidate the popularity cache (call when reactions/comments change)
 */
export function invalidatePopularityCache() {
  popularityCache.set('popular', 'scores', null, 1) // Set with 1ms TTL to expire immediately
  log.info(MODULE, 'Popularity cache invalidated')
}

/**
 * Compute popularity scores from aggregations (expensive operation)
 * Cached for 1 hour to avoid repeated DB queries
 */
async function computePopularityScores() {
  const startTime = Date.now()

  // Step 1: Get thumbs up reactions per card
  const thumbsUpAgg = await Reaction.aggregate([
    { $match: { targetType: 'card', emoji: '👍' } },
    { $group: { _id: '$targetId', thumbsUp: { $sum: 1 } } }
  ])
  const thumbsUpMap = new Map(thumbsUpAgg.map(r => [r._id, r.thumbsUp]))

  // Step 2: Get thumbs down reactions per card
  const thumbsDownAgg = await Reaction.aggregate([
    { $match: { targetType: 'card', emoji: '👎' } },
    { $group: { _id: '$targetId', thumbsDown: { $sum: 1 } } }
  ])
  const thumbsDownMap = new Map(thumbsDownAgg.map(r => [r._id, r.thumbsDown]))

  // Step 3: Get comment counts per card
  const commentsAgg = await Comment.aggregate([
    { $match: { isModerated: false } },
    { $group: { _id: '$cardId', comments: { $sum: 1 } } }
  ])
  const commentsMap = new Map(commentsAgg.map(r => [r._id, r.comments]))

  // Step 4: Count mentions (@ mentions in comments that reference cards)
  const mentionsAgg = await Comment.aggregate([
    { $match: { isModerated: false, 'mentions.type': 'card' } },
    { $unwind: '$mentions' },
    { $match: { 'mentions.type': 'card' } },
    { $group: { _id: '$mentions.id', mentionCount: { $sum: 1 } } }
  ])
  const mentionsMap = new Map(mentionsAgg.map(r => [r._id, r.mentionCount]))

  // Step 5: Combine all cards that have any engagement
  const allCardIds = new Set([
    ...thumbsUpMap.keys(),
    ...thumbsDownMap.keys(),
    ...commentsMap.keys(),
    ...mentionsMap.keys()
  ])

  // Step 6: Calculate popularity score for each card
  const cardScores = []
  for (const cardId of allCardIds) {
    const thumbsUp = thumbsUpMap.get(cardId) || 0
    const thumbsDown = thumbsDownMap.get(cardId) || 0
    const comments = commentsMap.get(cardId) || 0
    const mentions = mentionsMap.get(cardId) || 0

    // Popularity formula: thumbsUp - thumbsDown + (comments * 2) + mentions
    const score = thumbsUp - thumbsDown + (comments * 2) + mentions

    if (score > 0) {
      cardScores.push({
        cardId,
        score,
        thumbsUp,
        thumbsDown,
        comments,
        mentions
      })
    }
  }

  // Sort by score
  cardScores.sort((a, b) => b.score - a.score)

  log.perf(MODULE, `Computed popularity scores for ${cardScores.length} cards`, Date.now() - startTime)

  return cardScores
}

/**
 * Get popular cards based on hybrid score
 * Formula: thumbsUp - thumbsDown + (comments * 2) + mentions
 * Results are cached for 1 hour
 */
export const getPopularCards = async (req, res) => {
  try {
    const { limit = 20, page = 1, tcgSystem } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Check cache first (key: 'scores' for the computed scores)
    let cardScores = popularityCache.get('popular', 'scores')

    if (!cardScores) {
      // Cache miss - compute scores
      log.info(MODULE, 'Popularity cache miss, computing scores...')
      cardScores = await computePopularityScores()
      popularityCache.set('popular', 'scores', cardScores)
    } else {
      log.info(MODULE, 'Popularity cache hit')
    }

    // Paginate
    const paginatedScores = cardScores.slice(skip, skip + parseInt(limit))

    // Fetch card details (these are individually cached by unifiedTCGService)
    const popularCards = await Promise.all(
      paginatedScores.map(async ({ cardId, score, thumbsUp, thumbsDown, comments, mentions }) => {
        try {
          const card = await unifiedTCGService.getCardById(cardId)
          if (tcgSystem && card.tcgSystem !== tcgSystem) {
            return null
          }
          return {
            id: card.id,
            name: card.name,
            images: card.images,
            set: card.set,
            number: card.number,
            tcgSystem: card.tcgSystem || 'pokemon',
            rarity: card.rarity,
            popularity: {
              score,
              thumbsUp,
              thumbsDown,
              comments,
              mentions
            }
          }
        } catch (error) {
          return null
        }
      })
    )

    const validCards = popularCards.filter(c => c !== null)

    // Include cache stats in response for debugging
    const cacheStats = popularityCache.stats()

    res.status(200).json({
      success: true,
      data: {
        cards: validCards,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: cardScores.length,
          pages: Math.ceil(cardScores.length / parseInt(limit))
        },
        cached: true,
        cacheHitRate: cacheStats.hitRate
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get popular cards failed', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getMostCommentedCards = async (req, res) => {
  try {
    const { limit = 10 } = req.query

    // Get card IDs with most comments
    const topCards = await Comment.aggregate([
      { $match: { isModerated: false } },
      {
        $group: {
          _id: '$cardId',
          commentCount: { $sum: 1 }
        }
      },
      { $sort: { commentCount: -1 } },
      { $limit: parseInt(limit) }
    ])

    // Fetch full card data
    const cardsWithComments = await Promise.all(
      topCards.map(async ({ _id: cardId, commentCount }) => {
        try {
          const card = await unifiedTCGService.getCardById(cardId)
          return {
            id: card.id,
            name: card.name,
            images: card.images,
            set: card.set,
            number: card.number,
            tcgSystem: card.tcgSystem || 'pokemon',
            commentCount
          }
        } catch (error) {
          log.error(MODULE, `Failed to fetch card ${cardId}`, error)
          return null
        }
      })
    )

    // Filter out nulls
    const validCards = cardsWithComments.filter(card => card !== null)

    res.status(200).json({
      success: true,
      data: { cards: validCards }
    })
  } catch (error) {
    log.error(MODULE, 'Get most commented cards failed', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get catalog with filters and pagination
 */
export const getCatalog = async (req, res) => {
  const startTime = Date.now()
  try {
    const {
      tcgSystem,
      set,
      supertype,
      rarity,
      name,
      page = 1,
      pageSize = 24,
      sortBy = 'name',
      sortOrder = 'asc',
      uniqueByName = 'false', // Show only one version per card
      alternateArtsOnly = 'false' // Show only alternate arts
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = Math.min(parseInt(pageSize), 48) // Max 48 per page
    const showUniqueOnly = uniqueByName === 'true'
    const showAlternateArtsOnly = alternateArtsOnly === 'true'

    // Build MongoDB query - card data is stored in 'data' field
    const query = {}

    if (tcgSystem) {
      query.tcgSystem = tcgSystem
    }

    if (set) {
      query['data.set.id'] = set
    }

    if (supertype) {
      query['data.supertype'] = supertype
    }

    if (rarity) {
      query['data.rarity'] = rarity
    }

    if (name) {
      query['data.name'] = { $regex: name, $options: 'i' }
    }

    // Build sort object - fields are in data.*
    const sort = {}
    let sortField
    if (sortBy === 'releaseDate') {
      sortField = 'data.set.releaseDate'
    } else if (sortBy === 'name') {
      sortField = 'data.name'
    } else {
      sortField = `data.${sortBy}`
    }
    sort[sortField] = sortOrder === 'desc' ? -1 : 1

    let total, cachedCards

    if (showAlternateArtsOnly) {
      // Filter to show only cards that are alternate arts in reprint groups
      const altArtReprints = await Reprint.find({
        'variants.reprintType': { $in: ['alternate_art', 'special_art'] },
        ...(tcgSystem && { tcgSystem })
      }).lean()

      const altArtCardIds = new Set()
      altArtReprints.forEach(group => {
        group.variants.forEach(v => {
          if (['alternate_art', 'special_art'].includes(v.reprintType)) {
            altArtCardIds.add(v.cardId)
          }
        })
      })

      query.cardId = { $in: Array.from(altArtCardIds) }

      ;[total, cachedCards] = await Promise.all([
        CardCache.countDocuments(query),
        CardCache.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
      ])
    } else if (showUniqueOnly) {
      // Show only canonical cards (one per reprint group)
      // First, get all reprint groups to know which cards to exclude
      const reprintGroups = await Reprint.find(
        tcgSystem ? { tcgSystem } : {}
      ).lean()

      // Build a set of non-canonical card IDs to exclude
      const nonCanonicalIds = new Set()
      const canonicalIds = new Set()
      reprintGroups.forEach(group => {
        canonicalIds.add(group.canonicalCardId)
        group.variants.forEach(v => {
          if (v.cardId !== group.canonicalCardId) {
            nonCanonicalIds.add(v.cardId)
          }
        })
      })

      // Exclude non-canonical cards
      if (nonCanonicalIds.size > 0) {
        query.cardId = { $nin: Array.from(nonCanonicalIds) }
      }

      ;[total, cachedCards] = await Promise.all([
        CardCache.countDocuments(query),
        CardCache.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
      ])
    } else {
      // Normal query
      ;[total, cachedCards] = await Promise.all([
        CardCache.countDocuments(query),
        CardCache.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
      ])
    }

    // Get variant counts for all returned cards
    const cardIds = cachedCards.map(c => c.cardId)
    const reprintInfo = await Reprint.find({
      $or: [
        { canonicalCardId: { $in: cardIds } },
        { 'variants.cardId': { $in: cardIds } }
      ]
    }).lean()

    // Build a map of cardId -> variant count
    const variantCountMap = new Map()
    reprintInfo.forEach(group => {
      const count = group.variantCount || group.variants.length + 1
      // All cards in this group share the same count
      variantCountMap.set(group.canonicalCardId, count)
      group.variants.forEach(v => {
        variantCountMap.set(v.cardId, count)
      })
    })

    // Transform cached cards to expected format
    const cards = cachedCards.map(c => ({
      id: c.cardId,
      name: c.data?.name,
      supertype: c.data?.supertype,
      images: c.data?.images,
      set: c.data?.set,
      number: c.data?.number,
      rarity: c.data?.rarity,
      tcgSystem: c.tcgSystem,
      regulationMark: c.data?.regulationMark,
      variantCount: variantCountMap.get(c.cardId) || 1
    }))

    const totalPages = Math.ceil(total / limit)

    log.perf(MODULE, `GET /cards/catalog (${cards.length} cards, page ${page}/${totalPages})`, Date.now() - startTime)

    res.status(200).json({
      success: true,
      data: {
        cards,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get catalog failed', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * Get available filter options for catalog
 */
export const getCatalogFilters = async (req, res) => {
  try {
    const { tcgSystem } = req.query

    const matchStage = tcgSystem ? { tcgSystem } : {}

    // Card data is stored in 'data' field
    const [sets, supertypes, rarities] = await Promise.all([
      CardCache.aggregate([
        { $match: matchStage },
        { $group: { _id: { id: '$data.set.id', name: '$data.set.name' }, count: { $sum: 1 } } },
        { $sort: { '_id.name': 1 } }
      ]),
      CardCache.aggregate([
        { $match: matchStage },
        { $group: { _id: '$data.supertype', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      CardCache.aggregate([
        { $match: matchStage },
        { $group: { _id: '$data.rarity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ])

    res.status(200).json({
      success: true,
      data: {
        sets: sets.map(s => ({ id: s._id.id, name: s._id.name, count: s.count })).filter(s => s.id && s.name),
        supertypes: supertypes.map(s => ({ name: s._id, count: s.count })).filter(s => s.name),
        rarities: rarities.map(r => ({ name: r._id, count: r.count })).filter(r => r.name)
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get catalog filters failed', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

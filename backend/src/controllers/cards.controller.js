import unifiedTCGService from '../services/unifiedTCG.service.js'
import Reaction from '../models/Reaction.js'
import Comment from '../models/Comment.js'
import log from '../utils/logger.js'

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
 * Get most commented cards
 */
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

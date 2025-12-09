import pokemonTCGService from '../services/pokemonTCG.service.js'
import Reaction from '../models/Reaction.js'
import Comment from '../models/Comment.js'

/**
 * Get cards with search and pagination
 */
export const getCards = async (req, res) => {
  try {
    const { name = '', page = 1, pageSize = 20 } = req.query

    const result = await pokemonTCGService.searchCards(
      name,
      parseInt(page),
      Math.min(parseInt(pageSize), 100) // Max 100 per page
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
 * Get card by ID with stats
 */
export const getCardById = async (req, res) => {
  try {
    const { cardId } = req.params

    // Fetch card data
    const card = await pokemonTCGService.getCardById(cardId)

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

    const cards = await pokemonTCGService.searchCardsAutocomplete(
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

    const result = await pokemonTCGService.getNewestCards(
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

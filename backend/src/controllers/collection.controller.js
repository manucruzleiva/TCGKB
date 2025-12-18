import Collection, { PLAYSET } from '../models/Collection.js'
import CardCache from '../models/CardCache.js'

// Get user's full collection
export const getCollection = async (req, res) => {
  try {
    const userId = req.user._id
    const { tcgSystem, set, playset, page = 1, limit = 50, sort = '-updatedAt' } = req.query

    // Build filter
    const filter = { userId }
    if (tcgSystem) filter.tcgSystem = tcgSystem
    if (set) filter.cardSet = set

    // Build query
    let query = Collection.find(filter)

    // Sort
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? -1 : 1
    query = query.sort({ [sortField]: sortOrder })

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    query = query.skip(skip).limit(parseInt(limit))

    let items = await query.lean()

    // Filter by playset completion if requested
    if (playset === 'complete') {
      items = items.filter(item => item.quantity >= (PLAYSET[item.tcgSystem] || 4))
    } else if (playset === 'incomplete') {
      items = items.filter(item => item.quantity < (PLAYSET[item.tcgSystem] || 4))
    }

    // Get total count
    const total = await Collection.countDocuments(filter)

    // Add playset info to each item
    const itemsWithPlayset = items.map(item => ({
      ...item,
      playsetMax: PLAYSET[item.tcgSystem] || 4,
      hasPlayset: item.quantity >= (PLAYSET[item.tcgSystem] || 4)
    }))

    res.json({
      success: true,
      data: {
        items: itemsWithPlayset,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('Error getting collection:', error)
    res.status(500).json({
      success: false,
      message: 'Error retrieving collection'
    })
  }
}

// Check ownership of a specific card
export const getCardOwnership = async (req, res) => {
  try {
    const userId = req.user._id
    const { cardId } = req.params

    const item = await Collection.findOne({ userId, cardId }).lean()

    if (!item) {
      return res.json({
        success: true,
        data: {
          owned: false,
          quantity: 0,
          playsetMax: 4, // Default, will be updated when card is added
          hasPlayset: false
        }
      })
    }

    res.json({
      success: true,
      data: {
        owned: true,
        quantity: item.quantity,
        playsetMax: PLAYSET[item.tcgSystem] || 4,
        hasPlayset: item.quantity >= (PLAYSET[item.tcgSystem] || 4)
      }
    })
  } catch (error) {
    console.error('Error checking card ownership:', error)
    res.status(500).json({
      success: false,
      message: 'Error checking card ownership'
    })
  }
}

// Add card to collection or update quantity
export const addToCollection = async (req, res) => {
  try {
    const userId = req.user._id
    const { cardId, quantity = 1, tcgSystem, cardName, cardImage, cardSet, cardRarity } = req.body

    if (!cardId || !tcgSystem) {
      return res.status(400).json({
        success: false,
        message: 'Card ID and TCG system are required'
      })
    }

    // Try to find existing entry
    let item = await Collection.findOne({ userId, cardId })

    if (item) {
      // Update existing entry
      item.quantity = Math.max(0, item.quantity + quantity)

      // Update cached card data if provided
      if (cardName) item.cardName = cardName
      if (cardImage) item.cardImage = cardImage
      if (cardSet) item.cardSet = cardSet
      if (cardRarity) item.cardRarity = cardRarity

      await item.save()
    } else {
      // Create new entry
      item = await Collection.create({
        userId,
        cardId,
        tcgSystem,
        quantity: Math.max(1, quantity),
        cardName,
        cardImage,
        cardSet,
        cardRarity
      })
    }

    res.json({
      success: true,
      data: {
        quantity: item.quantity,
        playsetMax: PLAYSET[tcgSystem] || 4,
        hasPlayset: item.quantity >= (PLAYSET[tcgSystem] || 4)
      }
    })
  } catch (error) {
    console.error('Error adding to collection:', error)
    res.status(500).json({
      success: false,
      message: 'Error adding to collection'
    })
  }
}

// Set exact quantity
export const setQuantity = async (req, res) => {
  try {
    const userId = req.user._id
    const { cardId, quantity, tcgSystem, cardName, cardImage, cardSet, cardRarity } = req.body

    if (!cardId || quantity === undefined || !tcgSystem) {
      return res.status(400).json({
        success: false,
        message: 'Card ID, quantity, and TCG system are required'
      })
    }

    const newQuantity = Math.max(0, parseInt(quantity))

    if (newQuantity === 0) {
      // Remove from collection if quantity is 0
      await Collection.deleteOne({ userId, cardId })
      return res.json({
        success: true,
        data: {
          quantity: 0,
          playsetMax: PLAYSET[tcgSystem] || 4,
          hasPlayset: false
        }
      })
    }

    // Upsert the entry
    const item = await Collection.findOneAndUpdate(
      { userId, cardId },
      {
        $set: {
          quantity: newQuantity,
          tcgSystem,
          cardName,
          cardImage,
          cardSet,
          cardRarity
        }
      },
      { upsert: true, new: true }
    )

    res.json({
      success: true,
      data: {
        quantity: item.quantity,
        playsetMax: PLAYSET[tcgSystem] || 4,
        hasPlayset: item.quantity >= (PLAYSET[tcgSystem] || 4)
      }
    })
  } catch (error) {
    console.error('Error setting quantity:', error)
    res.status(500).json({
      success: false,
      message: 'Error setting quantity'
    })
  }
}

// Remove card from collection
export const removeFromCollection = async (req, res) => {
  try {
    const userId = req.user._id
    const { cardId } = req.params

    await Collection.deleteOne({ userId, cardId })

    res.json({
      success: true,
      message: 'Card removed from collection'
    })
  } catch (error) {
    console.error('Error removing from collection:', error)
    res.status(500).json({
      success: false,
      message: 'Error removing from collection'
    })
  }
}

// Get collection statistics
export const getCollectionStats = async (req, res) => {
  try {
    const userId = req.user._id

    // Aggregate stats
    const stats = await Collection.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$tcgSystem',
          uniqueCards: { $sum: 1 },
          totalCopies: { $sum: '$quantity' },
          sets: { $addToSet: '$cardSet' }
        }
      }
    ])

    // Calculate playset completion
    const playsetStats = await Collection.aggregate([
      { $match: { userId } },
      {
        $project: {
          tcgSystem: 1,
          hasPlayset: {
            $cond: {
              if: { $eq: ['$tcgSystem', 'pokemon'] },
              then: { $gte: ['$quantity', 4] },
              else: { $gte: ['$quantity', 3] }
            }
          }
        }
      },
      {
        $group: {
          _id: '$tcgSystem',
          completePlaysets: { $sum: { $cond: ['$hasPlayset', 1, 0] } },
          incompletePlaysets: { $sum: { $cond: ['$hasPlayset', 0, 1] } }
        }
      }
    ])

    // Format response
    const formattedStats = {
      pokemon: {
        uniqueCards: 0,
        totalCopies: 0,
        sets: [],
        completePlaysets: 0,
        incompletePlaysets: 0,
        playsetMax: PLAYSET.pokemon
      },
      riftbound: {
        uniqueCards: 0,
        totalCopies: 0,
        sets: [],
        completePlaysets: 0,
        incompletePlaysets: 0,
        playsetMax: PLAYSET.riftbound
      }
    }

    stats.forEach(s => {
      if (formattedStats[s._id]) {
        formattedStats[s._id].uniqueCards = s.uniqueCards
        formattedStats[s._id].totalCopies = s.totalCopies
        formattedStats[s._id].sets = s.sets.filter(Boolean)
      }
    })

    playsetStats.forEach(s => {
      if (formattedStats[s._id]) {
        formattedStats[s._id].completePlaysets = s.completePlaysets
        formattedStats[s._id].incompletePlaysets = s.incompletePlaysets
      }
    })

    res.json({
      success: true,
      data: {
        bySystem: formattedStats,
        total: {
          uniqueCards: formattedStats.pokemon.uniqueCards + formattedStats.riftbound.uniqueCards,
          totalCopies: formattedStats.pokemon.totalCopies + formattedStats.riftbound.totalCopies,
          completePlaysets: formattedStats.pokemon.completePlaysets + formattedStats.riftbound.completePlaysets,
          incompletePlaysets: formattedStats.pokemon.incompletePlaysets + formattedStats.riftbound.incompletePlaysets
        }
      }
    })
  } catch (error) {
    console.error('Error getting collection stats:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting collection stats'
    })
  }
}

// Get available filters for collection
export const getCollectionFilters = async (req, res) => {
  try {
    const userId = req.user._id

    const filters = await Collection.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          tcgSystems: { $addToSet: '$tcgSystem' },
          sets: { $addToSet: '$cardSet' }
        }
      }
    ])

    const result = filters[0] || { tcgSystems: [], sets: [] }

    res.json({
      success: true,
      data: {
        tcgSystems: result.tcgSystems.sort(),
        sets: result.sets.filter(Boolean).sort()
      }
    })
  } catch (error) {
    console.error('Error getting collection filters:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting collection filters'
    })
  }
}

// Batch check ownership for multiple cards (useful for deck building)
export const batchCheckOwnership = async (req, res) => {
  try {
    const userId = req.user._id
    const { cardIds } = req.body

    if (!Array.isArray(cardIds)) {
      return res.status(400).json({
        success: false,
        message: 'cardIds must be an array'
      })
    }

    const items = await Collection.find({
      userId,
      cardId: { $in: cardIds }
    }).lean()

    // Create a map for quick lookup
    const ownershipMap = {}
    items.forEach(item => {
      ownershipMap[item.cardId] = {
        quantity: item.quantity,
        playsetMax: PLAYSET[item.tcgSystem] || 4,
        hasPlayset: item.quantity >= (PLAYSET[item.tcgSystem] || 4)
      }
    })

    // Fill in zeros for cards not in collection
    cardIds.forEach(id => {
      if (!ownershipMap[id]) {
        ownershipMap[id] = {
          quantity: 0,
          playsetMax: 4,
          hasPlayset: false
        }
      }
    })

    res.json({
      success: true,
      data: ownershipMap
    })
  } catch (error) {
    console.error('Error batch checking ownership:', error)
    res.status(500).json({
      success: false,
      message: 'Error checking ownership'
    })
  }
}

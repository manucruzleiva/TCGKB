import Deck from '../models/Deck.js'
import Collection from '../models/Collection.js'
import log from '../utils/logger.js'
import reputationService from '../services/reputation.service.js'

const MODULE = 'DeckController'

/**
 * Parse Pokemon TCG Live deck format
 * Format: "quantity cardId" per line (e.g., "4 sv7-001")
 */
const parseTCGLiveFormat = (deckString) => {
  const lines = deckString.trim().split('\n')
  const cards = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue

    // Match: quantity cardId (e.g., "4 sv7-001" or "2 SVI 001")
    const match = trimmed.match(/^(\d+)\s+(.+)$/)
    if (match) {
      const quantity = parseInt(match[1])
      let cardId = match[2].trim()

      // Normalize card ID format (handle "SET NUM" format)
      cardId = cardId.replace(/\s+/g, '-').toLowerCase()

      if (quantity > 0 && quantity <= 4 && cardId) {
        // Check if card already exists in list
        const existing = cards.find(c => c.cardId === cardId)
        if (existing) {
          existing.quantity = Math.min(existing.quantity + quantity, 4)
        } else {
          cards.push({ cardId, quantity: Math.min(quantity, 4) })
        }
      }
    }
  }

  return cards
}

/**
 * Export deck to Pokemon TCG Live format
 */
const exportToTCGLiveFormat = (deck) => {
  const lines = []

  // Group by supertype
  const pokemon = deck.cards.filter(c => c.supertype?.toLowerCase().includes('pok'))
  const trainers = deck.cards.filter(c => c.supertype?.toLowerCase() === 'trainer')
  const energy = deck.cards.filter(c => c.supertype?.toLowerCase() === 'energy')
  const other = deck.cards.filter(c => !c.supertype)

  if (pokemon.length > 0) {
    lines.push('// Pokemon')
    pokemon.forEach(c => lines.push(`${c.quantity} ${c.cardId}`))
    lines.push('')
  }

  if (trainers.length > 0) {
    lines.push('// Trainers')
    trainers.forEach(c => lines.push(`${c.quantity} ${c.cardId}`))
    lines.push('')
  }

  if (energy.length > 0) {
    lines.push('// Energy')
    energy.forEach(c => lines.push(`${c.quantity} ${c.cardId}`))
    lines.push('')
  }

  if (other.length > 0) {
    lines.push('// Other')
    other.forEach(c => lines.push(`${c.quantity} ${c.cardId}`))
  }

  return lines.join('\n').trim()
}

/**
 * Create a new deck
 */
export const createDeck = async (req, res) => {
  try {
    const { name, description, cards, isPublic, tags, importString } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Deck name is required'
      })
    }

    // Parse cards from import string if provided
    let deckCards = cards || []
    if (importString) {
      deckCards = parseTCGLiveFormat(importString)
    }

    const deck = new Deck({
      name,
      description: description || '',
      cards: deckCards,
      userId: req.user._id,
      isPublic: isPublic || false,
      tags: tags || []
    })

    await deck.save()
    await deck.populate('userId', 'username')

    log.info(MODULE, `Deck "${name}" created by ${req.user.username}`)

    // Award reputation for creating a deck
    try {
      await reputationService.awardPoints({
        userId: req.user._id,
        actionType: 'deck_created',
        sourceType: 'deck',
        sourceId: deck._id,
        description: `Created deck: ${name.substring(0, 50)}`
      })
    } catch (repError) {
      log.error(MODULE, 'Failed to award reputation for deck creation', repError)
    }

    res.status(201).json({
      success: true,
      data: deck,
      message: 'Deck created successfully'
    })
  } catch (error) {
    log.error(MODULE, 'Create deck failed', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create deck'
    })
  }
}

/**
 * Get all public decks or user's decks
 */
export const getDecks = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest', search, tag, tags, userId, mine } = req.query

    const query = {}

    // If requesting own decks
    if (mine === 'true' && req.user) {
      query.userId = req.user._id
    } else if (userId) {
      // Viewing another user's decks - only public ones
      query.userId = userId
      if (!req.user || req.user._id.toString() !== userId) {
        query.isPublic = true
      }
    } else {
      // Public decks only
      query.isPublic = true
    }

    // Filter by tag(s)
    if (tag) {
      query.tags = tag
    } else if (tags) {
      const tagList = tags.split(',')
      query.tags = { $all: tagList }
    }

    if (search) {
      query.$text = { $search: search }
    }

    // Sort options
    let sortOption = { createdAt: -1 }
    if (sort === 'oldest') sortOption = { createdAt: 1 }
    if (sort === 'popular') sortOption = { views: -1 }
    if (sort === 'copies') sortOption = { copies: -1 }
    if (sort === 'name') sortOption = { name: 1 }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [decks, total] = await Promise.all([
      Deck.find(query)
        .populate('userId', 'username')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Deck.countDocuments(query)
    ])

    res.status(200).json({
      success: true,
      data: {
        decks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get decks failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get decks'
    })
  }
}

/**
 * Get a single deck by ID
 */
export const getDeckById = async (req, res) => {
  try {
    const { deckId } = req.params

    const deck = await Deck.findById(deckId)
      .populate('userId', 'username')
      .lean()

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      })
    }

    // Check access
    const isOwner = req.user && req.user._id.toString() === deck.userId._id.toString()
    if (!deck.isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'This deck is private'
      })
    }

    // Increment view count (if not owner)
    if (!isOwner) {
      await Deck.findByIdAndUpdate(deckId, { $inc: { views: 1 } })
      deck.views += 1
    }

    res.status(200).json({
      success: true,
      data: { deck, isOwner }
    })
  } catch (error) {
    log.error(MODULE, 'Get deck failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get deck'
    })
  }
}

/**
 * Update a deck
 */
export const updateDeck = async (req, res) => {
  try {
    const { deckId } = req.params
    const { name, description, cards, isPublic, tags, importString } = req.body

    const deck = await Deck.findById(deckId)

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      })
    }

    // Check ownership
    if (deck.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own decks'
      })
    }

    // Update fields
    if (name) deck.name = name
    if (description !== undefined) deck.description = description
    if (typeof isPublic === 'boolean') deck.isPublic = isPublic
    if (tags !== undefined) deck.tags = tags

    // Handle cards update
    if (importString) {
      deck.cards = parseTCGLiveFormat(importString)
    } else if (cards) {
      deck.cards = cards
    }

    await deck.save()
    await deck.populate('userId', 'username')

    log.info(MODULE, `Deck "${deck.name}" updated by ${req.user.username}`)

    res.status(200).json({
      success: true,
      data: deck,
      message: 'Deck updated successfully'
    })
  } catch (error) {
    log.error(MODULE, 'Update deck failed', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update deck'
    })
  }
}

/**
 * Delete a deck
 */
export const deleteDeck = async (req, res) => {
  try {
    const { deckId } = req.params

    const deck = await Deck.findById(deckId)

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      })
    }

    // Check ownership (or admin)
    const isOwner = deck.userId.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own decks'
      })
    }

    await Deck.findByIdAndDelete(deckId)

    log.info(MODULE, `Deck "${deck.name}" deleted by ${req.user.username}`)

    res.status(200).json({
      success: true,
      message: 'Deck deleted successfully'
    })
  } catch (error) {
    log.error(MODULE, 'Delete deck failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete deck'
    })
  }
}

/**
 * Export deck to TCG Live format
 */
export const exportDeck = async (req, res) => {
  try {
    const { deckId } = req.params

    const deck = await Deck.findById(deckId).lean()

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      })
    }

    // Check access
    const isOwner = req.user && req.user._id.toString() === deck.userId.toString()
    if (!deck.isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'This deck is private'
      })
    }

    const exportString = exportToTCGLiveFormat(deck)

    res.status(200).json({
      success: true,
      data: {
        name: deck.name,
        exportString
      }
    })
  } catch (error) {
    log.error(MODULE, 'Export deck failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to export deck'
    })
  }
}

/**
 * Copy a deck (fork)
 */
export const copyDeck = async (req, res) => {
  try {
    const { deckId } = req.params

    const originalDeck = await Deck.findById(deckId).lean()

    if (!originalDeck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      })
    }

    // Check access
    const isOwner = req.user._id.toString() === originalDeck.userId.toString()
    if (!originalDeck.isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'This deck is private'
      })
    }

    // Create copy
    const newDeck = new Deck({
      name: `${originalDeck.name} (Copy)`,
      description: originalDeck.description,
      cards: originalDeck.cards,
      userId: req.user._id,
      isPublic: false,
      tags: originalDeck.tags
    })

    await newDeck.save()
    await newDeck.populate('userId', 'username')

    // Increment copy count on original
    await Deck.findByIdAndUpdate(deckId, { $inc: { copies: 1 } })

    log.info(MODULE, `Deck "${originalDeck.name}" copied by ${req.user.username}`)

    res.status(201).json({
      success: true,
      data: newDeck,
      message: 'Deck copied successfully'
    })
  } catch (error) {
    log.error(MODULE, 'Copy deck failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to copy deck'
    })
  }
}

/**
 * Update card info in deck (for caching card names/images)
 */
export const updateDeckCardInfo = async (req, res) => {
  try {
    const { deckId } = req.params
    const { cardInfo } = req.body // Array of { cardId, name, supertype, imageSmall }

    const deck = await Deck.findById(deckId)

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      })
    }

    // Check ownership
    if (deck.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own decks'
      })
    }

    // Update card info
    cardInfo.forEach(info => {
      const card = deck.cards.find(c => c.cardId === info.cardId)
      if (card) {
        card.name = info.name
        card.supertype = info.supertype
        card.imageSmall = info.imageSmall
      }
    })

    await deck.save()

    res.status(200).json({
      success: true,
      data: deck,
      message: 'Card info updated'
    })
  } catch (error) {
    log.error(MODULE, 'Update card info failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update card info'
    })
  }
}

/**
 * Get available deck tags (predefined categories)
 */
export const getAvailableTags = async (req, res) => {
  try {
    const tags = Deck.getAvailableTags()

    res.status(200).json({
      success: true,
      data: tags
    })
  } catch (error) {
    log.error(MODULE, 'Get available tags failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get available tags'
    })
  }
}

/**
 * Get deck suggestions based on user's collection
 * Shows decks the user can build or almost build
 */
export const getSuggestedDecks = async (req, res) => {
  try {
    const { page = 1, limit = 20, minCompletion = 0, tag } = req.query

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    // Get user's collection
    const userCollection = await Collection.find({ userId: req.user._id })
    const ownedCards = new Map()
    userCollection.forEach(c => {
      ownedCards.set(c.cardId, c.quantity)
    })

    // Query for public decks
    const deckQuery = { isPublic: true }
    if (tag) {
      deckQuery.tags = tag
    }

    // Get popular public decks
    const decks = await Deck.find(deckQuery)
      .populate('userId', 'username')
      .sort({ copies: -1, views: -1 })
      .limit(100) // Get top 100 popular decks
      .lean()

    // Calculate completion for each deck
    const deckSuggestions = decks.map(deck => {
      let ownedCount = 0
      let totalCount = 0
      const missingCards = []
      const partialCards = []

      deck.cards.forEach(card => {
        totalCount += card.quantity
        const owned = ownedCards.get(card.cardId) || 0

        if (owned >= card.quantity) {
          ownedCount += card.quantity
        } else if (owned > 0) {
          ownedCount += owned
          partialCards.push({
            cardId: card.cardId,
            name: card.name,
            imageSmall: card.imageSmall,
            needed: card.quantity,
            owned: owned,
            missing: card.quantity - owned
          })
        } else {
          missingCards.push({
            cardId: card.cardId,
            name: card.name,
            imageSmall: card.imageSmall,
            needed: card.quantity,
            owned: 0,
            missing: card.quantity
          })
        }
      })

      const completionPercent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0

      return {
        deck: {
          _id: deck._id,
          name: deck.name,
          description: deck.description,
          tags: deck.tags,
          totalCards: deck.cards.reduce((sum, c) => sum + c.quantity, 0),
          breakdown: deck.breakdown,
          views: deck.views,
          copies: deck.copies,
          userId: deck.userId,
          createdAt: deck.createdAt
        },
        completion: {
          percent: completionPercent,
          owned: ownedCount,
          total: totalCount
        },
        missingCards: missingCards.slice(0, 10), // Top 10 missing
        partialCards: partialCards.slice(0, 5),  // Top 5 partial
        totalMissing: missingCards.length + partialCards.length
      }
    })

    // Filter by minimum completion
    const filtered = deckSuggestions.filter(s => s.completion.percent >= parseInt(minCompletion))

    // Sort by completion percentage (highest first)
    filtered.sort((a, b) => b.completion.percent - a.completion.percent)

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const paginated = filtered.slice(skip, skip + parseInt(limit))

    res.status(200).json({
      success: true,
      data: {
        suggestions: paginated,
        stats: {
          canBuildNow: filtered.filter(s => s.completion.percent === 100).length,
          almostComplete: filtered.filter(s => s.completion.percent >= 80 && s.completion.percent < 100).length,
          inProgress: filtered.filter(s => s.completion.percent >= 50 && s.completion.percent < 80).length
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filtered.length,
          pages: Math.ceil(filtered.length / parseInt(limit))
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get suggested decks failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get deck suggestions'
    })
  }
}

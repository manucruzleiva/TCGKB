import ArtistFan from '../models/ArtistFan.js'
import CardCache from '../models/CardCache.js'
import log from '../utils/logger.js'

const MODULE = 'ArtistsController'

/**
 * Toggle fan status for an artist
 */
export const toggleFan = async (req, res) => {
  try {
    const { artistName } = req.body
    const userId = req.user._id

    if (!artistName || !artistName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Artist name is required'
      })
    }

    const normalizedName = artistName.trim()

    // Check if already a fan
    const existingFan = await ArtistFan.findOne({
      artistName: normalizedName,
      userId
    })

    if (existingFan) {
      // Remove fan status
      await ArtistFan.deleteOne({ _id: existingFan._id })
      const newCount = await ArtistFan.getFanCount(normalizedName)

      log.info(MODULE, `User ${req.user.username} unfollowed artist ${normalizedName}`)

      return res.status(200).json({
        success: true,
        data: {
          isFan: false,
          fanCount: newCount
        },
        message: 'Unfollowed artist'
      })
    } else {
      // Add fan status
      await ArtistFan.create({
        artistName: normalizedName,
        userId
      })
      const newCount = await ArtistFan.getFanCount(normalizedName)

      log.info(MODULE, `User ${req.user.username} followed artist ${normalizedName}`)

      return res.status(200).json({
        success: true,
        data: {
          isFan: true,
          fanCount: newCount
        },
        message: 'Now following artist'
      })
    }
  } catch (error) {
    log.error(MODULE, 'Toggle fan failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update fan status'
    })
  }
}

/**
 * Get artist info (fan count and user's fan status)
 */
export const getArtistInfo = async (req, res) => {
  try {
    const { artistName } = req.params
    const userId = req.user?._id

    if (!artistName) {
      return res.status(400).json({
        success: false,
        message: 'Artist name is required'
      })
    }

    const decodedName = decodeURIComponent(artistName)
    const fanCount = await ArtistFan.getFanCount(decodedName)
    const isFan = userId ? await ArtistFan.isFan(decodedName, userId) : false

    res.status(200).json({
      success: true,
      data: {
        artistName: decodedName,
        fanCount,
        isFan
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get artist info failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get artist info'
    })
  }
}

/**
 * Get top artists by fan count
 */
export const getTopArtists = async (req, res) => {
  try {
    const { limit = 20 } = req.query
    const topArtists = await ArtistFan.getTopArtists(parseInt(limit))

    res.status(200).json({
      success: true,
      data: {
        artists: topArtists
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get top artists failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get top artists'
    })
  }
}

/**
 * Get user's followed artists
 */
export const getUserFavoriteArtists = async (req, res) => {
  try {
    const userId = req.user._id

    const follows = await ArtistFan.find({ userId })
      .sort({ createdAt: -1 })
      .lean()

    // Get fan counts for each artist
    const artistsWithCounts = await Promise.all(
      follows.map(async (follow) => ({
        artistName: follow.artistName,
        fanCount: await ArtistFan.getFanCount(follow.artistName),
        followedAt: follow.createdAt
      }))
    )

    res.status(200).json({
      success: true,
      data: {
        artists: artistsWithCounts
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get user favorite artists failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get favorite artists'
    })
  }
}

/**
 * Batch check fan status for multiple artists
 */
export const batchCheckFanStatus = async (req, res) => {
  try {
    const { artistNames } = req.body
    const userId = req.user._id

    if (!Array.isArray(artistNames) || artistNames.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Artist names array is required'
      })
    }

    // Get all fan records for user
    const fanRecords = await ArtistFan.find({
      artistName: { $in: artistNames },
      userId
    }).lean()

    // Get fan counts for all artists
    const fanCounts = await ArtistFan.aggregate([
      { $match: { artistName: { $in: artistNames } } },
      { $group: { _id: '$artistName', count: { $sum: 1 } } }
    ])

    // Build response map
    const result = {}
    const fanSet = new Set(fanRecords.map(r => r.artistName))
    const countMap = fanCounts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    artistNames.forEach(name => {
      result[name] = {
        isFan: fanSet.has(name),
        fanCount: countMap[name] || 0
      }
    })

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    log.error(MODULE, 'Batch check fan status failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check fan status'
    })
  }
}

/**
 * Get all cards by an artist
 */
export const getCardsByArtist = async (req, res) => {
  try {
    const { artistName } = req.params
    const { page = 1, limit = 24, tcgSystem } = req.query

    if (!artistName) {
      return res.status(400).json({
        success: false,
        message: 'Artist name is required'
      })
    }

    const decodedName = decodeURIComponent(artistName)
    const pageNum = parseInt(page) || 1
    const limitNum = Math.min(parseInt(limit) || 24, 60)
    const skip = (pageNum - 1) * limitNum

    // Build query
    const query = {
      'data.artist': { $regex: new RegExp(`^${decodedName}$`, 'i') }
    }

    if (tcgSystem && ['pokemon', 'riftbound'].includes(tcgSystem)) {
      query.tcgSystem = tcgSystem
    }

    // Get total count
    const total = await CardCache.countDocuments(query)

    // Get cards
    const cards = await CardCache.find(query)
      .sort({ 'data.releaseDate': -1, cardId: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    // Format cards for response
    const formattedCards = cards.map(card => ({
      id: card.cardId,
      name: card.data.name || card.data.cardName || 'Unknown',
      imageUrl: card.data.images?.small || card.data.images?.large || card.data.imageUrl,
      set: card.data.set?.name || card.data.setName || 'Unknown Set',
      rarity: card.data.rarity || 'Unknown',
      tcgSystem: card.tcgSystem,
      artist: card.data.artist
    }))

    // Get fan count for this artist
    const fanCount = await ArtistFan.getFanCount(decodedName)
    const userId = req.user?._id
    const isFan = userId ? await ArtistFan.isFan(decodedName, userId) : false

    res.status(200).json({
      success: true,
      data: {
        artist: {
          name: decodedName,
          fanCount,
          isFan,
          cardCount: total
        },
        cards: formattedCards,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get cards by artist failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get cards by artist'
    })
  }
}

/**
 * Get all unique artists with card counts
 */
export const getAllArtists = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, sortBy = 'fanCount' } = req.query
    const pageNum = parseInt(page) || 1
    const limitNum = Math.min(parseInt(limit) || 50, 100)
    const skip = (pageNum - 1) * limitNum

    // Get all unique artists with card counts
    const artistAggregation = await CardCache.aggregate([
      { $match: { 'data.artist': { $exists: true, $ne: null, $ne: '' } } },
      { $group: {
        _id: '$data.artist',
        cardCount: { $sum: 1 },
        tcgSystems: { $addToSet: '$tcgSystem' }
      }},
      ...(search ? [{ $match: { _id: { $regex: new RegExp(search, 'i') } } }] : []),
      { $project: {
        artistName: '$_id',
        cardCount: 1,
        tcgSystems: 1,
        _id: 0
      }}
    ])

    // Get fan counts for all artists
    const fanCounts = await ArtistFan.aggregate([
      { $group: { _id: '$artistName', fanCount: { $sum: 1 } } }
    ])
    const fanCountMap = fanCounts.reduce((acc, item) => {
      acc[item._id] = item.fanCount
      return acc
    }, {})

    // Merge and sort
    let artists = artistAggregation.map(artist => ({
      ...artist,
      fanCount: fanCountMap[artist.artistName] || 0
    }))

    // Sort
    if (sortBy === 'fanCount') {
      artists.sort((a, b) => b.fanCount - a.fanCount || b.cardCount - a.cardCount)
    } else if (sortBy === 'cardCount') {
      artists.sort((a, b) => b.cardCount - a.cardCount)
    } else if (sortBy === 'name') {
      artists.sort((a, b) => a.artistName.localeCompare(b.artistName))
    }

    const total = artists.length
    const paginatedArtists = artists.slice(skip, skip + limitNum)

    res.status(200).json({
      success: true,
      data: {
        artists: paginatedArtists,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get all artists failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get artists'
    })
  }
}

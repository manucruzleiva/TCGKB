import ArtistFan from '../models/ArtistFan.js'
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

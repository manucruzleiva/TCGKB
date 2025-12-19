import ReputationConfig from '../models/ReputationConfig.js'
import ReputationLedger from '../models/ReputationLedger.js'
import ConfigChangeHistory from '../models/ConfigChangeHistory.js'
import reputationService from '../services/reputation.service.js'
import log from '../utils/logger.js'

const MODULE = 'ReputationController'

/**
 * Get current user's reputation
 */
export const getMyReputation = async (req, res) => {
  try {
    const reputation = await reputationService.getUserReputation(req.user._id)

    if (!reputation) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: reputation
    })
  } catch (error) {
    log.error(MODULE, 'Get my reputation failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get reputation'
    })
  }
}

/**
 * Get a user's reputation by ID or username
 */
export const getUserReputation = async (req, res) => {
  try {
    const { userId } = req.params

    const reputation = await reputationService.getUserReputation(userId)

    if (!reputation) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: reputation
    })
  } catch (error) {
    log.error(MODULE, 'Get user reputation failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get reputation'
    })
  }
}

/**
 * Get reputation leaderboard
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query

    const leaderboard = await reputationService.getLeaderboard(
      parseInt(limit),
      parseInt(offset)
    )

    res.status(200).json({
      success: true,
      data: leaderboard
    })
  } catch (error) {
    log.error(MODULE, 'Get leaderboard failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    })
  }
}

/**
 * Get reputation config (admin only)
 */
export const getConfig = async (req, res) => {
  try {
    const config = await ReputationConfig.getConfig()

    res.status(200).json({
      success: true,
      data: {
        weights: config.weights,
        decay: config.decay,
        lastModifiedBy: config.lastModifiedBy,
        updatedAt: config.updatedAt
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get config failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get config'
    })
  }
}

/**
 * Update reputation config (admin only)
 */
export const updateConfig = async (req, res) => {
  try {
    const { weights, decay } = req.body

    // Get current config for history tracking
    const previousConfig = await ReputationConfig.getConfig()
    const previousValues = {
      weights: { ...previousConfig.weights.toObject() },
      decay: { ...previousConfig.decay.toObject() }
    }

    const updates = {}
    if (weights) updates.weights = weights
    if (decay) updates.decay = decay

    const config = await ReputationConfig.updateConfig(updates, req.user._id)

    // Build summary of changes
    const changedFields = []
    if (weights) {
      Object.keys(weights).forEach(key => {
        if (previousValues.weights[key] !== weights[key]) {
          changedFields.push(`${key}: ${previousValues.weights[key]} → ${weights[key]}`)
        }
      })
    }
    if (decay) {
      Object.keys(decay).forEach(key => {
        if (previousValues.decay[key] !== decay[key]) {
          changedFields.push(`${key} decay: ${previousValues.decay[key]}d → ${decay[key]}d`)
        }
      })
    }

    // Log change to history
    const changeType = weights && decay ? 'weights_updated' : (weights ? 'weights_updated' : 'decay_updated')
    await ConfigChangeHistory.logChange({
      changedBy: req.user._id,
      changeType,
      previousValues,
      newValues: { weights: config.weights, decay: config.decay },
      summary: changedFields.length > 0 ? changedFields.join(', ') : 'No changes detected'
    })

    log.info(MODULE, `Reputation config updated by ${req.user.username}: ${changedFields.join(', ')}`)

    res.status(200).json({
      success: true,
      data: {
        weights: config.weights,
        decay: config.decay,
        lastModifiedBy: config.lastModifiedBy,
        updatedAt: config.updatedAt
      },
      message: 'Config updated successfully'
    })
  } catch (error) {
    log.error(MODULE, 'Update config failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update config'
    })
  }
}

/**
 * Get tier thresholds
 */
export const getTierThresholds = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: reputationService.TIER_THRESHOLDS
    })
  } catch (error) {
    log.error(MODULE, 'Get tier thresholds failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get tier thresholds'
    })
  }
}

/**
 * Get user's ledger history (for inspection by mods)
 */
export const getUserLedger = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 50 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [entries, total] = await Promise.all([
      ReputationLedger.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('triggeredBy', 'username')
        .lean(),
      ReputationLedger.countDocuments({ userId })
    ])

    res.status(200).json({
      success: true,
      data: {
        entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    log.error(MODULE, 'Get user ledger failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get ledger'
    })
  }
}

/**
 * Admin adjustment of points
 */
export const adminAdjustPoints = async (req, res) => {
  try {
    const { userId, points, description } = req.body

    if (!userId || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'userId and points are required'
      })
    }

    // Create a manual adjustment entry
    const entry = await ReputationLedger.create({
      userId,
      actionType: 'admin_adjustment',
      points: parseInt(points),
      sourceType: 'admin',
      triggeredBy: req.user._id,
      description: description || `Manual adjustment by ${req.user.username}`,
      expiresAt: null // Admin adjustments don't expire
    })

    // Update user's cached reputation
    await reputationService.updateUserReputation(userId)

    log.info(MODULE, `Admin adjustment: ${points} points to user ${userId} by ${req.user.username}`)

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Points adjusted successfully'
    })
  } catch (error) {
    log.error(MODULE, 'Admin adjust points failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to adjust points'
    })
  }
}

/**
 * Recalculate all reputations (admin only)
 */
export const recalculateAll = async (req, res) => {
  try {
    const startTime = Date.now()

    const result = await reputationService.recalculateAllReputations()

    const executionTimeMs = Date.now() - startTime

    // Log recalculation to history
    await ConfigChangeHistory.logChange({
      changedBy: req.user._id,
      changeType: 'full_recalculation',
      summary: `Recalculated ${result.updated} users in ${executionTimeMs}ms`,
      recalculationStats: {
        usersAffected: result.updated,
        executionTimeMs
      }
    })

    log.info(MODULE, `All reputations recalculated by ${req.user.username}: ${result.updated} users in ${executionTimeMs}ms`)

    res.status(200).json({
      success: true,
      data: {
        ...result,
        executionTimeMs
      },
      message: `Recalculated reputation for ${result.updated} users`
    })
  } catch (error) {
    log.error(MODULE, 'Recalculate all failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to recalculate reputations'
    })
  }
}

/**
 * Process expired points (called by cron or manually)
 */
export const processExpired = async (req, res) => {
  try {
    const result = await reputationService.processExpiredPoints()

    log.info(MODULE, `Expired points processed: ${result.processed} entries, ${result.usersAffected} users`)

    res.status(200).json({
      success: true,
      data: result,
      message: `Processed ${result.processed} expired entries`
    })
  } catch (error) {
    log.error(MODULE, 'Process expired failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process expired points'
    })
  }
}

/**
 * Get config change history (admin only)
 */
export const getConfigHistory = async (req, res) => {
  try {
    const { limit = 20 } = req.query

    const history = await ConfigChangeHistory.getRecentHistory(parseInt(limit))

    res.status(200).json({
      success: true,
      data: history
    })
  } catch (error) {
    log.error(MODULE, 'Get config history failed', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get config history'
    })
  }
}

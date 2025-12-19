import ReputationLedger from '../models/ReputationLedger.js'
import ReputationConfig from '../models/ReputationConfig.js'
import User from '../models/User.js'
import log from '../utils/logger.js'

const MODULE = 'ReputationService'

// Tier thresholds
const TIER_THRESHOLDS = {
  newcomer: 0,
  contributor: 50,
  trusted: 200,
  expert: 500,
  legend: 1000
}

/**
 * Calculate tier based on points
 */
function calculateTier(points) {
  if (points >= TIER_THRESHOLDS.legend) return 'legend'
  if (points >= TIER_THRESHOLDS.expert) return 'expert'
  if (points >= TIER_THRESHOLDS.trusted) return 'trusted'
  if (points >= TIER_THRESHOLDS.contributor) return 'contributor'
  return 'newcomer'
}

/**
 * Award points to a user for an action
 */
export async function awardPoints({
  userId,
  actionType,
  sourceType,
  sourceId = null,
  triggeredBy = null,
  description = ''
}) {
  try {
    // Get config for point weight and decay
    const config = await ReputationConfig.getConfig()
    const points = config.getWeight(actionType)

    // If no points configured for this action, skip
    if (points === 0) {
      log.debug(MODULE, `Skipping ${actionType} for user ${userId} - zero points configured`)
      return null
    }

    // Calculate expiration date
    const expiresAt = config.getExpirationDate(actionType)

    // Create ledger entry
    const entry = await ReputationLedger.create({
      userId,
      actionType,
      points,
      sourceType,
      sourceId,
      triggeredBy,
      description,
      expiresAt
    })

    log.info(MODULE, `Awarded ${points} points to user ${userId} for ${actionType}`)

    // Update user's cached reputation
    await updateUserReputation(userId)

    return entry
  } catch (error) {
    log.error(MODULE, `Failed to award points: ${error.message}`, error)
    throw error
  }
}

/**
 * Penalize points from a user
 */
export async function penalizePoints({
  userId,
  actionType,
  sourceType,
  sourceId = null,
  triggeredBy = null,
  description = ''
}) {
  // Penalties use the same awardPoints function since weights can be negative
  return awardPoints({
    userId,
    actionType,
    sourceType,
    sourceId,
    triggeredBy,
    description
  })
}

/**
 * Reverse a previous ledger entry (e.g., for comment_restored)
 */
export async function reverseEntry(originalEntryId, reversalActionType, description = '') {
  try {
    const originalEntry = await ReputationLedger.findById(originalEntryId)

    if (!originalEntry) {
      log.warn(MODULE, `Cannot reverse entry ${originalEntryId} - not found`)
      return null
    }

    if (originalEntry.isReversed) {
      log.warn(MODULE, `Entry ${originalEntryId} already reversed`)
      return null
    }

    // Get config for reversal points
    const config = await ReputationConfig.getConfig()
    const reversalPoints = config.getWeight(reversalActionType)

    // Create reversal entry
    const reversalEntry = await ReputationLedger.create({
      userId: originalEntry.userId,
      actionType: reversalActionType,
      points: reversalPoints,
      sourceType: originalEntry.sourceType,
      sourceId: originalEntry.sourceId,
      description: description || `Reversal of ${originalEntry.actionType}`,
      reversesEntryId: originalEntryId,
      expiresAt: null // Reversals don't expire
    })

    // Mark original entry as reversed
    originalEntry.isReversed = true
    await originalEntry.save()

    log.info(MODULE, `Reversed entry ${originalEntryId} with ${reversalPoints} points`)

    // Update user's cached reputation
    await updateUserReputation(originalEntry.userId)

    return reversalEntry
  } catch (error) {
    log.error(MODULE, `Failed to reverse entry: ${error.message}`, error)
    throw error
  }
}

/**
 * Update user's cached reputation from ledger
 */
export async function updateUserReputation(userId) {
  try {
    const totalPoints = await ReputationLedger.getUserReputation(userId)
    const tier = calculateTier(totalPoints)

    await User.findByIdAndUpdate(userId, {
      'reputation.totalPoints': totalPoints,
      'reputation.tier': tier,
      'reputation.lastCalculated': new Date()
    })

    log.debug(MODULE, `Updated user ${userId} reputation: ${totalPoints} points, tier: ${tier}`)

    return { totalPoints, tier }
  } catch (error) {
    log.error(MODULE, `Failed to update user reputation: ${error.message}`, error)
    throw error
  }
}

/**
 * Get user's reputation details
 */
export async function getUserReputation(userId) {
  try {
    const user = await User.findById(userId).select('reputation username')

    if (!user) {
      return null
    }

    // Get breakdown by action type
    const breakdown = await ReputationLedger.getUserReputationBreakdown(userId)

    // Get recent activity
    const recentActivity = await ReputationLedger.find({
      userId,
      isExpired: false,
      isReversed: false
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    return {
      totalPoints: user.reputation?.totalPoints || 0,
      tier: user.reputation?.tier || 'newcomer',
      lastCalculated: user.reputation?.lastCalculated,
      breakdown,
      recentActivity
    }
  } catch (error) {
    log.error(MODULE, `Failed to get user reputation: ${error.message}`, error)
    throw error
  }
}

/**
 * Get leaderboard of users by reputation
 */
export async function getLeaderboard(limit = 10, offset = 0) {
  try {
    const users = await User.find({
      'reputation.totalPoints': { $gt: 0 }
    })
      .select('username avatar avatarBackground reputation')
      .sort({ 'reputation.totalPoints': -1 })
      .skip(offset)
      .limit(limit)
      .lean()

    const total = await User.countDocuments({
      'reputation.totalPoints': { $gt: 0 }
    })

    return {
      users,
      total,
      limit,
      offset
    }
  } catch (error) {
    log.error(MODULE, `Failed to get leaderboard: ${error.message}`, error)
    throw error
  }
}

/**
 * Process expired points (wither system)
 * Should be called by a cron job
 */
export async function processExpiredPoints() {
  try {
    const now = new Date()

    // Find all entries that should expire
    const expiredEntries = await ReputationLedger.find({
      expiresAt: { $lte: now },
      isExpired: false,
      isReversed: false
    })

    if (expiredEntries.length === 0) {
      log.debug(MODULE, 'No expired points to process')
      return { processed: 0 }
    }

    // Get unique user IDs affected
    const affectedUserIds = [...new Set(expiredEntries.map(e => e.userId.toString()))]

    // Mark entries as expired
    await ReputationLedger.updateMany(
      {
        expiresAt: { $lte: now },
        isExpired: false,
        isReversed: false
      },
      { $set: { isExpired: true } }
    )

    log.info(MODULE, `Marked ${expiredEntries.length} entries as expired`)

    // Update affected users' reputations
    for (const userId of affectedUserIds) {
      await updateUserReputation(userId)
    }

    log.info(MODULE, `Updated reputation for ${affectedUserIds.length} users after expiration`)

    return {
      processed: expiredEntries.length,
      usersAffected: affectedUserIds.length
    }
  } catch (error) {
    log.error(MODULE, `Failed to process expired points: ${error.message}`, error)
    throw error
  }
}

/**
 * Recalculate all user reputations (admin function)
 * Used when config weights change
 */
export async function recalculateAllReputations() {
  try {
    // Get all users with any ledger entries
    const usersWithEntries = await ReputationLedger.distinct('userId')

    log.info(MODULE, `Recalculating reputation for ${usersWithEntries.length} users`)

    let updated = 0
    for (const userId of usersWithEntries) {
      await updateUserReputation(userId)
      updated++
    }

    log.info(MODULE, `Recalculated reputation for ${updated} users`)

    return { updated }
  } catch (error) {
    log.error(MODULE, `Failed to recalculate reputations: ${error.message}`, error)
    throw error
  }
}

export default {
  awardPoints,
  penalizePoints,
  reverseEntry,
  updateUserReputation,
  getUserReputation,
  getLeaderboard,
  processExpiredPoints,
  recalculateAllReputations,
  TIER_THRESHOLDS
}

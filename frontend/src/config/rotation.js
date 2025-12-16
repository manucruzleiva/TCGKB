/**
 * Pokemon TCG Rotation Configuration
 * Maintains legal regulation marks and rotation schedule
 */

export const ROTATION_CONFIG = {
  // Current legal regulation marks (in order from oldest to newest)
  legalMarks: ['G', 'H', 'I', 'J', 'K'],

  // Rotation history and future schedule
  rotations: [
    {
      date: '2024-03-22',
      removedMarks: ['E', 'F'],
      addedMarks: ['J'],
      name: 'Scarlet & Violet Rotation 2024'
    },
    {
      date: '2025-03-21', // Estimated
      removedMarks: ['G'],
      addedMarks: ['K', 'L'],
      name: 'Scarlet & Violet Rotation 2025'
    },
    {
      date: '2026-03-20', // Estimated
      removedMarks: ['H'],
      addedMarks: ['M'],
      name: 'Scarlet & Violet Rotation 2026'
    }
  ]
}

/**
 * Check if a regulation mark is currently legal
 * @param {string} regulationMark - The regulation mark to check
 * @returns {boolean} True if the mark is legal
 */
export function isLegalMark(regulationMark) {
  if (!regulationMark) return false
  return ROTATION_CONFIG.legalMarks.includes(regulationMark.toUpperCase())
}

/**
 * Get the next rotation date
 * @returns {Date|null} Next rotation date or null if none scheduled
 */
export function getNextRotationDate() {
  const now = new Date()
  const futureRotations = ROTATION_CONFIG.rotations.filter(
    rotation => new Date(rotation.date) > now
  )

  if (futureRotations.length === 0) return null

  // Return the earliest future rotation
  return new Date(futureRotations[0].date)
}

/**
 * Get rotation info for a specific mark
 * @param {string} regulationMark - The regulation mark
 * @returns {Object|null} Rotation info or null
 */
export function getRotationInfo(regulationMark) {
  if (!regulationMark) return null

  const mark = regulationMark.toUpperCase()
  const isLegal = isLegalMark(mark)

  // If not legal, find when it was rotated out
  if (!isLegal) {
    const rotation = ROTATION_CONFIG.rotations.find(
      r => r.removedMarks.includes(mark)
    )
    return {
      isLegal: false,
      status: 'rotated',
      rotationDate: rotation ? new Date(rotation.date) : null,
      rotationName: rotation?.name || 'Past Rotation'
    }
  }

  // If legal, check if it's the oldest mark (next to rotate)
  const oldestLegalMark = ROTATION_CONFIG.legalMarks[0]
  if (mark === oldestLegalMark) {
    const nextRotation = getNextRotationDate()
    const willRotate = ROTATION_CONFIG.rotations.find(
      r => new Date(r.date) > new Date() && r.removedMarks.includes(mark)
    )

    if (willRotate) {
      return {
        isLegal: true,
        status: 'rotating-soon',
        rotationDate: new Date(willRotate.date),
        rotationName: willRotate.name,
        daysUntilRotation: Math.ceil(
          (new Date(willRotate.date) - new Date()) / (1000 * 60 * 60 * 24)
        )
      }
    }
  }

  return {
    isLegal: true,
    status: 'legal',
    rotationDate: null,
    rotationName: null
  }
}

/**
 * Format days until rotation as a human-readable string
 * @param {number} days - Number of days
 * @returns {string} Formatted string
 */
export function formatDaysUntilRotation(days) {
  if (days < 0) return 'Rotated'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`

  const months = Math.floor(days / 30)
  if (months === 1) return '1 month'
  if (months < 12) return `${months} months`

  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''}`
}

export default ROTATION_CONFIG

import DOMPurify from 'isomorphic-dompurify'
import log from './logger.js'

/**
 * Validation utilities for V3 Collection and Deck features
 * @module validation
 */

/**
 * Validate if a cardId exists in the CardCache
 * @param {string} cardId - The card ID to validate (e.g., "sv1-25", "ssp-97")
 * @param {import('mongoose').Model} CardCache - CardCache model
 * @returns {Promise<{valid: boolean, error?: string, card?: object}>}
 */
export const validateCardId = async (cardId, CardCache) => {
  // Basic format validation
  if (!cardId || typeof cardId !== 'string') {
    return { valid: false, error: 'Card ID must be a non-empty string' }
  }

  const trimmedId = cardId.trim()

  // Format: alphanumeric with hyphens (e.g., "sv1-25", "obb-123", "ssp-97")
  const formatRegex = /^[a-z0-9]+-[0-9]+$/i
  if (!formatRegex.test(trimmedId)) {
    return { valid: false, error: 'Invalid card ID format. Expected format: "set-number" (e.g., "sv1-25")' }
  }

  // Check if card exists in CardCache
  try {
    const card = await CardCache.findOne({ id: trimmedId })

    if (!card) {
      return { valid: false, error: `Card "${trimmedId}" not found in database` }
    }

    return { valid: true, card }
  } catch (error) {
    log.error('validation', 'Error validating cardId', error)
    return { valid: false, error: 'Database error during validation' }
  }
}

/**
 * Sanitize HTML input to prevent XSS attacks
 * Uses DOMPurify to strip all HTML tags, leaving only plain text
 * @param {string} input - The input string to sanitize
 * @param {object} options - Sanitization options
 * @param {number} options.maxLength - Maximum allowed length (default: 1000)
 * @returns {string} - Sanitized plain text
 */
export const sanitizeHtml = (input, options = {}) => {
  const { maxLength = 1000 } = options

  if (!input || typeof input !== 'string') {
    return ''
  }

  // First pass: Strip all HTML tags using DOMPurify
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep text content
  })

  // Second pass: Trim and limit length
  const trimmed = sanitized.trim().slice(0, maxLength)

  return trimmed
}

/**
 * Validate and clamp quantity to safe range
 * @param {number|string} quantity - The quantity to validate
 * @param {object} options - Validation options
 * @param {number} options.min - Minimum allowed value (default: 0)
 * @param {number} options.max - Maximum allowed value (default: 1000)
 * @returns {{valid: boolean, value?: number, error?: string}}
 */
export const validateQuantity = (quantity, options = {}) => {
  const { min = 0, max = 1000 } = options

  // Type check and conversion
  const num = Number(quantity)

  if (isNaN(num)) {
    return { valid: false, error: 'Quantity must be a number' }
  }

  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Quantity must be an integer' }
  }

  if (num < min) {
    return { valid: false, error: `Quantity must be at least ${min}` }
  }

  if (num > max) {
    return { valid: false, error: `Quantity cannot exceed ${max}` }
  }

  return { valid: true, value: num }
}

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - The ID to validate
 * @returns {{valid: boolean, error?: string}}
 */
export const validateObjectId = (id) => {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID must be a non-empty string' }
  }

  // MongoDB ObjectId is 24 hex characters
  const objectIdRegex = /^[0-9a-fA-F]{24}$/

  if (!objectIdRegex.test(id)) {
    return { valid: false, error: 'Invalid ID format' }
  }

  return { valid: true }
}

/**
 * Validate TCG system
 * @param {string} tcgSystem - The TCG system to validate
 * @returns {{valid: boolean, error?: string}}
 */
export const validateTcgSystem = (tcgSystem) => {
  const validSystems = ['pokemon', 'riftbound']

  if (!tcgSystem || typeof tcgSystem !== 'string') {
    return { valid: false, error: 'TCG system must be specified' }
  }

  const normalized = tcgSystem.toLowerCase().trim()

  if (!validSystems.includes(normalized)) {
    return { valid: false, error: `TCG system must be one of: ${validSystems.join(', ')}` }
  }

  return { valid: true, value: normalized }
}

/**
 * Validate deck status
 * @param {string} status - The status to validate
 * @returns {{valid: boolean, error?: string}}
 */
export const validateDeckStatus = (status) => {
  const validStatuses = ['draft', 'built']

  if (!status || typeof status !== 'string') {
    return { valid: false, error: 'Status must be specified' }
  }

  const normalized = status.toLowerCase().trim()

  if (!validStatuses.includes(normalized)) {
    return { valid: false, error: `Status must be one of: ${validStatuses.join(', ')}` }
  }

  return { valid: true, value: normalized }
}

export default {
  validateCardId,
  sanitizeHtml,
  validateQuantity,
  validateObjectId,
  validateTcgSystem,
  validateDeckStatus
}

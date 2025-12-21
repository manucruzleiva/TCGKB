/**
 * MongoDB URI Builder Utility
 *
 * Supports two connection modes:
 * 1. NEW (Service User): DB_ENDPOINT + DB_CLIENT_ID + DB_CLIENT_SECRET
 * 2. LEGACY: MONGODB_URI (full connection string)
 *
 * The new system separates credentials from the endpoint for better security.
 */

/**
 * Build MongoDB connection URI from environment variables
 *
 * Priority:
 * 1. If DB_ENDPOINT + DB_CLIENT_ID + DB_CLIENT_SECRET are set, construct URI
 * 2. Fall back to MONGODB_URI for backward compatibility
 *
 * @returns {string} Complete MongoDB connection string
 * @throws {Error} If no valid configuration is found
 */
export function buildMongoUri() {
  const endpoint = process.env.DB_ENDPOINT
  const clientId = process.env.DB_CLIENT_ID
  const clientSecret = process.env.DB_CLIENT_SECRET
  const legacyUri = process.env.MONGODB_URI

  // New system: construct URI from separate components
  if (endpoint && clientId && clientSecret) {
    // Extract host from endpoint (remove mongodb+srv:// prefix if present)
    const host = endpoint.replace(/^mongodb\+srv:\/\//, '').replace(/\/$/, '')

    // Encode credentials to handle special characters
    const encodedId = encodeURIComponent(clientId)
    const encodedSecret = encodeURIComponent(clientSecret)

    // Build complete URI with default database and options
    const uri = `mongodb+srv://${encodedId}:${encodedSecret}@${host}/tcgkb?retryWrites=true&w=majority`

    return uri
  }

  // Legacy fallback: use MONGODB_URI directly
  if (legacyUri) {
    return legacyUri.trim()
  }

  // No valid configuration
  throw new Error(
    'Database connection not configured. ' +
    'Set DB_ENDPOINT, DB_CLIENT_ID, DB_CLIENT_SECRET (recommended) ' +
    'or MONGODB_URI (legacy).'
  )
}

/**
 * Get MongoDB URI - alias for buildMongoUri
 * @returns {string} MongoDB connection string
 */
export function getMongoUri() {
  return buildMongoUri()
}

/**
 * Check if database is configured
 * @returns {boolean} True if database can be connected
 */
export function isDatabaseConfigured() {
  const hasNewConfig = !!(
    process.env.DB_ENDPOINT &&
    process.env.DB_CLIENT_ID &&
    process.env.DB_CLIENT_SECRET
  )
  const hasLegacyConfig = !!process.env.MONGODB_URI

  return hasNewConfig || hasLegacyConfig
}

/**
 * Get database configuration type
 * @returns {'service-user' | 'legacy' | 'none'} Configuration type
 */
export function getConfigType() {
  if (process.env.DB_ENDPOINT && process.env.DB_CLIENT_ID && process.env.DB_CLIENT_SECRET) {
    return 'service-user'
  }
  if (process.env.MONGODB_URI) {
    return 'legacy'
  }
  return 'none'
}

export default {
  buildMongoUri,
  getMongoUri,
  isDatabaseConfigured,
  getConfigType
}

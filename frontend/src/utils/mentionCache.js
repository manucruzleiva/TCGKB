/**
 * Simple in-memory cache for card mention searches
 * Stores search results with a TTL of 5 minutes
 */
class MentionCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map()
    this.ttl = ttl
  }

  /**
   * Get cached results for a query
   * @param {string} query - Search query
   * @returns {Array|null} Cached cards or null if not found/expired
   */
  get(query) {
    const key = query.toLowerCase().trim()
    const cached = this.cache.get(key)

    if (!cached) return null

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Store search results in cache
   * @param {string} query - Search query
   * @param {Array} data - Array of cards
   */
  set(query, data) {
    const key = query.toLowerCase().trim()
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get cache size
   * @returns {number} Number of cached queries
   */
  size() {
    return this.cache.size
  }
}

// Export singleton instance
export const mentionCache = new MentionCache()

export default mentionCache

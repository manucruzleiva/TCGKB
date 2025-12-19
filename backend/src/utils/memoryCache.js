import log from './logger.js'

const MODULE = 'MemoryCache'

/**
 * In-memory LRU cache for ultra-fast lookups
 */
class MemoryCache {
  constructor(maxSize = 10000, ttl = 3600000) { // 10k items, 1 hour TTL
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
    this.hits = 0
    this.misses = 0
  }

  /**
   * Generate cache key
   */
  _key(prefix, value) {
    return `${prefix}:${value.toLowerCase()}`
  }

  /**
   * Get from cache
   */
  get(prefix, value) {
    const key = this._key(prefix, value)
    const item = this.cache.get(key)

    if (!item) {
      this.misses++
      return null
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      this.misses++
      return null
    }

    // Move to end (LRU)
    this.cache.delete(key)
    this.cache.set(key, item)
    this.hits++

    return item.data
  }

  /**
   * Set in cache
   */
  set(prefix, value, data, customTtl = null) {
    const key = this._key(prefix, value)
    const ttl = customTtl || this.ttl

    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear()
    this.hits = 0
    this.misses = 0
    log.info(MODULE, 'Cache cleared')
  }

  /**
   * Get cache stats
   */
  stats() {
    const total = this.hits + this.misses
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`
    }
  }

  /**
   * Warm up cache with popular searches
   */
  warmup(items) {
    items.forEach(({ prefix, value, data }) => {
      this.set(prefix, value, data)
    })
    log.info(MODULE, `Warmed up cache with ${items.length} items`)
  }
}

// Global cache instances - aggressive TTLs for better performance
export const searchCache = new MemoryCache(10000, 14400000) // 10k items, 4 hours TTL
export const cardCache = new MemoryCache(20000, 86400000) // 20k items, 24 hours TTL
export const popularityCache = new MemoryCache(100, 3600000) // 100 items, 1 hour TTL for popularity data

export default MemoryCache

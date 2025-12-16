// Simple cache utility for card data
const CACHE_PREFIX = 'tcg_cache_'
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export const cache = {
  set(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  },

  get(key) {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      const age = Date.now() - timestamp

      // Return cached data even if stale, but mark it
      return {
        data,
        isStale: age > CACHE_DURATION,
        age
      }
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  clear(key) {
    try {
      if (key) {
        localStorage.removeItem(CACHE_PREFIX + key)
      } else {
        // Clear all cache
        Object.keys(localStorage)
          .filter(k => k.startsWith(CACHE_PREFIX))
          .forEach(k => localStorage.removeItem(k))
      }
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }
}

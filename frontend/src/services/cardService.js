import api from './api'
import offlineDb from './offlineDb'

export const cardService = {
  getCards: async (name = '', page = 1, pageSize = 20, signal = null) => {
    try {
      const response = await api.get('/cards', {
        params: { name, page, pageSize },
        signal
      })

      // Cache all cards in the response
      if (response.data?.cards) {
        for (const card of response.data.cards) {
          await offlineDb.cacheCard(card).catch(err => {
            console.warn('[CardService] Failed to cache card:', err)
          })
        }
      }

      return response.data
    } catch (error) {
      // If offline and searching by name, try local search
      if (!navigator.onLine && name) {
        console.log('[CardService] Offline - searching cached cards')
        const cachedCards = await offlineDb.searchCachedCards(name)
        return {
          cards: cachedCards.slice((page - 1) * pageSize, page * pageSize),
          total: cachedCards.length,
          page,
          totalPages: Math.ceil(cachedCards.length / pageSize),
          fromCache: true
        }
      }
      throw error
    }
  },

  getCardById: async (cardId) => {
    try {
      const response = await api.get(`/cards/${cardId}`)

      // Cache the card for offline access
      await offlineDb.cacheCard(response.data).catch(err => {
        console.warn('[CardService] Failed to cache card:', err)
      })

      return response.data
    } catch (error) {
      // Try to get from cache if offline
      if (!navigator.onLine) {
        console.log('[CardService] Offline - loading from cache')
        const cachedCard = await offlineDb.getCachedCard(cardId)
        if (cachedCard) {
          return { ...cachedCard, fromCache: true }
        }
      }
      throw error
    }
  },

  searchCards: async (name, limit = 10, tcg = null) => {
    const params = { name, limit }
    if (tcg) {
      params.tcg = tcg
    }

    try {
      const response = await api.get('/cards/search', { params })

      // Cache search results
      if (response.data?.cards) {
        for (const card of response.data.cards) {
          await offlineDb.cacheCard(card).catch(err => {
            console.warn('[CardService] Failed to cache card:', err)
          })
        }
      }

      return response.data
    } catch (error) {
      // Fallback to cached search if offline
      if (!navigator.onLine) {
        console.log('[CardService] Offline - searching cached cards')
        const cachedCards = await offlineDb.searchCachedCards(name)
        return {
          cards: cachedCards.slice(0, limit),
          fromCache: true
        }
      }
      throw error
    }
  },

  getNewestCards: async (pageSize = 20) => {
    const response = await api.get('/cards/newest', {
      params: { pageSize }
    })
    return response.data
  },

  getMostCommentedCards: async (limit = 10) => {
    const response = await api.get('/cards/most-commented', {
      params: { limit }
    })
    return response.data
  },

  getCardAlternateArts: async (cardId) => {
    const response = await api.get(`/cards/${cardId}/alternate-arts`)
    return response.data
  },

  // Batch get cards by IDs (for deck import - much faster than individual calls)
  getCardsByIds: async (ids) => {
    const response = await api.post('/cards/batch', { ids })
    return response.data
  }
}

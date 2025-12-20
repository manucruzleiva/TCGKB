import api from './api'

export const cardService = {
  getCards: async (name = '', page = 1, pageSize = 20, signal = null) => {
    const response = await api.get('/cards', {
      params: { name, page, pageSize },
      signal
    })
    return response.data
  },

  getCardById: async (cardId) => {
    const response = await api.get(`/cards/${cardId}`)
    return response.data
  },

  searchCards: async (name, limit = 10, tcg = null) => {
    const params = { name, limit }
    if (tcg) {
      params.tcg = tcg
    }
    const response = await api.get('/cards/search', { params })
    return response.data
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

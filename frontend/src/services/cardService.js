import api from './api'

export const cardService = {
  getCards: async (name = '', page = 1, pageSize = 20) => {
    const response = await api.get('/cards', {
      params: { name, page, pageSize }
    })
    return response.data
  },

  getCardById: async (cardId) => {
    const response = await api.get(`/cards/${cardId}`)
    return response.data
  },

  searchCards: async (name, limit = 10) => {
    const response = await api.get('/cards/search', {
      params: { name, limit }
    })
    return response.data
  },

  getNewestCards: async (pageSize = 20) => {
    const response = await api.get('/cards/newest', {
      params: { pageSize }
    })
    return response.data
  }
}

import api from './api'

export const collectionService = {
  // Get user's collection with optional filters
  getCollection: async (params = {}) => {
    try {
      const response = await api.get('/collection', { params })
      return response.data
    } catch (error) {
      console.error('Error fetching collection:', error)
      throw error
    }
  },

  // Get collection stats
  getStats: async () => {
    try {
      const response = await api.get('/collection/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching collection stats:', error)
      throw error
    }
  },

  // Get collection filters
  getFilters: async () => {
    try {
      const response = await api.get('/collection/filters')
      return response.data
    } catch (error) {
      console.error('Error fetching collection filters:', error)
      throw error
    }
  },

  // Check ownership of a specific card
  getCardOwnership: async (cardId) => {
    try {
      const response = await api.get(`/collection/card/${encodeURIComponent(cardId)}`)
      return response.data
    } catch (error) {
      console.error('Error checking card ownership:', error)
      throw error
    }
  },

  // Add card to collection (increments quantity)
  addToCollection: async (cardData) => {
    try {
      const response = await api.post('/collection/add', cardData)
      return response.data
    } catch (error) {
      console.error('Error adding to collection:', error)
      throw error
    }
  },

  // Set exact quantity for a card
  setQuantity: async (cardData) => {
    try {
      const response = await api.put('/collection/quantity', cardData)
      return response.data
    } catch (error) {
      console.error('Error setting quantity:', error)
      throw error
    }
  },

  // Remove card from collection
  removeFromCollection: async (cardId) => {
    try {
      const response = await api.delete(`/collection/card/${encodeURIComponent(cardId)}`)
      return response.data
    } catch (error) {
      console.error('Error removing from collection:', error)
      throw error
    }
  },

  // Batch check ownership for multiple cards
  batchCheckOwnership: async (cardIds) => {
    try {
      const response = await api.post('/collection/batch', { cardIds })
      return response.data
    } catch (error) {
      console.error('Error batch checking ownership:', error)
      throw error
    }
  }
}

export default collectionService

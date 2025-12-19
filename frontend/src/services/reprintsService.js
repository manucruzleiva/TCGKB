import api from './api'

export const reprintsService = {
  /**
   * Get all reprints for a specific card
   * @param {string} cardId - The card ID to find reprints for
   */
  getCardReprints: async (cardId) => {
    try {
      const response = await api.get(`/reprints/${encodeURIComponent(cardId)}`)
      return response.data
    } catch (error) {
      console.error('Error fetching card reprints:', error)
      throw error
    }
  },

  /**
   * Get reprint statistics
   * @param {string} tcgSystem - 'pokemon' or 'riftbound'
   */
  getStats: async (tcgSystem = 'pokemon') => {
    try {
      const response = await api.get('/reprints/stats', {
        params: { tcgSystem }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching reprint stats:', error)
      throw error
    }
  },

  /**
   * Search for cards with reprints
   * @param {object} params - Search parameters
   */
  search: async (params = {}) => {
    try {
      const response = await api.get('/reprints/search', { params })
      return response.data
    } catch (error) {
      console.error('Error searching reprints:', error)
      throw error
    }
  },

  /**
   * Run reprint detection (admin only)
   * @param {object} options - Detection options
   */
  runDetection: async (options = {}) => {
    try {
      const response = await api.post('/reprints/detect', options)
      return response.data
    } catch (error) {
      console.error('Error running reprint detection:', error)
      throw error
    }
  }
}

export default reprintsService

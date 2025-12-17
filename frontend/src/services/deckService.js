import api from './api'

export const deckService = {
  // Get all decks (public + user's private)
  getDecks: async (params = {}) => {
    const response = await api.get('/decks', { params })
    return response.data
  },

  // Get single deck by ID
  getDeck: async (deckId) => {
    const response = await api.get(`/decks/${deckId}`)
    return response.data
  },

  // Create new deck
  createDeck: async (deckData) => {
    const response = await api.post('/decks', deckData)
    return response.data
  },

  // Update existing deck
  updateDeck: async (deckId, deckData) => {
    const response = await api.put(`/decks/${deckId}`, deckData)
    return response.data
  },

  // Delete deck
  deleteDeck: async (deckId) => {
    const response = await api.delete(`/decks/${deckId}`)
    return response.data
  },

  // Export deck to TCG Live format
  exportDeck: async (deckId) => {
    const response = await api.get(`/decks/${deckId}/export`)
    return response.data
  },

  // Copy a deck
  copyDeck: async (deckId) => {
    const response = await api.post(`/decks/${deckId}/copy`)
    return response.data
  },

  // Get user's decks only
  getMyDecks: async () => {
    const response = await api.get('/decks', { params: { mine: true } })
    return response.data
  },

  // Parse TCG Live format text
  parseTCGLiveFormat: (text) => {
    const lines = text.trim().split('\n')
    const cards = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      // Format: "quantity cardId" or "quantity Card Name SET number"
      const match = trimmed.match(/^(\d+)\s+(.+)$/)
      if (match) {
        const quantity = parseInt(match[1])
        const cardInfo = match[2].trim()

        // Try to extract card ID (format: SET-NUMBER at the end)
        const idMatch = cardInfo.match(/([A-Za-z0-9]+-[A-Za-z0-9]+)$/)
        if (idMatch) {
          cards.push({
            cardId: idMatch[1],
            quantity,
            name: cardInfo.replace(idMatch[1], '').trim()
          })
        } else {
          // Just use the whole thing as card ID
          cards.push({
            cardId: cardInfo,
            quantity,
            name: cardInfo
          })
        }
      }
    }

    return cards
  },

  // Format deck to TCG Live export string
  formatToTCGLive: (cards) => {
    return cards.map(card => `${card.quantity} ${card.cardId}`).join('\n')
  }
}

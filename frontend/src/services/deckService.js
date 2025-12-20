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

  // Get community decks (public decks from all users)
  getCommunityDecks: async (params = {}) => {
    const response = await api.get('/decks/community', { params })
    return response.data
  },

  // Get available tags (predefined categories)
  getAvailableTags: async () => {
    const response = await api.get('/decks/tags')
    return response.data
  },

  // Parse deck string via backend API with TCG/format detection
  // Optional format parameter allows manual format override
  parseDeck: async (deckString, format = null) => {
    const payload = { deckString }
    if (format) payload.format = format
    const response = await api.post('/decks/parse', payload)
    return response.data
  },

  // Parse deck import text (supports multiple formats) - legacy client-side parser
  parseTCGLiveFormat: (text) => {
    const lines = text.trim().split('\n')
    const cards = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('Pokémon') ||
          trimmed.startsWith('Trainer') || trimmed.startsWith('Energy') ||
          trimmed.startsWith('Pokemon') || trimmed.startsWith('Total')) continue

      // Format 1: "quantity Name SET Number" (e.g., "4 Pikachu SV1 25")
      // The SET code is usually 2-6 alphanumeric chars, Number is at the end
      const nameSetNumberMatch = trimmed.match(/^(\d+)\s+(.+?)\s+([A-Za-z]{2,6}\d*)\s+(\d+)$/)
      if (nameSetNumberMatch) {
        const quantity = parseInt(nameSetNumberMatch[1])
        const name = nameSetNumberMatch[2].trim()
        const setCode = nameSetNumberMatch[3].toLowerCase()
        const number = nameSetNumberMatch[4]
        const cardId = `${setCode}-${number}`
        cards.push({ cardId, quantity, name })
        continue
      }

      // Format 2: "quantity SET-NUMBER" (e.g., "4 sv1-25")
      const setNumberMatch = trimmed.match(/^(\d+)\s+([A-Za-z0-9]+-[A-Za-z0-9]+)$/)
      if (setNumberMatch) {
        const quantity = parseInt(setNumberMatch[1])
        const cardId = setNumberMatch[2].toLowerCase()
        cards.push({ cardId, quantity, name: cardId })
        continue
      }

      // Format 3: "quantity Name SET-NUMBER" (e.g., "4 Pikachu sv1-25")
      const nameWithIdMatch = trimmed.match(/^(\d+)\s+(.+?)\s+([A-Za-z0-9]+-[A-Za-z0-9]+)$/)
      if (nameWithIdMatch) {
        const quantity = parseInt(nameWithIdMatch[1])
        const name = nameWithIdMatch[2].trim()
        const cardId = nameWithIdMatch[3].toLowerCase()
        cards.push({ cardId, quantity, name })
        continue
      }

      // Format 4: Generic fallback - "quantity anything"
      const genericMatch = trimmed.match(/^(\d+)\s+(.+)$/)
      if (genericMatch) {
        const quantity = parseInt(genericMatch[1])
        const cardInfo = genericMatch[2].trim()
        cards.push({
          cardId: cardInfo.toLowerCase().replace(/\s+/g, '-'),
          quantity,
          name: cardInfo
        })
      }
    }

    return cards
  },

  // Format deck to TCG Live export string
  formatToTCGLive: (cards) => {
    return cards.map(card => `${card.quantity} ${card.cardId}`).join('\n')
  },

  // Get votes for a deck
  getVotes: async (deckId) => {
    const response = await api.get(`/decks/${deckId}/votes`)
    return response.data
  },

  // Vote on a deck (up or down)
  vote: async (deckId, vote) => {
    const response = await api.post(`/decks/${deckId}/vote`, { vote })
    return response.data
  }
}

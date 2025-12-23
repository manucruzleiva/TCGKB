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
  // Tracks section headers to assign supertype (#147 fix)
  parseTCGLiveFormat: (text) => {
    const lines = text.trim().split('\n')
    const cards = []
    let currentSection = null // Track current section for supertype assignment

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      // Check for section headers and track the section (#147 fix)
      const sectionMatch = trimmed.match(/^(Pokemon|Pokémon|Trainer|Energy|Total):\s*\d*$/i)
      if (sectionMatch) {
        const sectionName = sectionMatch[1].toLowerCase()
        if (sectionName === 'pokemon' || sectionName === 'pokémon') {
          currentSection = 'Pokémon'
        } else if (sectionName === 'trainer') {
          currentSection = 'Trainer'
        } else if (sectionName === 'energy') {
          currentSection = 'Energy'
        }
        continue
      }

      // Also handle simple section headers without count
      if (/^(Pokemon|Pokémon|Trainer|Energy)$/i.test(trimmed)) {
        const sectionName = trimmed.toLowerCase()
        if (sectionName === 'pokemon' || sectionName === 'pokémon') {
          currentSection = 'Pokémon'
        } else if (sectionName === 'trainer') {
          currentSection = 'Trainer'
        } else if (sectionName === 'energy') {
          currentSection = 'Energy'
        }
        continue
      }

      // Skip Total line
      if (/^Total/i.test(trimmed)) continue

      // Format 1: "quantity Name SET Number" (e.g., "4 Pikachu SV1 25")
      // The SET code is usually 2-6 alphanumeric chars, Number is at the end
      const nameSetNumberMatch = trimmed.match(/^(\d+)\s+(.+?)\s+([A-Za-z]{2,6}\d*)\s+(\d+)$/)
      if (nameSetNumberMatch) {
        const quantity = parseInt(nameSetNumberMatch[1])
        const name = nameSetNumberMatch[2].trim()
        const setCode = nameSetNumberMatch[3].toLowerCase()
        const number = nameSetNumberMatch[4]
        const cardId = `${setCode}-${number}`
        const card = { cardId, quantity, name }
        if (currentSection) card.supertype = currentSection
        cards.push(card)
        continue
      }

      // Format 2: "quantity SET-NUMBER" (e.g., "4 sv1-25")
      const setNumberMatch = trimmed.match(/^(\d+)\s+([A-Za-z0-9]+-[A-Za-z0-9]+)$/)
      if (setNumberMatch) {
        const quantity = parseInt(setNumberMatch[1])
        const cardId = setNumberMatch[2].toLowerCase()
        const card = { cardId, quantity, name: cardId }
        if (currentSection) card.supertype = currentSection
        cards.push(card)
        continue
      }

      // Format 3: "quantity Name SET-NUMBER" (e.g., "4 Pikachu sv1-25")
      const nameWithIdMatch = trimmed.match(/^(\d+)\s+(.+?)\s+([A-Za-z0-9]+-[A-Za-z0-9]+)$/)
      if (nameWithIdMatch) {
        const quantity = parseInt(nameWithIdMatch[1])
        const name = nameWithIdMatch[2].trim()
        const cardId = nameWithIdMatch[3].toLowerCase()
        const card = { cardId, quantity, name }
        if (currentSection) card.supertype = currentSection
        cards.push(card)
        continue
      }

      // Format 4: Generic fallback - "quantity anything"
      const genericMatch = trimmed.match(/^(\d+)\s+(.+)$/)
      if (genericMatch) {
        const quantity = parseInt(genericMatch[1])
        const cardInfo = genericMatch[2].trim()
        const card = {
          cardId: cardInfo.toLowerCase().replace(/\s+/g, '-'),
          quantity,
          name: cardInfo
        }
        if (currentSection) card.supertype = currentSection
        cards.push(card)
      }
    }

    return cards
  },

  // Format deck to TCG Live export string (standardized format with sections)
  /**
   * Format deck cards for TCG-arena (Riftbound)
   * Order: Champion, Legend, Units, Runes, Battlefields, Spells, Gears, Side Deck
   *
   * Uses the `type` field (Unit/Spell/Gear) from Riftbound API
   *
   * @param {Array} cards - Array of deck cards
   * @returns {string} Formatted deck string
   */
  formatToTCGArena: (cards) => {
    const lines = []

    // Categorize cards by cardType and type
    const legend = cards.filter(c => c.cardType === 'Legend')
    const battlefields = cards.filter(c => c.cardType === 'Battlefield')
    const runes = cards.filter(c => c.cardType === 'Rune')

    // Main deck cards: filter by type (Unit/Spell/Gear)
    const mainDeckCards = cards.filter(c => !['Legend', 'Battlefield', 'Rune'].includes(c.cardType))
    const units = mainDeckCards.filter(c => c.type?.toLowerCase() === 'unit')
    const spells = mainDeckCards.filter(c => c.type?.toLowerCase() === 'spell')
    const gears = mainDeckCards.filter(c => c.type?.toLowerCase() === 'gear')
    const sideDeck = [] // TODO: Implement side deck detection when API supports it

    // Champion: First card (should match legend)
    // In TCG-arena, champion is the legend but listed separately
    if (legend.length > 0) {
      lines.push(`// Champion`)
      lines.push(`${legend[0].quantity} ${legend[0].name}`)
      lines.push('')
    }

    // Legend
    if (legend.length > 0) {
      lines.push(`// Legend`)
      legend.forEach(c => lines.push(`${c.quantity} ${c.name}`))
      lines.push('')
    }

    // Units
    if (units.length > 0) {
      lines.push(`// Units`)
      units.forEach(c => lines.push(`${c.quantity} ${c.name}`))
      lines.push('')
    }

    // Runes
    if (runes.length > 0) {
      lines.push(`// Runes`)
      runes.forEach(c => lines.push(`${c.quantity} ${c.name}`))
      lines.push('')
    }

    // Battlefields (max 3, one copy each)
    if (battlefields.length > 0) {
      lines.push(`// Battlefields`)
      battlefields.forEach(c => lines.push(`${c.quantity} ${c.name}`))
      lines.push('')
    }

    // Spells
    if (spells.length > 0) {
      lines.push(`// Spells`)
      spells.forEach(c => lines.push(`${c.quantity} ${c.name}`))
      lines.push('')
    }

    // Gears
    if (gears.length > 0) {
      lines.push(`// Gears`)
      gears.forEach(c => lines.push(`${c.quantity} ${c.name}`))
      lines.push('')
    }

    // Side Deck (if any cards don't fit other categories)
    if (sideDeck.length > 0) {
      lines.push(`// Side Deck`)
      sideDeck.forEach(c => lines.push(`${c.quantity} ${c.name}`))
      lines.push('')
    }

    return lines.join('\n').trim()
  },

  /**
   * Format deck cards for export
   * - Pokemon TCG: TCG Live format with headers (Pokémon:, Trainer:, Energy:)
   * - Riftbound: TCG-arena format with sections (#172)
   *
   * @param {Array} cards - Array of deck cards
   * @param {string} tcgSystem - 'pokemon' or 'riftbound'
   */
  formatToTCGLive: (cards, tcgSystem = 'pokemon') => {
    const lines = []

    // Riftbound: Use TCG-arena format (#172)
    if (tcgSystem === 'riftbound') {
      return deckService.formatToTCGArena(cards)
    }

    // Pokemon TCG: TCG Live format with headers
    // Helper to normalize supertype
    const normalizeType = (type) => {
      if (!type) return 'other'
      const lower = type.toLowerCase()
      if (lower === 'pokémon' || lower === 'pokemon') return 'pokemon'
      if (lower === 'trainer') return 'trainer'
      if (lower === 'energy') return 'energy'
      return 'other'
    }

    // Group cards by supertype
    const pokemon = cards.filter(c => normalizeType(c.supertype) === 'pokemon')
    const trainers = cards.filter(c => normalizeType(c.supertype) === 'trainer')
    const energy = cards.filter(c => normalizeType(c.supertype) === 'energy')
    const other = cards.filter(c => normalizeType(c.supertype) === 'other')

    // Format each section with header
    if (pokemon.length > 0) {
      const count = pokemon.reduce((sum, c) => sum + c.quantity, 0)
      lines.push(`Pokémon: ${count}`)
      pokemon.forEach(c => lines.push(`${c.quantity} ${c.name || c.cardId}`))
      lines.push('')
    }

    if (trainers.length > 0) {
      const count = trainers.reduce((sum, c) => sum + c.quantity, 0)
      lines.push(`Trainer: ${count}`)
      trainers.forEach(c => lines.push(`${c.quantity} ${c.name || c.cardId}`))
      lines.push('')
    }

    if (energy.length > 0) {
      const count = energy.reduce((sum, c) => sum + c.quantity, 0)
      lines.push(`Energy: ${count}`)
      energy.forEach(c => lines.push(`${c.quantity} ${c.name || c.cardId}`))
      lines.push('')
    }

    if (other.length > 0) {
      other.forEach(c => lines.push(`${c.quantity} ${c.name || c.cardId}`))
    }

    return lines.join('\n').trim()
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

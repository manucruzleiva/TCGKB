import axios from 'axios'
import log from '../utils/logger.js'

const MODULE = 'RiftboundService'
const RIFTCODEX_API = 'https://api.riftcodex.com'

class RiftboundTCGService {
  /**
   * Search Riftbound cards
   */
  async searchCards(query, limit = 20) {
    try {
      const startTime = Date.now()

      // Fetch cards with pagination
      const response = await axios.get(`${RIFTCODEX_API}/cards`, {
        params: {
          page: 1,
          size: 50 // Get more for filtering
        },
        timeout: 10000
      })

      if (!response.data || !response.data.items) {
        return []
      }

      const allCards = response.data.items

      // Filter by query (case-insensitive search)
      let filteredCards = allCards
      if (query && query.trim()) {
        const queryLower = query.toLowerCase()
        filteredCards = allCards.filter(card =>
          card.name?.toLowerCase().includes(queryLower) ||
          card.text_plain?.toLowerCase().includes(queryLower) ||
          card.classification?.type?.toLowerCase().includes(queryLower)
        )
      }

      // Transform to our standard format
      const cards = filteredCards.slice(0, limit).map(this.transformCard)

      const duration = Date.now() - startTime
      log.perf(MODULE, `Search "${query}"`, duration)
      log.info(MODULE, `Found ${cards.length} Riftbound cards for query: ${query}`)

      return cards
    } catch (error) {
      log.error(MODULE, 'Card search failed', error)
      return []
    }
  }

  /**
   * Get card by ID
   */
  async getCardById(cardId) {
    try {
      const startTime = Date.now()

      // Riftcodex doesn't have a single card endpoint, so we fetch from the list
      const response = await axios.get(`${RIFTCODEX_API}/cards`, {
        params: {
          page: 1,
          size: 500 // Fetch all to find by ID
        },
        timeout: 10000
      })

      if (!response.data || !response.data.items) {
        return null
      }

      const card = response.data.items.find(c => c.riftbound_id === cardId || c.id === cardId)

      if (!card) {
        return null
      }

      const duration = Date.now() - startTime
      log.perf(MODULE, `Get card ${cardId}`, duration)

      return this.transformCard(card)
    } catch (error) {
      log.error(MODULE, 'Get card failed', error)
      return null
    }
  }

  /**
   * Transform Riftbound card to our standard format
   */
  transformCard(card) {
    // Handle domain - can be array or string
    let domainValue = null
    let domainsArray = []

    if (card.classification?.domain) {
      if (Array.isArray(card.classification.domain)) {
        domainsArray = card.classification.domain
        domainValue = card.classification.domain.join(', ')
      } else {
        domainValue = card.classification.domain
        // Convert string "Mind, Chaos" to array ["Mind", "Chaos"]
        domainsArray = domainValue.split(',').map(d => d.trim())
      }
    }

    // Image URL is inside media object
    const imageUrl = card.media?.image_url || card.image_url || null

    // Text can be in different formats
    const textContent = card.text?.plain || card.text_plain || (typeof card.text === 'string' ? card.text : '') || ''
    const textHtmlContent = card.text?.html || card.text_html || ''

    return {
      id: card.riftbound_id || card.id,
      name: card.name,
      tcgSystem: 'riftbound',
      images: {
        small: imageUrl,
        large: imageUrl
      },
      // Riftbound specific fields
      artist: card.media?.artist || card.artist || null,
      rarity: card.classification?.rarity || 'Common',
      type: card.classification?.type || 'Unknown',
      supertype: card.classification?.supertype || null,
      domain: domainValue, // String format "Mind, Chaos"
      domains: domainsArray, // Array format ["Mind", "Chaos"] for filter compatibility
      attributes: {
        energy: card.attributes?.energy,
        might: card.attributes?.might,
        power: card.attributes?.power
      },
      text: textContent,
      textHtml: textHtmlContent,
      set: {
        name: card.set?.label || card.set?.name || 'Unknown Set',
        id: card.set?.set_id || card.set?.id,
        series: 'Riftbound',
        releaseDate: card.set?.release_date || null
      },
      collector_number: card.collector_number,
      number: card.collector_number, // Also add as 'number' for consistency with Pokemon
      tags: card.tags || [],
      alternateArt: card.alternate_art || false,
      signature: card.signature || false
    }
  }

  /**
   * Get all cards (for caching)
   */
  async getAllCards() {
    try {
      const allCards = []
      let currentPage = 1
      let totalPages = 1

      // Fetch first page to get total pages
      const firstResponse = await axios.get(`${RIFTCODEX_API}/cards`, {
        params: {
          page: 1,
          size: 50
        },
        timeout: 10000
      })

      if (!firstResponse.data) {
        return []
      }

      totalPages = firstResponse.data.pages || 1
      allCards.push(...(firstResponse.data.items || []))

      // Fetch remaining pages
      while (currentPage < totalPages) {
        currentPage++

        const response = await axios.get(`${RIFTCODEX_API}/cards`, {
          params: {
            page: currentPage,
            size: 50
          },
          timeout: 10000
        })

        if (response.data && response.data.items) {
          allCards.push(...response.data.items)
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      log.info(MODULE, `Fetched ${allCards.length} total Riftbound cards`)
      return allCards.map(this.transformCard.bind(this))
    } catch (error) {
      log.error(MODULE, 'Get all cards failed', error)
      return []
    }
  }
}

export default new RiftboundTCGService()

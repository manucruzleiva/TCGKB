/**
 * Deck Auto-Tagger Utility
 * Generates tags automatically based on deck composition
 *
 * Pokemon Tags:
 * - Energy types (fire, water, grass, etc.)
 * - Mechanics (ex-focused, v-focused, vstar, radiant, ace-spec)
 * - Format (standard, glc, expanded)
 *
 * Riftbound Tags:
 * - Domains (fury, calm, mind, body, order, chaos)
 * - Champion (Legend name)
 */

import log from './logger.js'

const MODULE = 'DeckAutoTagger'

// Pokemon type mapping from card data
const POKEMON_TYPES = [
  'fire', 'water', 'grass', 'electric', 'psychic',
  'fighting', 'dark', 'steel', 'dragon', 'colorless', 'fairy'
]

// Mechanic detection patterns
const MECHANIC_PATTERNS = {
  'ex-focused': [' ex'],
  'v-focused': [' v'],
  'vstar': [' vstar', 'vstar'],
  'vmax': [' vmax', 'vmax'],
  'single-prize': [], // Detected by absence of rule box
  'lost-zone': ['lost zone', 'lost-zone'],
  'rapid-strike': ['rapid strike', 'rapid-strike'],
  'single-strike': ['single strike', 'single-strike']
}

// Riftbound domains
const RIFTBOUND_DOMAINS = ['fury', 'calm', 'mind', 'body', 'order', 'chaos']

/**
 * Generate auto-tags for a Pokemon deck
 */
function generatePokemonTags(cards, format = 'standard') {
  const tags = new Set()

  // Add format tag
  if (format) {
    tags.add(format.toLowerCase())
  }

  // Analyze cards
  const pokemonCards = cards.filter(c => {
    const supertype = c.supertype?.toLowerCase() || ''
    return supertype === 'pokémon' || supertype === 'pokemon'
  })

  // Detect Pokemon types
  const types = new Set()
  pokemonCards.forEach(card => {
    if (card.types && Array.isArray(card.types)) {
      card.types.forEach(type => types.add(type.toLowerCase()))
    }
  })

  // Add type tags
  types.forEach(type => {
    if (POKEMON_TYPES.includes(type)) {
      tags.add(type)
    }
  })

  // Detect mechanics from card names
  const allNames = cards.map(c => c.name?.toLowerCase() || '').join(' ')

  // Check for rule box mechanics
  const hasEx = cards.some(c => c.name?.toLowerCase().includes(' ex'))
  const hasV = cards.some(c => c.name?.toLowerCase().endsWith(' v'))
  const hasVStar = cards.some(c => c.name?.toLowerCase().includes('vstar'))
  const hasVMax = cards.some(c => c.name?.toLowerCase().includes('vmax'))
  const hasRadiant = cards.some(c => c.name?.toLowerCase().startsWith('radiant '))

  // Add mechanic tags based on focus (majority)
  const totalPokemon = pokemonCards.reduce((sum, c) => sum + c.quantity, 0)
  const exCount = pokemonCards.filter(c => c.name?.toLowerCase().includes(' ex')).reduce((sum, c) => sum + c.quantity, 0)
  const vCount = pokemonCards.filter(c => c.name?.toLowerCase().endsWith(' v')).reduce((sum, c) => sum + c.quantity, 0)

  if (exCount >= totalPokemon * 0.3) tags.add('ex-focused')
  if (vCount >= totalPokemon * 0.3) tags.add('v-focused')
  if (hasVStar) tags.add('vstar')
  if (hasVMax) tags.add('vmax')

  // Single prize detection (no rule box pokemon)
  if (!hasEx && !hasV && !hasVStar && !hasVMax && !hasRadiant) {
    tags.add('single-prize')
  }

  // Lost Zone detection
  if (allNames.includes('lost zone') || allNames.includes('comfey') || allNames.includes('mirage gate')) {
    tags.add('lost-zone')
  }

  // Strike style detection
  if (allNames.includes('rapid strike') || allNames.includes('rapid-strike')) {
    tags.add('rapid-strike')
  }
  if (allNames.includes('single strike') || allNames.includes('single-strike')) {
    tags.add('single-strike')
  }

  log.info(MODULE, `Generated ${tags.size} Pokemon tags: ${Array.from(tags).join(', ')}`)

  return Array.from(tags)
}

/**
 * Generate auto-tags for a Riftbound deck
 */
function generateRiftboundTags(cards) {
  const tags = new Set()

  // Find the Legend
  const legends = cards.filter(c => c.cardType === 'Legend')
  if (legends.length > 0) {
    const legendName = legends[0].name
    if (legendName) {
      // Add champion tag (simplified name)
      const championTag = legendName.split(',')[0].toLowerCase().trim().replace(/\s+/g, '-')
      tags.add(`champion-${championTag}`)
    }

    // Add domain tags from Legend
    const legendDomains = legends[0].domains || []
    legendDomains.forEach(domain => {
      const lowerDomain = domain.toLowerCase()
      if (RIFTBOUND_DOMAINS.includes(lowerDomain)) {
        tags.add(lowerDomain)
      }
    })
  }

  // Detect domains from all cards
  cards.forEach(card => {
    if (card.domains && Array.isArray(card.domains)) {
      card.domains.forEach(domain => {
        const lowerDomain = domain.toLowerCase()
        if (RIFTBOUND_DOMAINS.includes(lowerDomain)) {
          tags.add(lowerDomain)
        }
      })
    }
  })

  log.info(MODULE, `Generated ${tags.size} Riftbound tags: ${Array.from(tags).join(', ')}`)

  return Array.from(tags)
}

/**
 * Main auto-tagging function
 * Detects TCG and generates appropriate tags
 */
export function generateAutoTags(cards, tcg = 'pokemon', format = null) {
  if (!cards || cards.length === 0) {
    return []
  }

  if (tcg === 'riftbound') {
    return generateRiftboundTags(cards)
  }

  return generatePokemonTags(cards, format)
}

/**
 * Merge auto-generated tags with user-selected tags
 * User tags take precedence for conflicts
 */
export function mergeWithUserTags(autoTags, userTags = []) {
  const merged = new Set([...autoTags, ...userTags])
  return Array.from(merged)
}

/**
 * Get suggested tags for a deck (auto-tags not yet added)
 */
export function getSuggestedTags(cards, tcg, format, existingTags = []) {
  const autoTags = generateAutoTags(cards, tcg, format)
  return autoTags.filter(tag => !existingTags.includes(tag))
}

export default {
  generateAutoTags,
  mergeWithUserTags,
  getSuggestedTags,
  POKEMON_TYPES,
  RIFTBOUND_DOMAINS
}

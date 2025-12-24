/**
 * Deck Parser Utility
 * Parses deck strings from various formats and detects TCG/format
 *
 * Supported formats:
 * - Pokemon TCG Live (sections with Pokemon/Trainer/Energy)
 * - Pokemon TCG Pocket (simple "Name x2" or "Name (Set) x2")
 * - Riftbound (number + name format from tcg-arena.fr)
 */

import log from './logger.js'

const MODULE = 'DeckParser'

// Pokemon TCG Live section headers (multiple languages)
const POKEMON_SECTIONS = {
  pokemon: ['pokémon:', 'pokemon:', 'pokémon', 'pokemon'],
  trainer: ['trainer:', 'trainers:', 'trainer', 'trainers', 'entrenador:', 'entrenadores:'],
  energy: ['energy:', 'energies:', 'energy', 'energía:', 'energías:']
}

// Riftbound keywords that indicate the TCG
const RIFTBOUND_KEYWORDS = [
  'rune', 'legend', 'battlefield', 'fury', 'calm', 'mind', 'body', 'order', 'chaos',
  'leona', 'clockwork', 'domain'
]

// Pokemon-specific keywords
const POKEMON_KEYWORDS = [
  'pikachu', 'charizard', 'pokemon', 'pokémon', 'trainer', 'energy',
  'supporter', 'item', 'stadium', 'basic', 'stage 1', 'stage 2',
  'ex', 'vstar', 'vmax', 'gx', 'v-union', 'radiant', 'ace spec'
]

/**
 * Detect if text looks like Pokemon TCG Live format
 * Format has section headers like "Pokémon: 12" or "Pokemon:"
 */
function isPokemonTCGLiveFormat(text) {
  const lower = text.toLowerCase()
  const hasPokemonSection = POKEMON_SECTIONS.pokemon.some(h => lower.includes(h))
  const hasTrainerSection = POKEMON_SECTIONS.trainer.some(h => lower.includes(h))
  const hasEnergySection = POKEMON_SECTIONS.energy.some(h => lower.includes(h))

  // Need at least 2 of 3 sections, or Pokemon section + one other
  const sectionCount = [hasPokemonSection, hasTrainerSection, hasEnergySection].filter(Boolean).length
  return sectionCount >= 2 || (hasPokemonSection && sectionCount >= 1)
}

/**
 * Detect if text looks like Pokemon TCG Pocket format
 * Format: "Card Name x2" or "Card Name (Set) x2"
 */
function isPokemonTCGPocketFormat(text) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length === 0) return false

  // Check if most lines match the "Name x#" or "Name (Set) x#" pattern
  const pocketPattern = /^(.+?)\s*(?:\([^)]+\))?\s*x\s*(\d+)$/i
  const matchingLines = lines.filter(l => pocketPattern.test(l.trim()))

  return matchingLines.length >= lines.length * 0.6 // 60% of lines match
}

/**
 * Detect if text contains Riftbound-specific keywords
 */
function containsRiftboundKeywords(text) {
  const lower = text.toLowerCase()
  return RIFTBOUND_KEYWORDS.some(keyword => lower.includes(keyword))
}

/**
 * Detect if text contains Pokemon-specific keywords
 */
function containsPokemonKeywords(text) {
  const lower = text.toLowerCase()
  return POKEMON_KEYWORDS.some(keyword => lower.includes(keyword))
}

/**
 * Parse Pokemon TCG Live format
 *
 * Example:
 * Pokémon: 12
 * 4 Pikachu ex SVI 057
 * 4 Raichu SVI 058
 *
 * Trainer: 36
 * 4 Professor's Research SVI 189
 *
 * Energy: 12
 * 8 Electric Energy SVE 004
 */
function parsePokemonTCGLive(text) {
  const lines = text.trim().split('\n')
  const cards = []
  let currentSection = null
  const errors = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue

    // Check for section header
    const lower = trimmed.toLowerCase()
    if (POKEMON_SECTIONS.pokemon.some(h => lower.startsWith(h))) {
      currentSection = 'pokemon'
      continue
    }
    if (POKEMON_SECTIONS.trainer.some(h => lower.startsWith(h))) {
      currentSection = 'trainer'
      continue
    }
    if (POKEMON_SECTIONS.energy.some(h => lower.startsWith(h))) {
      currentSection = 'energy'
      continue
    }

    // Skip section count lines (just numbers like "12")
    if (/^\d+$/.test(trimmed)) continue

    // Parse card line: "4 Pikachu ex SVI 057" or "4 SVI 057"
    // Pattern: quantity name [setCode] [number]
    const match = trimmed.match(/^(\d+)\s+(.+)$/)
    if (match) {
      const quantity = parseInt(match[1])
      const cardPart = match[2].trim()

      if (quantity > 0 && quantity <= 60 && cardPart) {
        // Try to extract set code and number from the end
        // Format: "Card Name SET 123" or "Card Name SET-123"
        const setMatch = cardPart.match(/^(.+?)\s+([A-Z]{2,4})\s*[-]?\s*(\d{1,4})$/i)

        let name, setCode, setNumber, cardId

        if (setMatch) {
          name = setMatch[1].trim()
          setCode = setMatch[2].toLowerCase()
          setNumber = setMatch[3].padStart(3, '0')
          cardId = `${setCode}-${setNumber}`
        } else {
          // No set info, just card name or raw ID
          name = cardPart
          cardId = cardPart.replace(/\s+/g, '-').toLowerCase()
        }

        // Map section to supertype
        const supertype = currentSection === 'pokemon' ? 'Pokémon' :
                         currentSection === 'trainer' ? 'Trainer' :
                         currentSection === 'energy' ? 'Energy' : null

        // Check if card already exists (combine quantities)
        const existing = cards.find(c => c.cardId === cardId || c.name?.toLowerCase() === name.toLowerCase())
        if (existing) {
          existing.quantity += quantity
        } else {
          cards.push({
            cardId,
            name,
            quantity,
            setCode: setCode || null,
            setNumber: setNumber || null,
            supertype,
            originalLine: trimmed
          })
        }
      }
    } else if (trimmed.length > 0) {
      errors.push({ line: trimmed, error: 'Could not parse line' })
    }
  }

  return { cards, errors }
}

/**
 * Parse Pokemon TCG Pocket format
 *
 * Example:
 * Pikachu ex x2
 * Raichu x2
 * Professor's Research x2
 */
function parsePokemonTCGPocket(text) {
  const lines = text.trim().split('\n')
  const cards = []
  const errors = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue

    // Pattern: "Card Name x2" or "Card Name (Set) x2"
    const match = trimmed.match(/^(.+?)\s*(?:\(([^)]+)\))?\s*x\s*(\d+)$/i)

    if (match) {
      const name = match[1].trim()
      const setInfo = match[2]?.trim() || null
      const quantity = parseInt(match[3])

      if (quantity > 0 && name) {
        const cardId = name.replace(/\s+/g, '-').toLowerCase() + (setInfo ? `-${setInfo.toLowerCase()}` : '')

        const existing = cards.find(c => c.name?.toLowerCase() === name.toLowerCase())
        if (existing) {
          existing.quantity += quantity
        } else {
          cards.push({
            cardId,
            name,
            quantity,
            setCode: setInfo,
            supertype: null, // Unknown in Pocket format
            originalLine: trimmed
          })
        }
      }
    } else {
      errors.push({ line: trimmed, error: 'Could not parse line' })
    }
  }

  return { cards, errors }
}

/**
 * Parse Riftbound format (tcg-arena.fr style)
 *
 * Example:
 * 1 Leona, Determined
 * 3 Clockwork Keeper
 * 6 Order Rune
 */
function parseRiftbound(text) {
  const lines = text.trim().split('\n')
  const cards = []
  const errors = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue

    // Pattern: "quantity Name" or "quantity x Name"
    const match = trimmed.match(/^(\d+)\s*x?\s+(.+)$/i)

    if (match) {
      const quantity = parseInt(match[1])
      const name = match[2].trim()

      if (quantity > 0 && name) {
        const cardId = `riftbound-${name.replace(/\s+/g, '-').toLowerCase()}`

        // Detect card type from name
        let cardType = null
        const lowerName = name.toLowerCase()
        if (lowerName.includes('rune')) cardType = 'Rune'
        else if (/battlefield|grove|monastery|hillock|windswept|temple|sanctuary|citadel/i.test(name)) cardType = 'Battlefield'

        const existing = cards.find(c => c.name?.toLowerCase() === name.toLowerCase())
        if (existing) {
          existing.quantity += quantity
        } else {
          cards.push({
            cardId,
            name,
            quantity,
            cardType,
            supertype: null,
            originalLine: trimmed
          })
        }
      }
    } else {
      errors.push({ line: trimmed, error: 'Could not parse line' })
    }
  }

  return { cards, errors }
}

/**
 * Parse generic format (quantity + card reference)
 * Fallback parser for unrecognized formats
 */
function parseGeneric(text) {
  const lines = text.trim().split('\n')
  const cards = []
  const errors = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue

    // Try various patterns
    // Pattern 1: "4 card-name" or "4 Card Name"
    let match = trimmed.match(/^(\d+)\s+(.+)$/)

    // Pattern 2: "Card Name x4"
    if (!match) {
      match = trimmed.match(/^(.+?)\s*x\s*(\d+)$/i)
      if (match) {
        // Swap groups
        match = [match[0], match[2], match[1]]
      }
    }

    if (match) {
      const quantity = parseInt(match[1])
      const cardPart = match[2].trim()

      if (quantity > 0 && cardPart) {
        const cardId = cardPart.replace(/\s+/g, '-').toLowerCase()

        const existing = cards.find(c => c.cardId === cardId)
        if (existing) {
          existing.quantity += quantity
        } else {
          cards.push({
            cardId,
            name: cardPart,
            quantity,
            originalLine: trimmed
          })
        }
      }
    } else if (trimmed.length > 0) {
      errors.push({ line: trimmed, error: 'Could not parse line' })
    }
  }

  return { cards, errors }
}

/**
 * Detect TCG type from parsed cards and original text
 */
function detectTCG(text, cards) {
  const hasRiftboundKeywords = containsRiftboundKeywords(text)
  const hasPokemonKeywords = containsPokemonKeywords(text)

  // Check card names for TCG-specific patterns
  const cardNames = cards.map(c => c.name?.toLowerCase() || '').join(' ')
  const cardsHaveRiftbound = containsRiftboundKeywords(cardNames)
  const cardsHavePokemon = containsPokemonKeywords(cardNames)

  // Check for Riftbound-specific card types
  const hasRunes = cards.some(c => c.cardType === 'Rune' || c.name?.toLowerCase().includes('rune'))
  const hasBattlefields = cards.some(c => c.cardType === 'Battlefield' || /battlefield|grove|monastery|hillock|windswept|temple|sanctuary|citadel/i.test(c.name || ''))

  // Scoring
  let pokemonScore = 0
  let riftboundScore = 0

  if (hasPokemonKeywords) pokemonScore += 3
  if (hasRiftboundKeywords) riftboundScore += 3
  if (cardsHavePokemon) pokemonScore += 2
  if (cardsHaveRiftbound) riftboundScore += 2
  if (hasRunes) riftboundScore += 2
  if (hasBattlefields) riftboundScore += 2

  // Check for Pokemon sections in text
  if (isPokemonTCGLiveFormat(text)) pokemonScore += 4

  // Check total cards (Pokemon = 60, Riftbound = 56)
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  if (totalCards === 60) pokemonScore += 1
  if (totalCards === 56) riftboundScore += 1 // 40 main + 1 legend + 3 battlefield + 12 runes

  if (riftboundScore > pokemonScore) {
    return 'riftbound'
  }

  return 'pokemon' // Default to Pokemon
}

/**
 * Detect Pokemon format based on deck composition
 */
function detectPokemonFormat(cards) {
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)

  // Check for GLC indicators
  const cardNames = cards.map(c => c.name?.toLowerCase() || '')
  const hasRuleBox = cardNames.some(name =>
    name.includes(' ex') ||
    name.includes(' v') ||
    name.includes(' vstar') ||
    name.includes(' vmax') ||
    name.includes('radiant ')
  )

  // Check for singleton (GLC characteristic)
  const isSingleton = cards.every(c => {
    // Basic energy can have multiple copies
    const isBasicEnergy = c.supertype === 'Energy' &&
      ['fire', 'water', 'grass', 'electric', 'psychic', 'fighting', 'dark', 'metal', 'fairy', 'colorless']
        .some(type => c.name?.toLowerCase().includes(type))
    return c.quantity === 1 || isBasicEnergy
  })

  // If singleton + no rule box pokemon, likely GLC
  if (isSingleton && !hasRuleBox && totalCards === 60) {
    return {
      format: 'glc',
      confidence: 85,
      reason: 'Singleton deck without Rule Box Pokemon'
    }
  }

  // Default to Standard
  return {
    format: 'standard',
    confidence: 60,
    reason: 'Default format (60 cards with standard structure)'
  }
}

/**
 * Detect Riftbound format based on deck composition
 */
function detectRiftboundFormat(cards) {
  // Riftbound Constructed: 40 main + 1 legend + 3 battlefield + 12 runes
  const runes = cards.filter(c => c.name?.toLowerCase().includes('rune'))
  const battlefields = cards.filter(c => /battlefield|grove|monastery|hillock|windswept|temple|sanctuary|citadel/i.test(c.name || ''))
  const legends = cards.filter(c => (c.type || c.cardType) === 'Legend')

  const runeCount = runes.reduce((sum, c) => sum + c.quantity, 0)
  const battlefieldCount = battlefields.reduce((sum, c) => sum + c.quantity, 0)

  if (runeCount === 12 && battlefieldCount === 3) {
    return {
      format: 'constructed',
      confidence: 90,
      reason: 'Standard Riftbound constructed (12 runes, 3 battlefields)'
    }
  }

  return {
    format: 'constructed',
    confidence: 50,
    reason: 'Default Riftbound format'
  }
}

/**
 * Calculate deck breakdown by card type
 */
export function calculateBreakdown(cards, tcg) {
  if (tcg === 'pokemon') {
    const breakdown = {
      pokemon: 0,
      trainer: 0,
      energy: 0,
      unknown: 0
    }

    cards.forEach(card => {
      const supertype = card.supertype?.toLowerCase()
      if (supertype === 'pokémon' || supertype === 'pokemon') {
        breakdown.pokemon += card.quantity
      } else if (supertype === 'trainer') {
        breakdown.trainer += card.quantity
      } else if (supertype === 'energy') {
        breakdown.energy += card.quantity
      } else {
        breakdown.unknown += card.quantity
      }
    })

    return breakdown
  }

  if (tcg === 'riftbound') {
    const breakdown = {
      mainDeck: 0,
      legend: 0,
      battlefield: 0,
      rune: 0,
      unknown: 0
    }

    cards.forEach(card => {
      const name = card.name || ''
      const cardType = card.type || card.cardType // Use enriched 'type' field or fallback to 'cardType'

      if (cardType === 'Legend') {
        breakdown.legend += card.quantity
      } else if (cardType === 'Rune' || name.toLowerCase().includes('rune')) {
        breakdown.rune += card.quantity
      } else if (cardType === 'Battlefield' || /battlefield|grove|monastery|hillock|windswept|temple|sanctuary|citadel/i.test(name)) {
        breakdown.battlefield += card.quantity
      } else if (cardType === 'Unit' || cardType === 'Spell' || cardType === 'Gear') {
        breakdown.mainDeck += card.quantity
      } else {
        // If no type detected, use name-based fallback
        if (name.toLowerCase().includes('rune')) {
          breakdown.rune += card.quantity
        } else if (/battlefield|grove|monastery|hillock|windswept|temple|sanctuary|citadel/i.test(name)) {
          breakdown.battlefield += card.quantity
        } else {
          breakdown.mainDeck += card.quantity
        }
      }
    })

    return breakdown
  }

  return { total: cards.reduce((sum, c) => sum + c.quantity, 0) }
}

/**
 * Main parsing function
 * Detects format and TCG, parses cards, returns structured result
 */
export function parseDeckString(deckString) {
  if (!deckString || typeof deckString !== 'string') {
    return {
      success: false,
      error: 'No deck string provided',
      tcg: null,
      format: null,
      cards: [],
      errors: []
    }
  }

  const text = deckString.trim()
  if (!text) {
    return {
      success: false,
      error: 'Empty deck string',
      tcg: null,
      format: null,
      cards: [],
      errors: []
    }
  }

  let parseResult
  let detectedInputFormat

  // Detect and parse based on input format
  if (isPokemonTCGLiveFormat(text)) {
    detectedInputFormat = 'pokemon-tcg-live'
    parseResult = parsePokemonTCGLive(text)
  } else if (isPokemonTCGPocketFormat(text)) {
    detectedInputFormat = 'pokemon-tcg-pocket'
    parseResult = parsePokemonTCGPocket(text)
  } else if (containsRiftboundKeywords(text) && !containsPokemonKeywords(text)) {
    detectedInputFormat = 'riftbound'
    parseResult = parseRiftbound(text)
  } else {
    detectedInputFormat = 'generic'
    parseResult = parseGeneric(text)
  }

  const { cards, errors } = parseResult

  if (cards.length === 0) {
    return {
      success: false,
      error: 'Could not parse any cards from the input',
      tcg: null,
      format: null,
      inputFormat: detectedInputFormat,
      cards: [],
      errors
    }
  }

  // Detect TCG
  const tcg = detectTCG(text, cards)

  // Detect format based on TCG
  const formatInfo = tcg === 'riftbound'
    ? detectRiftboundFormat(cards)
    : detectPokemonFormat(cards)

  // Calculate breakdown
  const breakdown = calculateBreakdown(cards, tcg)
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  const uniqueCards = cards.length

  log.info(MODULE, `Parsed ${uniqueCards} unique cards (${totalCards} total) - TCG: ${tcg}, Format: ${formatInfo.format}`)

  return {
    success: true,
    tcg,
    format: formatInfo.format,
    formatConfidence: formatInfo.confidence,
    formatReason: formatInfo.reason,
    inputFormat: detectedInputFormat,
    cards: cards.map(c => ({
      cardId: c.cardId,
      name: c.name,
      quantity: c.quantity,
      setCode: c.setCode || null,
      setNumber: c.setNumber || null,
      supertype: c.supertype || null
    })),
    breakdown,
    stats: {
      totalCards,
      uniqueCards
    },
    errors
  }
}

export default {
  parseDeckString
}

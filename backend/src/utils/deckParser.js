/**
 * Deck Parser Utility - Refactored with 5-Step Import Flow
 *
 * Flow:
 * 1. checkTCG() - Detect Pokemon vs Riftbound
 * 2. validateInput() - Validate format patterns
 * 3. parseCards() - Extract card data
 * 4. categorizeCards() - Enrich with metadata (done in controller)
 * 5. validateDeck() - Format & legality validation (done in controller)
 *
 * Supported formats:
 * - Pokemon TCG Live (sections with Pokemon/Trainer/Energy)
 * - Pokemon TCG Pocket (simple "Name x2" or "Name (Set) x2")
 * - Riftbound (number + name format from tcg-arena.fr)
 */

import log from './logger.js'
import deckValidator from './deckValidator.js'

const MODULE = 'DeckParser'
const { isBasicPokemon } = deckValidator

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
 * STEP 1: checkTCG() - TCG Detection
 *
 * Analyzes raw input text to determine Pokemon TCG vs Riftbound
 * Uses keyword analysis, format structure detection, and scoring system
 *
 * @param {string} text - Raw deck string input
 * @returns {object} { tcg: 'pokemon'|'riftbound', confidence: 0-100, reasons: [] }
 */
export function checkTCG(text) {
  const lower = text.toLowerCase()
  const reasons = []

  // Detection Method 1: Keyword Analysis
  const hasPokemonKeywords = POKEMON_KEYWORDS.some(keyword => lower.includes(keyword))
  const hasRiftboundKeywords = RIFTBOUND_KEYWORDS.some(keyword => lower.includes(keyword))

  // Detection Method 2: Format Structure
  const hasPokemonSections = POKEMON_SECTIONS.pokemon.some(h => lower.includes(h)) ||
                             POKEMON_SECTIONS.trainer.some(h => lower.includes(h)) ||
                             POKEMON_SECTIONS.energy.some(h => lower.includes(h))

  // Detection Method 3: Scoring System
  let pokemonScore = 0
  let riftboundScore = 0

  if (hasPokemonKeywords) {
    pokemonScore += 3
    reasons.push('Contains Pokemon keywords')
  }

  if (hasRiftboundKeywords) {
    riftboundScore += 3
    reasons.push('Contains Riftbound keywords')
  }

  if (hasPokemonSections) {
    pokemonScore += 4
    reasons.push('Has Pokemon TCG Live section headers')
  }

  // Check for Pocket format pattern
  const lines = text.trim().split('\n').filter(l => l.trim())
  const pocketPattern = /^(.+?)\s*(?:\([^)]+\))?\s*x\s*(\d+)$/i
  const pocketMatches = lines.filter(l => pocketPattern.test(l.trim())).length
  if (pocketMatches >= lines.length * 0.6) {
    pokemonScore += 2
    reasons.push('Matches Pokemon Pocket format pattern')
  }

  // Check for Riftbound format pattern
  const riftboundPattern = /^(\d+)\s*x?\s+(.+)$/i
  const riftboundMatches = lines.filter(l => riftboundPattern.test(l.trim())).length
  if (riftboundMatches >= lines.length * 0.6 && hasRiftboundKeywords) {
    riftboundScore += 2
    reasons.push('Matches Riftbound format pattern')
  }

  // Determine TCG
  const tcg = riftboundScore > pokemonScore ? 'riftbound' : 'pokemon'
  const maxScore = Math.max(pokemonScore, riftboundScore)
  const totalPossible = 9 // Max possible score
  const confidence = Math.min(100, Math.round((maxScore / totalPossible) * 100))

  log.info(MODULE, `TCG Detection: ${tcg} (confidence: ${confidence}%, pokemon: ${pokemonScore}, riftbound: ${riftboundScore})`)

  return {
    tcg,
    confidence,
    reasons,
    scores: {
      pokemon: pokemonScore,
      riftbound: riftboundScore
    }
  }
}

/**
 * STEP 2: validateInput() - Input Format Validation
 *
 * Validates that input conforms to expected TCG format patterns
 * Returns detailed errors for lines that don't match expected format
 *
 * @param {string} text - Raw deck string
 * @param {string} tcg - Detected TCG ('pokemon' or 'riftbound')
 * @returns {object} { isValid: boolean, errors: [], inputFormat: string }
 */
export function validateInput(text, tcg) {
  const lines = text.trim().split('\n')
  const errors = []
  let inputFormat = 'unknown'
  let validLines = 0
  let totalLines = 0

  if (tcg === 'pokemon') {
    // Check if it's Pokemon TCG Live format (has section headers)
    const hasSections = POKEMON_SECTIONS.pokemon.some(h => text.toLowerCase().includes(h))

    if (hasSections) {
      inputFormat = 'pokemon-tcg-live'

      // Validate Pokemon TCG Live format
      // Expected: section headers + "quantity name setCode number" lines
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue

        totalLines++

        // Check for section header
        const lower = trimmed.toLowerCase()
        if (POKEMON_SECTIONS.pokemon.some(h => lower.startsWith(h)) ||
            POKEMON_SECTIONS.trainer.some(h => lower.startsWith(h)) ||
            POKEMON_SECTIONS.energy.some(h => lower.startsWith(h))) {
          validLines++
          continue
        }

        // Skip section count lines (just numbers)
        if (/^\d+$/.test(trimmed)) {
          validLines++
          continue
        }

        // Validate card line: "4 Pikachu ex SVI 057"
        const match = trimmed.match(/^(\d+)\s+(.+)$/)
        if (match) {
          const quantity = parseInt(match[1])
          const cardPart = match[2].trim()

          if (quantity > 0 && quantity <= 60 && cardPart) {
            validLines++
          } else {
            if (quantity < 1 || quantity > 60) {
              errors.push({ line: trimmed, error: 'Invalid quantity (must be 1-60)' })
            } else {
              errors.push({ line: trimmed, error: 'Missing card name' })
            }
          }
        } else {
          errors.push({ line: trimmed, error: 'Line does not match expected format "quantity name [set number]"' })
        }
      }
    } else {
      // Check for Pokemon Pocket format
      inputFormat = 'pokemon-tcg-pocket'
      const pocketPattern = /^(.+?)\s*(?:\([^)]+\))?\s*x\s*(\d+)$/i

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue

        totalLines++

        const match = trimmed.match(pocketPattern)
        if (match) {
          const quantity = parseInt(match[2])
          if (quantity > 0 && quantity <= 60) {
            validLines++
          } else {
            errors.push({ line: trimmed, error: 'Invalid quantity (must be 1-60)' })
          }
        } else {
          errors.push({ line: trimmed, error: 'Line does not match expected format "Name x#" or "Name (Set) x#"' })
        }
      }

      // Pocket format requires at least 60% match
      if (validLines < totalLines * 0.6) {
        errors.push({ line: '', error: `Only ${validLines}/${totalLines} lines match Pocket format (need 60%)` })
      }
    }
  } else if (tcg === 'riftbound') {
    inputFormat = 'riftbound'

    // Validate Riftbound format: "quantity Name" or "quantity x Name"
    const riftboundPattern = /^(\d+)\s*x?\s+(.+)$/i

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue

      totalLines++

      const match = trimmed.match(riftboundPattern)
      if (match) {
        const quantity = parseInt(match[1])
        const name = match[2].trim()

        if (quantity > 0 && quantity <= 60 && name) {
          validLines++
        } else {
          if (quantity < 1 || quantity > 60) {
            errors.push({ line: trimmed, error: 'Invalid quantity (must be 1-60)' })
          } else {
            errors.push({ line: trimmed, error: 'Missing card name' })
          }
        }
      } else {
        errors.push({ line: trimmed, error: 'Line does not match expected format "quantity Name" or "quantity x Name"' })
      }
    }

    // Check for Riftbound-specific cards
    const hasRunes = lines.some(l => l.toLowerCase().includes('rune'))
    const hasBattlefields = lines.some(l => /battlefield|grove|monastery|hillock|windswept|temple|sanctuary|citadel/i.test(l))

    if (!hasRunes && !hasBattlefields) {
      errors.push({ line: '', error: 'Riftbound decks should contain Rune and/or Battlefield cards' })
    }
  }

  const isValid = errors.length === 0

  log.info(MODULE, `Input Validation: ${isValid ? 'Valid' : 'Invalid'} (${validLines}/${totalLines} lines valid, ${errors.length} errors)`)

  return {
    isValid,
    errors,
    inputFormat,
    stats: {
      validLines,
      totalLines
    }
  }
}

/**
 * STEP 3: parseCards() - Extract Card Data
 *
 * Extracts all card information from validated input
 * Handles different formats (TCG Live, Pocket, Riftbound)
 * Combines duplicate cards automatically
 *
 * @param {string} text - Raw deck string
 * @param {string} tcg - TCG type
 * @param {string} inputFormat - Detected input format
 * @returns {object} { cards: [], errors: [] }
 */
export function parseCards(text, tcg, inputFormat) {
  if (inputFormat === 'pokemon-tcg-live') {
    return parsePokemonTCGLive(text)
  } else if (inputFormat === 'pokemon-tcg-pocket') {
    return parsePokemonTCGPocket(text)
  } else if (inputFormat === 'riftbound') {
    return parseRiftbound(text)
  } else {
    return parseGeneric(text)
  }
}

/**
 * Parse Pokemon TCG Live format
 * Format has section headers like "Pokémon: 12" or "Pokemon:"
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
    const match = trimmed.match(/^(\d+)\s+(.+)$/)
    if (match) {
      const quantity = parseInt(match[1])
      const cardPart = match[2].trim()

      if (quantity > 0 && quantity <= 60 && cardPart) {
        // Try to extract set code and number from the end
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

  log.info(MODULE, `Parsed ${cards.length} unique cards from Pokemon TCG Live format`)
  return { cards, errors }
}

/**
 * Parse Pokemon TCG Pocket format
 * Format: "Card Name x2" or "Card Name (Set) x2"
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

  log.info(MODULE, `Parsed ${cards.length} unique cards from Pokemon Pocket format`)
  return { cards, errors }
}

/**
 * Parse Riftbound format (tcg-arena.fr style)
 * Format: "1 Leona, Determined" or "3 x Clockwork Keeper"
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

        // Detect card type from name (basic detection, will be enriched later)
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

  log.info(MODULE, `Parsed ${cards.length} unique cards from Riftbound format`)
  return { cards, errors }
}

/**
 * Parse generic format (fallback)
 * Tries to detect "quantity + card reference" patterns
 */
function parseGeneric(text) {
  const lines = text.trim().split('\n')
  const cards = []
  const errors = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue

    // Try various patterns
    let match = trimmed.match(/^(\d+)\s+(.+)$/)

    // Pattern 2: "Card Name x4"
    if (!match) {
      match = trimmed.match(/^(.+?)\s*x\s*(\d+)$/i)
      if (match) {
        match = [match[0], match[2], match[1]] // Swap groups
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

  log.info(MODULE, `Parsed ${cards.length} unique cards from generic format`)
  return { cards, errors }
}

/**
 * Detect Pokemon format based on deck composition
 * (Used in validateDeck step)
 */
export function detectPokemonFormat(cards) {
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
 * (Used in validateDeck step)
 */
export function detectRiftboundFormat(cards) {
  const runes = cards.filter(c => c.name?.toLowerCase().includes('rune'))
  const battlefields = cards.filter(c => /battlefield|grove|monastery|hillock|windswept|temple|sanctuary|citadel/i.test(c.name || ''))

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
 * (Used after categorizeCards step)
 */
export function calculateBreakdown(cards, tcg) {
  if (tcg === 'pokemon') {
    const breakdown = {
      pokemon: 0,
      basic: 0,
      evolution: 0,
      trainer: 0,
      energy: 0,
      unknown: 0
    }

    cards.forEach(card => {
      const supertype = card.supertype?.toLowerCase()
      if (supertype === 'pokémon' || supertype === 'pokemon') {
        breakdown.pokemon += card.quantity

        // Check if Basic or Evolution
        if (isBasicPokemon(card)) {
          breakdown.basic += card.quantity
        } else {
          breakdown.evolution += card.quantity
        }
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
      const cardType = card.type || card.cardType

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
 * Main parsing function with new 5-step flow
 *
 * @param {string} deckString - Raw deck input
 * @returns {object} Complete parsing result with all steps
 */
export function parseDeckString(deckString) {
  if (!deckString || typeof deckString !== 'string') {
    return {
      success: false,
      error: 'No deck string provided',
      tcg: null,
      format: null,
      inputFormat: null,
      inputValidation: {
        isValid: false,
        errors: [{ line: '', error: 'No deck string provided' }],
        inputFormat: 'unknown',
        stats: { validLines: 0, totalLines: 0 }
      },
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
      inputFormat: null,
      inputValidation: {
        isValid: false,
        errors: [{ line: '', error: 'Empty deck string' }],
        inputFormat: 'unknown',
        stats: { validLines: 0, totalLines: 0 }
      },
      cards: [],
      errors: []
    }
  }

  // STEP 1: Check TCG (Pokemon vs Riftbound)
  const tcgDetection = checkTCG(text)
  const { tcg, confidence: tcgConfidence, reasons: tcgReasons } = tcgDetection

  // STEP 2: Validate Input Format
  const validation = validateInput(text, tcg)
  if (!validation.isValid) {
    log.warn(MODULE, `Input validation failed: ${validation.errors.length} errors`)
    // Continue anyway to show errors to user
  }

  // STEP 3: Parse Cards
  const parseResult = parseCards(text, tcg, validation.inputFormat)
  const { cards, errors: parseErrors } = parseResult

  if (cards.length === 0) {
    return {
      success: false,
      error: 'Could not parse any cards from the input',
      tcg,
      tcgConfidence,
      tcgReasons,
      format: null,
      inputFormat: validation.inputFormat,
      inputValidation: validation,
      cards: [],
      errors: [...validation.errors, ...parseErrors]
    }
  }

  // Calculate basic stats
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  const uniqueCards = cards.length

  // Detect format (will be refined after enrichment in controller)
  const formatInfo = tcg === 'riftbound'
    ? detectRiftboundFormat(cards)
    : detectPokemonFormat(cards)

  // Calculate breakdown (will be recalculated after enrichment in controller)
  const breakdown = calculateBreakdown(cards, tcg)

  log.info(MODULE, `Parsed ${uniqueCards} unique cards (${totalCards} total) - TCG: ${tcg}, Format: ${formatInfo.format}`)

  return {
    success: true,
    tcg,
    tcgConfidence,
    tcgReasons,
    format: formatInfo.format,
    formatConfidence: formatInfo.confidence,
    formatReason: formatInfo.reason,
    inputFormat: validation.inputFormat,
    inputValidation: validation,
    cards: cards.map(c => ({
      cardId: c.cardId,
      name: c.name,
      quantity: c.quantity,
      setCode: c.setCode || null,
      setNumber: c.setNumber || null,
      supertype: c.supertype || null,
      cardType: c.cardType || null
    })),
    breakdown,
    stats: {
      totalCards,
      uniqueCards,
      validLines: validation.stats.validLines,
      totalLines: validation.stats.totalLines
    },
    errors: [...validation.errors, ...parseErrors]
  }
}

export default {
  parseDeckString,
  checkTCG,
  validateInput,
  parseCards,
  calculateBreakdown,
  detectPokemonFormat,
  detectRiftboundFormat
}

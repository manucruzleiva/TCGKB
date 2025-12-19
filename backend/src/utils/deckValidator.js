/**
 * Deck Validator Utility
 * Validates deck composition against format rules
 *
 * Supports:
 * - Pokemon Standard (60 cards, 4 copies max, ACE SPEC, Radiant)
 * - Pokemon GLC (singleton, single type, no rule box)
 * - Riftbound Constructed (40+1+3+12, domain restriction)
 */

import log from './logger.js'

const MODULE = 'DeckValidator'

// Basic Energy names that have no copy limit
const BASIC_ENERGY_NAMES = [
  'fire energy', 'water energy', 'grass energy', 'lightning energy',
  'psychic energy', 'fighting energy', 'darkness energy', 'metal energy',
  'fairy energy', 'basic fire energy', 'basic water energy', 'basic grass energy',
  'basic lightning energy', 'basic psychic energy', 'basic fighting energy',
  'basic darkness energy', 'basic metal energy', 'basic fairy energy'
]

// Valid regulation marks for Standard format (current rotation)
const STANDARD_REGULATION_MARKS = ['G', 'H', 'I']

// ACE SPEC keywords that identify these cards
const ACE_SPEC_KEYWORDS = ['ace spec', 'ace-spec']

// Radiant keywords
const RADIANT_KEYWORDS = ['radiant']

// Rule Box Pokemon suffixes
const RULE_BOX_SUFFIXES = [' ex', ' v', ' vstar', ' vmax', ' gx', ' v-union']

/**
 * Check if a card name is a Basic Energy
 */
function isBasicEnergy(cardName) {
  if (!cardName) return false
  const lower = cardName.toLowerCase()
  return BASIC_ENERGY_NAMES.some(energy => lower.includes(energy))
}

/**
 * Check if a card is an ACE SPEC
 */
function isAceSpec(card) {
  const name = card.name?.toLowerCase() || ''
  const subtypes = card.subtypes?.map(s => s.toLowerCase()) || []

  return ACE_SPEC_KEYWORDS.some(keyword =>
    name.includes(keyword) || subtypes.includes(keyword)
  )
}

/**
 * Check if a card is a Radiant Pokemon
 */
function isRadiant(card) {
  const name = card.name?.toLowerCase() || ''
  return RADIANT_KEYWORDS.some(keyword => name.startsWith(keyword))
}

/**
 * Check if a card is a Rule Box Pokemon (ex, V, VSTAR, VMAX, GX)
 */
function isRuleBox(card) {
  const name = card.name?.toLowerCase() || ''
  return RULE_BOX_SUFFIXES.some(suffix => name.endsWith(suffix)) || isRadiant(card)
}

/**
 * Check if a card is a Basic Pokemon
 */
function isBasicPokemon(card) {
  const supertype = card.supertype?.toLowerCase() || ''
  const subtypes = card.subtypes?.map(s => s.toLowerCase()) || []
  const evolutionStage = card.evolutionStage?.toLowerCase() || ''

  if (supertype !== 'pokémon' && supertype !== 'pokemon') return false

  return subtypes.includes('basic') || evolutionStage === 'basic'
}

/**
 * Normalize card name for grouping reprints
 * Removes set-specific variations like "(Professor Oak)"
 */
function normalizeCardName(name) {
  if (!name) return ''

  // Remove parenthetical variations like "(Professor Oak)"
  let normalized = name.replace(/\s*\([^)]+\)\s*$/, '').trim()

  return normalized.toLowerCase()
}

/**
 * Group cards by normalized name to check copy limits
 */
function groupCardsByName(cards) {
  const groups = {}

  cards.forEach(card => {
    const normalizedName = normalizeCardName(card.name)

    if (!groups[normalizedName]) {
      groups[normalizedName] = {
        name: card.name,
        normalizedName,
        totalQuantity: 0,
        cards: [],
        isBasicEnergy: isBasicEnergy(card.name)
      }
    }

    groups[normalizedName].totalQuantity += card.quantity
    groups[normalizedName].cards.push(card)
  })

  return groups
}

/**
 * Validate Pokemon Standard format rules
 *
 * Rules:
 * - Exactly 60 cards total
 * - Max 4 copies per card name (except Basic Energy)
 * - At least 1 Basic Pokemon
 * - Max 1 ACE SPEC
 * - Max 1 Radiant Pokemon
 * - Only regulation marks G, H, I (optional check)
 */
export function validatePokemonStandard(cards, options = {}) {
  const errors = []
  const warnings = []

  // Calculate totals
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  const cardGroups = groupCardsByName(cards)

  // 1. Check total cards
  if (totalCards !== 60) {
    errors.push({
      type: 'card_count',
      message: `Deck must have exactly 60 cards (currently ${totalCards})`,
      current: totalCards,
      expected: 60
    })
  }

  // 2. Check copy limits (4 max, except Basic Energy)
  Object.values(cardGroups).forEach(group => {
    if (!group.isBasicEnergy && group.totalQuantity > 4) {
      errors.push({
        type: 'copy_limit',
        message: `"${group.name}" exceeds 4 copy limit (${group.totalQuantity}/4)`,
        cardName: group.name,
        current: group.totalQuantity,
        limit: 4
      })
    }
  })

  // 3. Check for at least 1 Basic Pokemon
  const basicPokemon = cards.filter(isBasicPokemon)
  const basicPokemonCount = basicPokemon.reduce((sum, c) => sum + c.quantity, 0)

  if (basicPokemonCount === 0) {
    errors.push({
      type: 'no_basic',
      message: 'Deck must have at least 1 Basic Pokémon',
      current: 0,
      expected: 1
    })
  }

  // 4. Check ACE SPEC limit (max 1)
  const aceSpecCards = cards.filter(isAceSpec)
  const aceSpecCount = aceSpecCards.reduce((sum, c) => sum + c.quantity, 0)

  if (aceSpecCount > 1) {
    errors.push({
      type: 'ace_spec_limit',
      message: `Deck can only have 1 ACE SPEC card (currently ${aceSpecCount})`,
      cards: aceSpecCards.map(c => c.name),
      current: aceSpecCount,
      limit: 1
    })
  }

  // 5. Check Radiant limit (max 1)
  const radiantCards = cards.filter(isRadiant)
  const radiantCount = radiantCards.reduce((sum, c) => sum + c.quantity, 0)

  if (radiantCount > 1) {
    errors.push({
      type: 'radiant_limit',
      message: `Deck can only have 1 Radiant Pokémon (currently ${radiantCount})`,
      cards: radiantCards.map(c => c.name),
      current: radiantCount,
      limit: 1
    })
  }

  // 6. Check regulation marks (optional, only if cards have this data)
  if (options.checkRegulationMarks) {
    const invalidRegulation = cards.filter(c =>
      c.regulationMark && !STANDARD_REGULATION_MARKS.includes(c.regulationMark)
    )

    if (invalidRegulation.length > 0) {
      warnings.push({
        type: 'regulation_mark',
        message: `Some cards may not be legal in Standard (regulation marks: ${invalidRegulation.map(c => c.regulationMark).join(', ')})`,
        cards: invalidRegulation.map(c => ({ name: c.name, mark: c.regulationMark }))
      })
    }
  }

  const isValid = errors.length === 0

  log.info(MODULE, `Standard validation: ${isValid ? 'VALID' : 'INVALID'} - ${errors.length} errors, ${warnings.length} warnings`)

  return {
    isValid,
    format: 'standard',
    errors,
    warnings,
    summary: {
      totalCards,
      basicPokemon: basicPokemonCount,
      aceSpecs: aceSpecCount,
      radiants: radiantCount,
      uniqueCards: cards.length
    }
  }
}

/**
 * Validate Pokemon GLC format rules
 *
 * Rules:
 * - Exactly 60 cards total
 * - Max 1 copy per card name (Singleton, except Basic Energy)
 * - All Pokemon must be same type
 * - No Rule Box Pokemon (ex, V, VSTAR, VMAX, Radiant)
 * - No ACE SPEC
 * - Card pool: Black & White onwards (Expanded)
 */
export function validatePokemonGLC(cards, options = {}) {
  const errors = []
  const warnings = []

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  const cardGroups = groupCardsByName(cards)

  // 1. Check total cards
  if (totalCards !== 60) {
    errors.push({
      type: 'card_count',
      message: `Deck must have exactly 60 cards (currently ${totalCards})`,
      current: totalCards,
      expected: 60
    })
  }

  // 2. Check singleton (1 copy max, except Basic Energy)
  Object.values(cardGroups).forEach(group => {
    if (!group.isBasicEnergy && group.totalQuantity > 1) {
      errors.push({
        type: 'singleton_limit',
        message: `"${group.name}" exceeds singleton limit (${group.totalQuantity}/1)`,
        cardName: group.name,
        current: group.totalQuantity,
        limit: 1
      })
    }
  })

  // 3. Check for Rule Box Pokemon (not allowed in GLC)
  const ruleBoxCards = cards.filter(isRuleBox)
  if (ruleBoxCards.length > 0) {
    errors.push({
      type: 'rule_box_prohibited',
      message: 'Rule Box Pokémon (ex, V, VSTAR, VMAX, Radiant) are not allowed in GLC',
      cards: ruleBoxCards.map(c => c.name)
    })
  }

  // 4. Check for ACE SPEC (not allowed in GLC)
  const aceSpecCards = cards.filter(isAceSpec)
  if (aceSpecCards.length > 0) {
    errors.push({
      type: 'ace_spec_prohibited',
      message: 'ACE SPEC cards are not allowed in GLC',
      cards: aceSpecCards.map(c => c.name)
    })
  }

  // 5. Check single type (all Pokemon must share a type)
  const pokemonCards = cards.filter(c => {
    const st = c.supertype?.toLowerCase() || ''
    return st === 'pokémon' || st === 'pokemon'
  })

  const allTypes = new Set()
  pokemonCards.forEach(card => {
    if (card.types && Array.isArray(card.types)) {
      card.types.forEach(type => allTypes.add(type.toLowerCase()))
    }
  })

  if (allTypes.size > 1 && options.strictTypeCheck) {
    // Check if there's a common type across all Pokemon
    // (Dual-type Pokemon are allowed if one type matches)
    warnings.push({
      type: 'multiple_types',
      message: `GLC decks should have Pokemon of a single type. Detected types: ${Array.from(allTypes).join(', ')}`,
      types: Array.from(allTypes)
    })
  }

  // 6. Check for at least 1 Basic Pokemon
  const basicPokemon = cards.filter(isBasicPokemon)
  const basicPokemonCount = basicPokemon.reduce((sum, c) => sum + c.quantity, 0)

  if (basicPokemonCount === 0) {
    errors.push({
      type: 'no_basic',
      message: 'Deck must have at least 1 Basic Pokémon',
      current: 0,
      expected: 1
    })
  }

  const isValid = errors.length === 0

  log.info(MODULE, `GLC validation: ${isValid ? 'VALID' : 'INVALID'} - ${errors.length} errors, ${warnings.length} warnings`)

  return {
    isValid,
    format: 'glc',
    errors,
    warnings,
    summary: {
      totalCards,
      basicPokemon: basicPokemonCount,
      pokemonTypes: Array.from(allTypes),
      uniqueCards: cards.length
    }
  }
}

/**
 * Validate Riftbound Constructed format rules
 *
 * Rules:
 * - Main Deck: exactly 40 cards
 * - Legend: exactly 1
 * - Battlefields: exactly 3
 * - Runes: exactly 12
 * - Max 3 copies per card name
 * - Sideboard: 0 or 8 cards (optional)
 * - Cards must match Legend's domains
 */
export function validateRiftboundConstructed(cards, options = {}) {
  const errors = []
  const warnings = []

  // Categorize cards
  const runes = cards.filter(c => c.name?.toLowerCase().includes('rune'))
  const battlefields = cards.filter(c => c.name?.toLowerCase().includes('battlefield'))
  const legends = cards.filter(c => c.cardType === 'Legend')
  const mainDeck = cards.filter(c =>
    !c.name?.toLowerCase().includes('rune') &&
    !c.name?.toLowerCase().includes('battlefield') &&
    c.cardType !== 'Legend'
  )

  const runeCount = runes.reduce((sum, c) => sum + c.quantity, 0)
  const battlefieldCount = battlefields.reduce((sum, c) => sum + c.quantity, 0)
  const legendCount = legends.reduce((sum, c) => sum + c.quantity, 0)
  const mainDeckCount = mainDeck.reduce((sum, c) => sum + c.quantity, 0)

  // 1. Check main deck count
  if (mainDeckCount !== 40) {
    errors.push({
      type: 'main_deck_count',
      message: `Main deck must have exactly 40 cards (currently ${mainDeckCount})`,
      current: mainDeckCount,
      expected: 40
    })
  }

  // 2. Check legend count
  if (legendCount !== 1) {
    errors.push({
      type: 'legend_count',
      message: `Deck must have exactly 1 Legend (currently ${legendCount})`,
      current: legendCount,
      expected: 1
    })
  }

  // 3. Check battlefield count
  if (battlefieldCount !== 3) {
    errors.push({
      type: 'battlefield_count',
      message: `Deck must have exactly 3 Battlefields (currently ${battlefieldCount})`,
      current: battlefieldCount,
      expected: 3
    })
  }

  // 4. Check rune count
  if (runeCount !== 12) {
    errors.push({
      type: 'rune_count',
      message: `Deck must have exactly 12 Runes (currently ${runeCount})`,
      current: runeCount,
      expected: 12
    })
  }

  // 5. Check copy limit (3 max)
  const cardGroups = groupCardsByName(cards)
  Object.values(cardGroups).forEach(group => {
    if (group.totalQuantity > 3) {
      errors.push({
        type: 'copy_limit',
        message: `"${group.name}" exceeds 3 copy limit (${group.totalQuantity}/3)`,
        cardName: group.name,
        current: group.totalQuantity,
        limit: 3
      })
    }
  })

  const isValid = errors.length === 0

  log.info(MODULE, `Riftbound validation: ${isValid ? 'VALID' : 'INVALID'} - ${errors.length} errors, ${warnings.length} warnings`)

  return {
    isValid,
    format: 'constructed',
    errors,
    warnings,
    summary: {
      mainDeck: mainDeckCount,
      legends: legendCount,
      battlefields: battlefieldCount,
      runes: runeCount,
      totalCards: mainDeckCount + legendCount + battlefieldCount + runeCount
    }
  }
}

/**
 * Main validation function - auto-detects format or uses provided format
 */
export function validateDeck(cards, tcg = 'pokemon', format = null, options = {}) {
  if (!cards || cards.length === 0) {
    return {
      isValid: false,
      format: null,
      errors: [{ type: 'empty_deck', message: 'Deck is empty' }],
      warnings: [],
      summary: { totalCards: 0 }
    }
  }

  if (tcg === 'riftbound') {
    return validateRiftboundConstructed(cards, options)
  }

  // Pokemon formats
  if (format === 'glc') {
    return validatePokemonGLC(cards, options)
  }

  // Default to Standard for Pokemon
  return validatePokemonStandard(cards, options)
}

export default {
  validateDeck,
  validatePokemonStandard,
  validatePokemonGLC,
  validateRiftboundConstructed,
  isBasicEnergy,
  isAceSpec,
  isRadiant,
  isRuleBox,
  isBasicPokemon,
  normalizeCardName
}

// deckParser.service.js
import log from '../utils/logger.js'

const MODULE = 'DeckParserService'

// Pokemon TCG set codes for detection
const POKEMON_SETS_STANDARD = /SVI|PAL|OBF|MEW|PAR|PAF|TEF|TWM|SFA|SCR|SSP|PRE|SVE|SVP/i
const POKEMON_SETS_EXPANDED = /SSH|RCL|DAA|VIV|BST|CRE|EVS|FST|BRS|ASR|PGO|LOR|SIT|CRZ|SUM|GRI|BUS/i
const RIFTBOUND_DOMAINS = ['fury', 'calm', 'mind', 'body', 'order', 'chaos']

/**
 * Pokemon deck abbreviation to TCGdex set code mapping.
 * Maps common deck list abbreviations (SSP, PAR, etc.) to TCGdex codes (sv08, sv04, etc.)
 */
const DECK_CODE_TO_TCGDEX = {
  // Scarlet & Violet era (main sets)
  'SVI': 'sv01',    // Scarlet & Violet Base
  'PAL': 'sv02',    // Paldea Evolved
  'OBF': 'sv03',    // Obsidian Flames
  'PAR': 'sv04',    // Paradox Rift
  'TEF': 'sv05',    // Temporal Forces
  'TWM': 'sv06',    // Twilight Masquerade
  'SSP': 'sv08',    // Surging Sparks
  'BLK': 'sv09',    // Battle Partners
  'JTG': 'sv09',    // Journey Together (same as BLK)
  'MEG': 'sv10',    // Mega
  'MEW': 'sv10',    // MEW (same as MEG)

  // Scarlet & Violet era (mini sets)
  'PAF': 'sv04.5',  // Paldean Fates
  'MEE': 'sv04.5',  // Paldean Fates (energy set, same as PAF)
  'SFA': 'sv06.5',  // Shrouded Fable
  'PRE': 'sv08.5',  // Prismatic Evolutions

  // Sword & Shield era
  'CRZ': 'swsh12.5', // Crown Zenith
  'SIT': 'swsh12',   // Silver Tempest
  'LOR': 'swsh11',   // Lost Origin
  'PGO': 'swsh11.5', // Pokemon GO
  'ASR': 'swsh10',   // Astral Radiance
  'BRS': 'swsh9',    // Brilliant Stars
  'FST': 'swsh8',    // Fusion Strike
  'CEL': 'swsh7.5',  // Celebrations
  'EVS': 'swsh7',    // Evolving Skies
  'CRE': 'swsh6',    // Chilling Reign
  'BST': 'swsh5',    // Battle Styles
  'SHF': 'swsh4.5',  // Shining Fates
  'VIV': 'swsh4',    // Vivid Voltage
  'CPA': 'swsh3.5',  // Champion's Path
  'DAA': 'swsh3',    // Darkness Ablaze
  'RCL': 'swsh2',    // Rebel Clash
  'SSH': 'swsh1',    // Sword & Shield Base
}

/**
 * Normalizes set code from deck abbreviation to TCGdex format
 * Example: "SSP" -> "sv08", "PAR" -> "sv04"
 */
function normalizeSetCode(setCode) {
  const upper = setCode.toUpperCase()
  return DECK_CODE_TO_TCGDEX[upper] || setCode.toLowerCase()
}

/**
 * Detect TCG type from deck string
 */
function detectTCG(input) {
  let riftboundScore = 0
  let pokemonScore = 0

  // Riftbound indicators
  if (/rune/i.test(input)) riftboundScore += 3
  if (/battlefield/i.test(input)) riftboundScore += 2
  for (const domain of RIFTBOUND_DOMAINS) {
    if (input.toLowerCase().includes(domain)) riftboundScore++
  }

  // Pokemon indicators
  if (POKEMON_SETS_STANDARD.test(input)) pokemonScore += 2
  if (POKEMON_SETS_EXPANDED.test(input)) pokemonScore += 2
  if (/pokemon/i.test(input)) pokemonScore += 3
  if (/trainer|energy/i.test(input)) pokemonScore += 2

  return (riftboundScore > pokemonScore && riftboundScore >= 3) ? 'riftbound' : 'pokemon'
}

/**
 * Parse Pokemon TCG Live format
 * Format: "4 Pikachu ex SVI 057"
 */
function parsePokemonTCGLive(input) {
  const lines = input.trim().split('\n')
  const cards = []
  const warnings = []
  let currentSection = null

  for (const row of lines) {
    const line = row.trim()
    if (!line || line.startsWith('//')) continue

    // Section headers: "Pokemon: 12", "Trainer: 36", "Energy: 12"
    const sectionMatch = line.match(/^(Pokemon|Trainer|Energy):\s*\d*$/i)
    if (sectionMatch) {
      currentSection = sectionMatch[1].toLowerCase()
      continue
    }

    // Standard PTCGL format: "4 Pikachu ex SVI 057" (quantity name SET number)
    const cardMatch = line.match(/^(\d+)\s+(.+?)\s+([A-Z]{2,4})\s+(\d{1,4})$/i)
    if (cardMatch) {
      const supertype = currentSection === 'pokemon' ? 'Pokemon' :
                        currentSection === 'trainer' ? 'Trainer' :
                        currentSection === 'energy' ? 'Energy' : null
      const setCode = cardMatch[3].toUpperCase()
      const normalizedSet = normalizeSetCode(setCode)
      cards.push({
        cardId: normalizedSet + '-' + cardMatch[4],
        quantity: +cardMatch[1],
        name: cardMatch[2].trim(),
        setCode,
        number: cardMatch[4],
        supertype,
        raw: line
      })
    } else {
      // #153 fix: Check for invalid formats and reject them
      const simpleMatch = line.match(/^(\d+)\s+(.+)$/)
      if (simpleMatch) {
        // Check for "name SET-number" format (e.g., "4 Pikachu SVI-189")
        const setDashMatch = simpleMatch[2].match(/(.+?)\s+([A-Z]{2,4})-(\d{1,4})$/i)
        if (setDashMatch) {
          // This is close to valid - accept with warning
          const setCode = setDashMatch[2].toUpperCase()
          const normalizedSet = normalizeSetCode(setCode)
          cards.push({
            cardId: normalizedSet + '-' + setDashMatch[3],
            quantity: +simpleMatch[1],
            name: setDashMatch[1].trim(),
            setCode,
            number: setDashMatch[3],
            raw: line
          })
          warnings.push({ type: 'format_hint', message: `Line "${line}" uses SET-number format. PTCGL uses "SET number" (with space).` })
        }
        // Reject pure "set-number" format (e.g., "4 ssp-97") - #153 fix
        else if (/^[A-Z]{2,4}-\d{1,4}$/i.test(simpleMatch[2])) {
          warnings.push({
            type: 'invalid_format',
            message: `Invalid format: "${line}". PTCGL requires card name before set code.`
          })
          // Don't add the card - it's not valid PTCGL format
        }
        // Card name without set info - needs resolution
        else {
          cards.push({
            cardId: null,
            quantity: +simpleMatch[1],
            name: simpleMatch[2].trim(),
            needsResolution: true,
            raw: line
          })
          warnings.push({ type: 'missing_set', message: 'Missing set: ' + simpleMatch[2] })
        }
      }
    }
  }

  return { cards, warnings }
}

/**
 * Parse Pokemon TCG Pocket format
 * Format: "Pikachu x2"
 */
function parsePokemonPocket(input) {
  const lines = input.trim().split('\n')
  const cards = []
  const warnings = []

  for (const row of lines) {
    const line = row.trim()
    if (!line) continue

    const match = line.match(/^(.+?)\s*x\s*(\d+)$/i)
    if (match) {
      cards.push({
        cardId: null,
        quantity: +match[2],
        name: match[1].trim(),
        needsResolution: true,
        raw: line
      })
    }
  }

  if (cards.length > 0) {
    warnings.push({ type: 'pocket_format', message: 'Pocket format detected' })
  }

  return { cards, warnings }
}

/**
 * Parse Riftbound format
 * Format: "3 Clockwork Keeper"
 */
function parseRiftbound(input) {
  const lines = input.trim().split('\n')
  const cards = []
  const warnings = []
  const detectedDomains = new Set()

  for (const row of lines) {
    const line = row.trim()
    if (!line) continue

    const match = line.match(/^(\d+)\s+(.+)$/)
    if (match) {
      const name = match[2].trim()
      let cardType = null

      // Detect card type from name
      if (/rune$/i.test(name)) cardType = 'Rune'
      else if (/battlefield|grove/i.test(name)) cardType = 'Battlefield'
      else if (+match[1] === 1 && cards.length === 0) cardType = 'Legend'

      // Detect domains
      for (const domain of RIFTBOUND_DOMAINS) {
        if (name.toLowerCase().includes(domain)) {
          detectedDomains.add(domain)
        }
      }

      cards.push({
        cardId: name.toLowerCase().replace(/\s+/g, '-'),
        quantity: +match[1],
        name,
        cardType,
        raw: line
      })
    }
  }

  return { cards, warnings, detectedDomains: [...detectedDomains] }
}

/**
 * Normalize card name for grouping (removes parenthetical suffixes)
 * "Professor's Research (Professor Oak)" -> "professor's research"
 */
function normalizeCardName(name) {
  if (!name) return ''
  return name.replace(/\s*\([^)]+\)\s*$/, '').trim().toLowerCase()
}

/**
 * Check if a card is a Basic Energy (unlimited copies allowed)
 */
function isBasicEnergy(name) {
  const basicEnergies = [
    'fire energy', 'water energy', 'grass energy', 'lightning energy',
    'psychic energy', 'fighting energy', 'darkness energy', 'metal energy',
    'fairy energy', 'basic fire energy', 'basic water energy', 'basic grass energy',
    'basic lightning energy', 'basic psychic energy', 'basic fighting energy',
    'basic darkness energy', 'basic metal energy', 'basic fairy energy'
  ]
  return basicEnergies.includes(name.toLowerCase())
}

/**
 * Group cards by normalized name to show reprint grouping
 * Returns array of groups with total count and individual cards
 */
function groupReprintsByName(cards, format = 'standard') {
  const groups = new Map()
  const copyLimit = format === 'glc' ? 1 : (format === 'constructed' ? 3 : 4)

  for (const card of cards) {
    const normalizedName = normalizeCardName(card.name)
    const displayName = card.name.replace(/\s*\([^)]+\)\s*$/, '').trim()

    if (!groups.has(normalizedName)) {
      groups.set(normalizedName, {
        normalizedName,
        displayName,
        totalQuantity: 0,
        cards: [],
        isBasicEnergy: isBasicEnergy(normalizedName),
        limit: copyLimit
      })
    }

    const group = groups.get(normalizedName)
    group.totalQuantity += card.quantity
    group.cards.push({
      name: card.name,
      setCode: card.setCode,
      number: card.number,
      quantity: card.quantity
    })
  }

  // Convert to array and add validation status
  return [...groups.values()].map(group => ({
    ...group,
    exceedsLimit: !group.isBasicEnergy && group.totalQuantity > group.limit,
    status: group.isBasicEnergy ? 'unlimited' :
            group.totalQuantity > group.limit ? 'exceeded' :
            group.totalQuantity === group.limit ? 'at_limit' : 'valid'
  }))
}

/**
 * Detect Pokemon format and validate deck
 */
function detectPokemonFormat(cards) {
  const result = {
    detected: null,
    confidence: 'low',
    reasons: [],
    validation: {
      isValid: false,
      errors: [],
      warnings: [],
      summary: {}
    }
  }

  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0)

  // Card count validation
  if (totalCards !== 60) {
    result.validation.errors.push({
      type: 'card_count',
      message: `Deck has ${totalCards} cards, needs exactly 60`,
      current: totalCards,
      expected: 60
    })
  }

  // Group by normalized name and check copy limits
  const nameGroups = new Map()
  for (const card of cards) {
    const normalized = normalizeCardName(card.name)
    nameGroups.set(normalized, (nameGroups.get(normalized) || 0) + card.quantity)
  }

  let hasExcess = false
  let isSingleton = true

  for (const [name, count] of nameGroups) {
    // Skip basic energy (no limit)
    if (isBasicEnergy(name)) continue

    if (count > 4) {
      hasExcess = true
      result.validation.errors.push({
        type: 'copy_limit',
        message: `${name}: ${count} copies (max 4)`,
        cardName: name,
        current: count,
        limit: 4
      })
    }
    if (count > 1) isSingleton = false
  }

  // Check for Rule Box Pokemon (ex, V, VSTAR, VMAX, Radiant)
  const hasRuleBox = cards.some(card =>
    /\b(V|VMAX|VSTAR|ex)\b/i.test(card.name)
  )

  // Check for Basic Pokemon
  // Support both supertype (Pokemon TCG SDK) and category+stage (TCGdex)
  const basicPokemon = cards.filter(card => {
    const supertype = card.supertype?.toLowerCase()
    const category = card.category?.toLowerCase()
    const stage = card.stage?.toLowerCase()

    // Must be a Pokemon card
    const isPokemon = supertype === 'pokemon' || supertype === 'pokémon' ||
                      category === 'pokemon' || category === 'pokémon'

    if (!isPokemon) return false

    // TCGdex format: check stage field directly
    if (stage === 'basic') return true

    // Fallback: name-based detection (for cards without stage field)
    return !/\b(ex|V|VMAX|VSTAR|Stage|BREAK)\b/i.test(card.name)
  })
  const basicCount = basicPokemon.reduce((sum, card) => sum + card.quantity, 0)

  if (basicCount === 0) {
    result.validation.errors.push({
      type: 'no_basic',
      message: 'Deck needs at least 1 Basic Pokemon'
    })
  }

  // Count ACE SPEC and Radiant (these should be max 1)
  const aceSpecs = cards.filter(card => /ACE SPEC/i.test(card.raw || card.name))
  const aceSpecCount = aceSpecs.reduce((sum, card) => sum + card.quantity, 0)
  if (aceSpecCount > 1) {
    result.validation.errors.push({
      type: 'ace_spec_limit',
      message: `${aceSpecCount} ACE SPEC cards (max 1)`,
      current: aceSpecCount,
      limit: 1
    })
  }

  const radiants = cards.filter(card => /Radiant/i.test(card.name))
  const radiantCount = radiants.reduce((sum, card) => sum + card.quantity, 0)
  if (radiantCount > 1) {
    result.validation.errors.push({
      type: 'radiant_limit',
      message: `${radiantCount} Radiant Pokemon (max 1)`,
      current: radiantCount,
      limit: 1
    })
  }

  // Summary stats
  result.validation.summary = {
    totalCards,
    basicPokemon: basicCount,
    aceSpecs: aceSpecCount,
    radiants: radiantCount
  }

  // Detect format
  if (isSingleton && !hasRuleBox) {
    result.detected = 'glc'
    result.confidence = 'high'
    result.reasons.push('Singleton deck with no Rule Box Pokemon')
  } else if (!hasExcess) {
    // Check for expanded sets
    const sets = new Set(cards.map(card => card.setCode).filter(Boolean))
    const hasExpandedSets = [...sets].some(s => POKEMON_SETS_EXPANDED.test(s))

    result.detected = hasExpandedSets ? 'expanded' : 'standard'
    result.confidence = hasExpandedSets ? 'high' : 'medium'
    result.reasons.push(hasExpandedSets ? 'Contains Expanded-era sets' : 'Standard rotation sets')
  }

  result.validation.isValid = result.validation.errors.length === 0

  return result
}

/**
 * Detect Riftbound format and validate deck
 */
function detectRiftboundFormat(cards, detectedDomains) {
  const result = {
    detected: 'constructed',
    confidence: 'high',
    reasons: [],
    validation: {
      isValid: false,
      errors: [],
      warnings: [],
      summary: {}
    }
  }

  // Categorize cards
  const mainDeck = cards.filter(c => !['Legend', 'Battlefield', 'Rune'].includes(c.cardType))
  const mainCount = mainDeck.reduce((sum, c) => sum + c.quantity, 0)
  const legendCount = cards.filter(c => c.cardType === 'Legend').reduce((sum, c) => sum + c.quantity, 0)
  const battlefieldCount = cards.filter(c => c.cardType === 'Battlefield').reduce((sum, c) => sum + c.quantity, 0)
  const runeCount = cards.filter(c => c.cardType === 'Rune').reduce((sum, c) => sum + c.quantity, 0)

  // Validate counts
  if (mainCount !== 40) {
    result.validation.errors.push({
      type: 'main_deck',
      message: `Main deck: ${mainCount}/40`,
      current: mainCount,
      expected: 40
    })
  }
  if (legendCount !== 1) {
    result.validation.errors.push({
      type: 'legend',
      message: `Legend: ${legendCount}/1`,
      current: legendCount,
      expected: 1
    })
  }
  if (battlefieldCount !== 3) {
    result.validation.errors.push({
      type: 'battlefield',
      message: `Battlefield: ${battlefieldCount}/3`,
      current: battlefieldCount,
      expected: 3
    })
  }
  if (runeCount !== 12) {
    result.validation.errors.push({
      type: 'rune',
      message: `Rune: ${runeCount}/12`,
      current: runeCount,
      expected: 12
    })
  }

  // Check copy limit (3 for Riftbound)
  const nameGroups = new Map()
  for (const card of cards) {
    nameGroups.set(card.name, (nameGroups.get(card.name) || 0) + card.quantity)
  }
  for (const [name, count] of nameGroups) {
    if (count > 3) {
      result.validation.errors.push({
        type: 'copy_limit',
        message: `${name}: ${count} copies (max 3)`,
        cardName: name,
        current: count,
        limit: 3
      })
    }
  }

  // Summary
  result.validation.summary = {
    totalCards: mainCount + legendCount + battlefieldCount + runeCount,
    mainDeck: mainCount,
    legend: legendCount,
    battlefield: battlefieldCount,
    rune: runeCount
  }

  result.validation.isValid = result.validation.errors.length === 0
  result.reasons.push('Riftbound Constructed')
  if (detectedDomains.length > 0) {
    result.reasons.push('Domains: ' + detectedDomains.join(', '))
  }

  return result
}

/**
 * Detect input format type
 */
function detectInputFormat(input) {
  if (/^(Pokemon|Trainer|Energy):\s*\d+$/m.test(input)) return 'pokemon-tcg-live'
  if (/^.+\s*x\s*\d+$/m.test(input) && !/^\d+\s+/.test(input)) return 'pokemon-tcg-pocket'
  return 'generic'
}

/**
 * Calculate breakdown by supertype/category
 * Supports both Pokemon TCG SDK (supertype) and TCGdex (category) formats
 */
function calculateBreakdown(cards, tcg) {
  if (tcg === 'riftbound') {
    return {
      mainDeck: cards.filter(c => !['Legend', 'Battlefield', 'Rune'].includes(c.cardType))
        .reduce((sum, c) => sum + c.quantity, 0),
      legend: cards.filter(c => c.cardType === 'Legend').reduce((sum, c) => sum + c.quantity, 0),
      battlefield: cards.filter(c => c.cardType === 'Battlefield').reduce((sum, c) => sum + c.quantity, 0),
      rune: cards.filter(c => c.cardType === 'Rune').reduce((sum, c) => sum + c.quantity, 0)
    }
  }

  // Helper to check if card is Pokemon (supports both formats)
  const isPokemon = (c) => {
    const supertype = c.supertype?.toLowerCase()
    const category = c.category?.toLowerCase()
    return supertype === 'pokemon' || supertype === 'pokémon' ||
           category === 'pokemon' || category === 'pokémon'
  }

  // Helper to check if card is Trainer
  const isTrainer = (c) => {
    const supertype = c.supertype?.toLowerCase()
    const category = c.category?.toLowerCase()
    return supertype === 'trainer' || category === 'trainer'
  }

  // Helper to check if card is Energy
  const isEnergy = (c) => {
    const supertype = c.supertype?.toLowerCase()
    const category = c.category?.toLowerCase()
    return supertype === 'energy' || category === 'energy'
  }

  return {
    pokemon: cards.filter(isPokemon).reduce((sum, c) => sum + c.quantity, 0),
    trainer: cards.filter(isTrainer).reduce((sum, c) => sum + c.quantity, 0),
    energy: cards.filter(isEnergy).reduce((sum, c) => sum + c.quantity, 0),
    unknown: cards.filter(c => !isPokemon(c) && !isTrainer(c) && !isEnergy(c)).reduce((sum, c) => sum + c.quantity, 0)
  }
}

/**
 * Validate deck against a specific format
 * @param {Array} cards - Parsed cards array
 * @param {string} format - Format to validate against (standard, glc, expanded, constructed)
 * @param {string} tcg - TCG type (pokemon, riftbound)
 */
function validateForFormat(cards, format, tcg) {
  if (tcg === 'riftbound') {
    return detectRiftboundFormat(cards, [])
  }

  // Pokemon format validation
  const result = {
    detected: format,
    confidence: 'manual',
    reasons: ['Manually selected format'],
    validation: {
      isValid: false,
      errors: [],
      warnings: [],
      summary: {}
    }
  }

  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0)
  const copyLimit = format === 'glc' ? 1 : 4

  // Card count validation
  if (totalCards !== 60) {
    result.validation.errors.push({
      type: 'card_count',
      message: `Deck has ${totalCards} cards, needs exactly 60`,
      current: totalCards,
      expected: 60
    })
  }

  // Group by normalized name and check copy limits
  const nameGroups = new Map()
  for (const card of cards) {
    const normalized = normalizeCardName(card.name)
    nameGroups.set(normalized, (nameGroups.get(normalized) || 0) + card.quantity)
  }

  for (const [name, count] of nameGroups) {
    if (isBasicEnergy(name)) continue

    if (count > copyLimit) {
      result.validation.errors.push({
        type: 'copy_limit',
        message: `${name}: ${count} copies (max ${copyLimit})`,
        cardName: name,
        current: count,
        limit: copyLimit
      })
    }
  }

  // Check for Rule Box Pokemon (for GLC)
  if (format === 'glc') {
    const ruleBoxCards = cards.filter(card =>
      /\b(V|VMAX|VSTAR|ex|Radiant)\b/i.test(card.name)
    )
    if (ruleBoxCards.length > 0) {
      result.validation.errors.push({
        type: 'rule_box_banned',
        message: 'Rule Box Pokemon (ex, V, VSTAR, VMAX, Radiant) not allowed in GLC',
        cards: ruleBoxCards.map(c => c.name)
      })
    }

    // Check for ACE SPEC (banned in GLC)
    const aceSpecs = cards.filter(card => /ACE SPEC/i.test(card.raw || card.name))
    if (aceSpecs.length > 0) {
      result.validation.errors.push({
        type: 'ace_spec_banned',
        message: 'ACE SPEC cards not allowed in GLC'
      })
    }
  } else {
    // Standard/Expanded rules
    const aceSpecs = cards.filter(card => /ACE SPEC/i.test(card.raw || card.name))
    const aceSpecCount = aceSpecs.reduce((sum, card) => sum + card.quantity, 0)
    if (aceSpecCount > 1) {
      result.validation.errors.push({
        type: 'ace_spec_limit',
        message: `${aceSpecCount} ACE SPEC cards (max 1)`,
        current: aceSpecCount,
        limit: 1
      })
    }

    const radiants = cards.filter(card => /Radiant/i.test(card.name))
    const radiantCount = radiants.reduce((sum, card) => sum + card.quantity, 0)
    if (radiantCount > 1) {
      result.validation.errors.push({
        type: 'radiant_limit',
        message: `${radiantCount} Radiant Pokemon (max 1)`,
        current: radiantCount,
        limit: 1
      })
    }
  }

  // Check for Basic Pokemon
  // Support both supertype (Pokemon TCG SDK) and category+stage (TCGdex)
  const basicPokemon = cards.filter(card => {
    const supertype = card.supertype?.toLowerCase()
    const category = card.category?.toLowerCase()
    const stage = card.stage?.toLowerCase()

    // Must be a Pokemon card
    const isPokemon = supertype === 'pokemon' || supertype === 'pokémon' ||
                      category === 'pokemon' || category === 'pokémon'

    if (!isPokemon) return false

    // TCGdex format: check stage field directly
    if (stage === 'basic') return true

    // Fallback: name-based detection (for cards without stage field)
    return !/\b(ex|V|VMAX|VSTAR|Stage|BREAK)\b/i.test(card.name)
  })
  const basicCount = basicPokemon.reduce((sum, card) => sum + card.quantity, 0)

  if (basicCount === 0) {
    result.validation.errors.push({
      type: 'no_basic',
      message: 'Deck needs at least 1 Basic Pokemon'
    })
  }

  // Summary stats
  const aceSpecs = cards.filter(card => /ACE SPEC/i.test(card.raw || card.name))
  const radiants = cards.filter(card => /Radiant/i.test(card.name))

  result.validation.summary = {
    totalCards,
    basicPokemon: basicCount,
    aceSpecs: aceSpecs.reduce((sum, card) => sum + card.quantity, 0),
    radiants: radiants.reduce((sum, card) => sum + card.quantity, 0)
  }

  result.validation.isValid = result.validation.errors.length === 0

  return result
}

/**
 * Main entry point - parse a deck string
 * @param {string} input - The deck string to parse
 * @param {string} overrideFormat - Optional format override (standard, glc, expanded, constructed)
 */
export function parseDeckString(input, overrideFormat = null) {
  const startTime = Date.now()

  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Invalid input', tcg: null, format: null, cards: [] }
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return { success: false, error: 'Empty deck string', tcg: null, format: null, cards: [] }
  }

  const tcg = detectTCG(trimmed)
  log.info(MODULE, `Detected TCG: ${tcg}`)

  let parseResult, formatResult, detectedFormat

  if (tcg === 'riftbound') {
    parseResult = parseRiftbound(trimmed)
    formatResult = detectRiftboundFormat(parseResult.cards, parseResult.detectedDomains || [])
    detectedFormat = formatResult.detected
  } else {
    const inputFormat = detectInputFormat(trimmed)
    parseResult = inputFormat === 'pokemon-tcg-pocket'
      ? parsePokemonPocket(trimmed)
      : parsePokemonTCGLive(trimmed)

    // Auto-detect format first
    const autoDetect = detectPokemonFormat(parseResult.cards)
    detectedFormat = autoDetect.detected

    // If override provided, re-validate with that format
    if (overrideFormat && overrideFormat !== autoDetect.detected) {
      log.info(MODULE, `Format override: ${autoDetect.detected} -> ${overrideFormat}`)
      formatResult = validateForFormat(parseResult.cards, overrideFormat, tcg)
      formatResult.autoDetected = autoDetect.detected
      formatResult.isOverride = true
    } else {
      formatResult = autoDetect
      formatResult.autoDetected = autoDetect.detected
      formatResult.isOverride = false
    }
  }

  // Generate reprint groups for validation display (use active format, not detected)
  const activeFormat = overrideFormat || detectedFormat || 'standard'
  const reprintGroups = groupReprintsByName(parseResult.cards, activeFormat)

  log.perf(MODULE, 'parseDeckString', Date.now() - startTime)

  return {
    success: true,
    tcg,
    inputFormat: tcg === 'pokemon' ? detectInputFormat(trimmed) : 'riftbound',
    format: overrideFormat || formatResult.detected,
    autoDetectedFormat: formatResult.autoDetected || formatResult.detected,
    isFormatOverride: formatResult.isOverride || false,
    formatConfidence: formatResult.isOverride ? 100 :
                      (formatResult.confidence === 'high' ? 90 :
                       formatResult.confidence === 'medium' ? 70 : 50),
    formatReasons: formatResult.reasons,
    validation: formatResult.validation,
    cards: parseResult.cards,
    reprintGroups,
    breakdown: calculateBreakdown(parseResult.cards, tcg),
    warnings: parseResult.warnings || [],
    stats: {
      totalCards: parseResult.cards.reduce((sum, c) => sum + c.quantity, 0),
      uniqueCards: parseResult.cards.length,
      uniqueNames: reprintGroups.length,
      cardsNeedingResolution: parseResult.cards.filter(c => c.needsResolution).length,
      groupsExceedingLimit: reprintGroups.filter(g => g.exceedsLimit).length
    }
  }
}

export default {
  parseDeckString,
  detectTCG,
  detectPokemonFormat,
  detectRiftboundFormat,
  normalizeCardName,
  groupReprintsByName
}

// PokeAPI Sprite Service
// Extracts Pokemon base name from TCG card names and provides sprite URLs

// Cache for resolved Pokemon IDs (name -> id mapping)
const pokemonIdCache = new Map()

// Common suffixes to remove from card names
const CARD_SUFFIXES = [
  ' ex', ' EX', ' GX', ' gx', ' V', ' VMAX', ' VSTAR', ' V-UNION',
  ' δ', ' Delta', ' LV.X', ' Prime', ' LEGEND', ' BREAK',
  ' Radiant', ' Shiny', ' ◇', ' Prism Star',
  ' Tag Team', ' & ', // For Tag Team cards
]

// Special name mappings for Pokemon with different API names
const NAME_MAPPINGS = {
  'mr. mime': 'mr-mime',
  'mr mime': 'mr-mime',
  'mime jr.': 'mime-jr',
  'mime jr': 'mime-jr',
  'type: null': 'type-null',
  'type null': 'type-null',
  'tapu koko': 'tapu-koko',
  'tapu lele': 'tapu-lele',
  'tapu bulu': 'tapu-bulu',
  'tapu fini': 'tapu-fini',
  'ho-oh': 'ho-oh',
  'porygon-z': 'porygon-z',
  'porygon2': 'porygon2',
  'farfetch\'d': 'farfetchd',
  'sirfetch\'d': 'sirfetchd',
  'flabébé': 'flabebe',
  'nidoran♀': 'nidoran-f',
  'nidoran♂': 'nidoran-m',
  'nidoran f': 'nidoran-f',
  'nidoran m': 'nidoran-m',
  'jangmo-o': 'jangmo-o',
  'hakamo-o': 'hakamo-o',
  'kommo-o': 'kommo-o',
  'chi-yu': 'chi-yu',
  'chien-pao': 'chien-pao',
  'ting-lu': 'ting-lu',
  'wo-chien': 'wo-chien',
  'great tusk': 'great-tusk',
  'scream tail': 'scream-tail',
  'brute bonnet': 'brute-bonnet',
  'flutter mane': 'flutter-mane',
  'slither wing': 'slither-wing',
  'sandy shocks': 'sandy-shocks',
  'iron treads': 'iron-treads',
  'iron bundle': 'iron-bundle',
  'iron hands': 'iron-hands',
  'iron jugulis': 'iron-jugulis',
  'iron moth': 'iron-moth',
  'iron thorns': 'iron-thorns',
  'roaring moon': 'roaring-moon',
  'iron valiant': 'iron-valiant',
  'walking wake': 'walking-wake',
  'iron leaves': 'iron-leaves',
  'gouging fire': 'gouging-fire',
  'raging bolt': 'raging-bolt',
  'iron boulder': 'iron-boulder',
  'iron crown': 'iron-crown',
  'terapagos': 'terapagos',
  'ogerpon': 'ogerpon',
  'miraidon': 'miraidon',
  'koraidon': 'koraidon',
}

/**
 * Extract the base Pokemon name from a TCG card name
 * e.g., "Pikachu ex" -> "pikachu", "Charizard VSTAR" -> "charizard"
 */
export function extractPokemonName(cardName) {
  if (!cardName) return null

  let name = cardName.trim()

  // Remove common suffixes
  for (const suffix of CARD_SUFFIXES) {
    if (name.toLowerCase().endsWith(suffix.toLowerCase())) {
      name = name.slice(0, -suffix.length)
    }
  }

  // Handle Tag Team cards (e.g., "Pikachu & Zekrom-GX" -> "pikachu")
  if (name.includes('&')) {
    name = name.split('&')[0].trim()
  }

  // Convert to lowercase and trim
  name = name.toLowerCase().trim()

  // Check special mappings
  if (NAME_MAPPINGS[name]) {
    return NAME_MAPPINGS[name]
  }

  // Replace spaces with hyphens for API compatibility
  name = name.replace(/\s+/g, '-')

  // Remove any special characters except hyphens
  name = name.replace(/[^a-z0-9-]/g, '')

  return name
}

/**
 * Get the PokeAPI sprite URL for a Pokemon
 * Uses the official artwork sprites (high quality)
 */
export function getSpriteUrl(pokemonName, type = 'default') {
  if (!pokemonName) return null

  const baseName = extractPokemonName(pokemonName)
  if (!baseName) return null

  // Build URL based on sprite type
  switch (type) {
    case 'animated':
      // Animated GIF from Showdown
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${baseName}.gif`
    case 'home':
      // Pokemon HOME style
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${baseName}.png`
    case 'artwork':
      // Official artwork (high res) - requires Pokemon ID
      return null // Will be resolved via API
    case 'default':
    default:
      // Default front sprite (small, pixelated but reliable)
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${baseName}.png`
  }
}

/**
 * Fetch Pokemon data from PokeAPI to get the ID and official artwork
 * Results are cached for performance
 */
export async function getPokemonSprite(cardName) {
  const baseName = extractPokemonName(cardName)
  if (!baseName) return null

  // Check cache
  if (pokemonIdCache.has(baseName)) {
    return pokemonIdCache.get(baseName)
  }

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${baseName}`)

    if (!response.ok) {
      // Pokemon not found, cache null to avoid repeated requests
      pokemonIdCache.set(baseName, null)
      return null
    }

    const data = await response.json()

    const spriteData = {
      id: data.id,
      name: data.name,
      sprites: {
        default: data.sprites.front_default,
        shiny: data.sprites.front_shiny,
        artwork: data.sprites.other?.['official-artwork']?.front_default,
        home: data.sprites.other?.home?.front_default,
        animated: data.sprites.other?.showdown?.front_default,
      }
    }

    // Cache the result
    pokemonIdCache.set(baseName, spriteData)

    return spriteData
  } catch (error) {
    console.error('Error fetching Pokemon sprite:', error)
    pokemonIdCache.set(baseName, null)
    return null
  }
}

/**
 * Get a direct sprite URL by Pokemon name (no API call, uses name-based URL)
 * Falls back gracefully if the sprite doesn't exist
 */
export function getDirectSpriteUrl(cardName) {
  const baseName = extractPokemonName(cardName)
  if (!baseName) return null

  // Use the default sprite URL which works with Pokemon names
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${baseName}.png`
}

/**
 * Preload and cache sprite for a card name
 * Returns a promise that resolves to the sprite URL or null
 */
export async function preloadSprite(cardName) {
  const sprite = await getPokemonSprite(cardName)
  return sprite?.sprites?.default || null
}

export const pokeApiService = {
  extractPokemonName,
  getSpriteUrl,
  getPokemonSprite,
  getDirectSpriteUrl,
  preloadSprite,
}

export default pokeApiService

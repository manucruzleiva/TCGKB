import { useMemo } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

/**
 * DeckAutoTags - Displays auto-generated tags as badges
 *
 * Props:
 * - cards: array of parsed cards
 * - tcg: 'pokemon' | 'riftbound'
 * - format: detected format
 * - onTagClick: optional callback when tag is clicked
 */

// Pokemon type colors
const TYPE_COLORS = {
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-400',
  psychic: 'bg-purple-500',
  fighting: 'bg-amber-700',
  dark: 'bg-gray-800',
  steel: 'bg-gray-400',
  dragon: 'bg-indigo-600',
  colorless: 'bg-gray-300',
  fairy: 'bg-pink-400'
}

// Mechanic badge colors
const MECHANIC_COLORS = {
  'ex-focused': 'bg-red-600',
  'v-focused': 'bg-blue-600',
  'vstar': 'bg-yellow-600',
  'vmax': 'bg-purple-600',
  'single-prize': 'bg-green-600',
  'lost-zone': 'bg-violet-600',
  'rapid-strike': 'bg-cyan-500',
  'single-strike': 'bg-red-500'
}

// Format badge colors
const FORMAT_COLORS = {
  standard: 'bg-emerald-600',
  expanded: 'bg-amber-600',
  glc: 'bg-teal-600',
  unlimited: 'bg-gray-600'
}

// Riftbound domain colors
const DOMAIN_COLORS = {
  fury: 'bg-red-600',
  calm: 'bg-blue-400',
  mind: 'bg-purple-600',
  body: 'bg-amber-600',
  order: 'bg-yellow-500',
  chaos: 'bg-violet-700'
}

/**
 * Generate auto-tags from cards (frontend version)
 */
function generateAutoTags(cards, tcg, format) {
  const tags = []

  if (!cards || cards.length === 0) return tags

  if (tcg === 'riftbound') {
    return generateRiftboundTags(cards)
  }

  return generatePokemonTags(cards, format)
}

function generatePokemonTags(cards, format) {
  const tags = []

  // Add format tag
  if (format) {
    tags.push({ type: 'format', value: format.toLowerCase() })
  }

  // Get Pokemon cards
  const pokemonCards = cards.filter(c => {
    const supertype = c.supertype?.toLowerCase() || ''
    return supertype === 'pokémon' || supertype === 'pokemon'
  })

  // Detect types
  const types = new Set()
  pokemonCards.forEach(card => {
    if (card.types && Array.isArray(card.types)) {
      card.types.forEach(type => types.add(type.toLowerCase()))
    }
  })

  // Add type tags (limit to top 3)
  Array.from(types).slice(0, 3).forEach(type => {
    if (Object.keys(TYPE_COLORS).includes(type)) {
      tags.push({ type: 'energy-type', value: type })
    }
  })

  // Detect mechanics
  const allNames = cards.map(c => c.name?.toLowerCase() || '').join(' ')

  const hasEx = cards.some(c => c.name?.toLowerCase().includes(' ex'))
  const hasV = cards.some(c => c.name?.toLowerCase().endsWith(' v'))
  const hasVStar = cards.some(c => c.name?.toLowerCase().includes('vstar'))
  const hasVMax = cards.some(c => c.name?.toLowerCase().includes('vmax'))
  const hasRadiant = cards.some(c => c.name?.toLowerCase().startsWith('radiant '))

  const totalPokemon = pokemonCards.reduce((sum, c) => sum + c.quantity, 0)
  const exCount = pokemonCards.filter(c => c.name?.toLowerCase().includes(' ex')).reduce((sum, c) => sum + c.quantity, 0)

  if (exCount >= totalPokemon * 0.3) {
    tags.push({ type: 'mechanic', value: 'ex-focused' })
  }
  if (hasVStar) tags.push({ type: 'mechanic', value: 'vstar' })
  if (hasVMax) tags.push({ type: 'mechanic', value: 'vmax' })

  if (!hasEx && !hasV && !hasVStar && !hasVMax && !hasRadiant) {
    tags.push({ type: 'mechanic', value: 'single-prize' })
  }

  if (allNames.includes('lost zone') || allNames.includes('comfey')) {
    tags.push({ type: 'mechanic', value: 'lost-zone' })
  }

  return tags
}

function generateRiftboundTags(cards) {
  const tags = []

  // Find Legend
  const legends = cards.filter(c => c.cardType === 'Legend')
  if (legends.length > 0 && legends[0].name) {
    const championName = legends[0].name.split(',')[0].trim()
    tags.push({ type: 'champion', value: championName })

    // Add domains from Legend
    const legendDomains = legends[0].domains || []
    legendDomains.forEach(domain => {
      tags.push({ type: 'domain', value: domain.toLowerCase() })
    })
  }

  return tags
}

/**
 * Get badge color for a tag
 */
function getTagColor(tag) {
  if (tag.type === 'format') return FORMAT_COLORS[tag.value] || 'bg-gray-500'
  if (tag.type === 'energy-type') return TYPE_COLORS[tag.value] || 'bg-gray-500'
  if (tag.type === 'mechanic') return MECHANIC_COLORS[tag.value] || 'bg-gray-500'
  if (tag.type === 'domain') return DOMAIN_COLORS[tag.value] || 'bg-gray-500'
  if (tag.type === 'champion') return 'bg-amber-500'
  return 'bg-gray-500'
}

/**
 * Get display label for a tag
 */
function getTagLabel(tag, t) {
  // Try to translate, fallback to value
  const key = `deckAutoTags.${tag.type}.${tag.value}`
  const translated = t(key)
  if (translated !== key) return translated

  // Capitalize value as fallback
  return tag.value.charAt(0).toUpperCase() + tag.value.slice(1).replace(/-/g, ' ')
}

const DeckAutoTags = ({ cards, tcg = 'pokemon', format, onTagClick, className = '' }) => {
  const { t } = useLanguage()

  const tags = useMemo(() => {
    return generateAutoTags(cards, tcg, format)
  }, [cards, tcg, format])

  if (tags.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag, idx) => (
        <span
          key={`${tag.type}-${tag.value}-${idx}`}
          onClick={() => onTagClick?.(tag)}
          className={`
            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
            text-white ${getTagColor(tag)}
            ${onTagClick ? 'cursor-pointer hover:opacity-80' : ''}
            transition-opacity
          `}
          title={`${tag.type}: ${tag.value}`}
        >
          {getTagLabel(tag, t)}
        </span>
      ))}
    </div>
  )
}

export default DeckAutoTags

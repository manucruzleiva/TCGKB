import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { deckService } from '../services/deckService'
import { cardService } from '../services/cardService'
import Spinner from '../components/common/Spinner'
import DeckImportModal from '../components/decks/DeckImportModal'

// Tag display labels
const TAG_LABELS = {
  // Format
  standard: { es: 'Estándar', en: 'Standard' },
  expanded: { es: 'Expandido', en: 'Expanded' },
  unlimited: { es: 'Sin límite', en: 'Unlimited' },
  glc: { es: 'GLC', en: 'GLC' },
  // Archetype
  aggro: { es: 'Aggro', en: 'Aggro' },
  control: { es: 'Control', en: 'Control' },
  combo: { es: 'Combo', en: 'Combo' },
  midrange: { es: 'Midrange', en: 'Midrange' },
  stall: { es: 'Stall', en: 'Stall' },
  mill: { es: 'Mill', en: 'Mill' },
  turbo: { es: 'Turbo', en: 'Turbo' },
  // Strategy
  meta: { es: 'Meta', en: 'Meta' },
  budget: { es: 'Económico', en: 'Budget' },
  fun: { es: 'Divertido', en: 'Fun' },
  competitive: { es: 'Competitivo', en: 'Competitive' },
  casual: { es: 'Casual', en: 'Casual' },
  'beginner-friendly': { es: 'Para principiantes', en: 'Beginner Friendly' },
  // Types
  fire: { es: 'Fuego', en: 'Fire' },
  water: { es: 'Agua', en: 'Water' },
  grass: { es: 'Planta', en: 'Grass' },
  electric: { es: 'Eléctrico', en: 'Electric' },
  psychic: { es: 'Psíquico', en: 'Psychic' },
  fighting: { es: 'Lucha', en: 'Fighting' },
  dark: { es: 'Oscuridad', en: 'Dark' },
  steel: { es: 'Acero', en: 'Steel' },
  dragon: { es: 'Dragón', en: 'Dragon' },
  colorless: { es: 'Incoloro', en: 'Colorless' },
  fairy: { es: 'Hada', en: 'Fairy' },
  // Special
  'ex-focused': { es: 'Enfocado en ex', en: 'ex Focused' },
  'v-focused': { es: 'Enfocado en V', en: 'V Focused' },
  vstar: { es: 'VSTAR', en: 'VSTAR' },
  vmax: { es: 'VMAX', en: 'VMAX' },
  'single-prize': { es: 'Un solo premio', en: 'Single Prize' },
  'lost-zone': { es: 'Zona Perdida', en: 'Lost Zone' },
  'rapid-strike': { es: 'Golpe Rápido', en: 'Rapid Strike' },
  'single-strike': { es: 'Golpe Único', en: 'Single Strike' }
}

const CATEGORY_LABELS = {
  format: { es: 'Formato', en: 'Format' },
  archetype: { es: 'Arquetipo', en: 'Archetype' },
  strategy: { es: 'Estrategia', en: 'Strategy' },
  type: { es: 'Tipo', en: 'Type' },
  special: { es: 'Especial', en: 'Special' }
}

const DeckBuilder = () => {
  const { deckId } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const isEditMode = !!deckId

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState([])
  const [cards, setCards] = useState([])
  const [tcgSystem, setTcgSystem] = useState(null) // Locked TCG for this deck

  // Available tags from backend
  const [availableTags, setAvailableTags] = useState({})
  const [showTagSelector, setShowTagSelector] = useState(false)

  // UI state
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Card search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Load available tags
    loadAvailableTags()

    if (isEditMode) {
      fetchDeck()
    }
  }, [isAuthenticated, deckId])

  const loadAvailableTags = async () => {
    try {
      const response = await deckService.getAvailableTags()
      if (response.success) {
        setAvailableTags(response.data)
      }
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }

  const fetchDeck = async () => {
    try {
      setLoading(true)
      const response = await deckService.getDeck(deckId)
      if (response.success) {
        const deck = response.data.deck
        // Check ownership
        if (deck.userId._id !== user._id && user.role !== 'admin') {
          navigate('/decks')
          return
        }
        setName(deck.name)
        setDescription(deck.description || '')
        setIsPublic(deck.isPublic)
        setTags(deck.tags || [])
        setCards(deck.cards || [])
        setTcgSystem(deck.tcgSystem || 'pokemon') // Load deck's TCG system
      }
    } catch (error) {
      console.error('Error fetching deck:', error)
      setError(language === 'es' ? 'Error al cargar el mazo' : 'Error loading deck')
    } finally {
      setLoading(false)
    }
  }

  // Debounced card search - filtered by deck's TCG system
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true)
        // Pass tcgSystem to filter search results (only show cards from the same TCG)
        const response = await cardService.searchCards(searchQuery, 20, tcgSystem)
        if (response.success) {
          setSearchResults(response.data.cards || [])
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, tcgSystem])

  const addCard = (card) => {
    // Get card's TCG system (default to 'pokemon')
    const cardTcg = card.tcgSystem || 'pokemon'

    // If deck already has a TCG locked, prevent adding cards from different TCG
    if (tcgSystem && cardTcg !== tcgSystem) {
      setError(
        language === 'es'
          ? `No puedes mezclar cartas de diferentes TCGs. Este mazo es de ${tcgSystem === 'pokemon' ? 'Pokémon' : 'Riftbound'}.`
          : `Cannot mix cards from different TCGs. This deck is for ${tcgSystem === 'pokemon' ? 'Pokémon' : 'Riftbound'}.`
      )
      // Auto-clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
      return
    }

    // Clear any previous error when successfully adding a card
    if (error) setError(null)

    // Lock the TCG system on first card
    if (!tcgSystem) {
      setTcgSystem(cardTcg)
    }

    setCards(prev => {
      const existing = prev.find(c => c.cardId === card.id)
      if (existing) {
        // Increase quantity (max 4 for non-energy, unlimited for energy)
        const maxQty = card.supertype === 'Energy' ? 60 : 4
        if (existing.quantity >= maxQty) return prev
        return prev.map(c =>
          c.cardId === card.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      // Add new card
      return [...prev, {
        cardId: card.id,
        name: card.name,
        quantity: 1,
        supertype: card.supertype,
        imageSmall: card.images?.small
      }]
    })
  }

  const removeCard = (cardId) => {
    setCards(prev => {
      const existing = prev.find(c => c.cardId === cardId)
      if (existing && existing.quantity > 1) {
        return prev.map(c =>
          c.cardId === cardId
            ? { ...c, quantity: c.quantity - 1 }
            : c
        )
      }
      return prev.filter(c => c.cardId !== cardId)
    })
  }

  const deleteCard = (cardId) => {
    setCards(prev => prev.filter(c => c.cardId !== cardId))
  }

  // Clear TCG lock when all cards are removed
  useEffect(() => {
    if (cards.length === 0 && tcgSystem !== null) {
      setTcgSystem(null)
    }
  }, [cards.length, tcgSystem])

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(prev => prev.filter(t => t !== tag))
    } else if (tags.length < 10) {
      setTags(prev => [...prev, tag])
    }
  }

  const removeTag = (tag) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  // Handle import from DeckImportModal
  const handleImport = (importData) => {
    // Map parsed cards to deck cards format
    const importedCards = importData.cards.map(card => ({
      cardId: card.cardId,
      name: card.name,
      quantity: card.quantity,
      supertype: card.supertype || 'Unknown',
      imageSmall: null // Images will be loaded when viewing
    }))

    setCards(importedCards)

    // Detect TCG system from imported cards (use first card's TCG)
    if (importData.cards.length > 0) {
      const firstCardTcg = importData.cards[0].tcgSystem || 'pokemon'
      setTcgSystem(firstCardTcg)
    }

    // Auto-add format tag if detected
    if (importData.format && !tags.includes(importData.format)) {
      setTags(prev => [...prev.filter(t => !['standard', 'expanded', 'glc', 'constructed'].includes(t)), importData.format])
    }
  }

  const handleExport = () => {
    const exportText = deckService.formatToTCGLive(cards)
    navigator.clipboard.writeText(exportText)
    alert(language === 'es' ? 'Copiado al portapapeles' : 'Copied to clipboard')
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError(language === 'es' ? 'El nombre es requerido' : 'Name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const deckData = {
        name: name.trim(),
        description: description.trim(),
        isPublic,
        tags,
        cards,
        tcgSystem: tcgSystem || 'pokemon' // Default to pokemon if no cards added
      }

      let response
      if (isEditMode) {
        response = await deckService.updateDeck(deckId, deckData)
      } else {
        response = await deckService.createDeck(deckData)
      }

      if (response.success) {
        navigate(`/decks/${response.data.deck._id}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      setError(error.response?.data?.message || (language === 'es' ? 'Error al guardar' : 'Error saving'))
    } finally {
      setSaving(false)
    }
  }

  // Helper to normalize supertype (handle Pokemon vs Pokémon)
  const normalizeType = (type) => {
    if (!type) return 'Unknown'
    const lower = type.toLowerCase()
    if (lower === 'pokémon' || lower === 'pokemon') return 'Pokémon'
    if (lower === 'trainer') return 'Trainer'
    if (lower === 'energy') return 'Energy'
    return type
  }

  // Calculate deck stats
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  const pokemonCount = cards.filter(c => normalizeType(c.supertype) === 'Pokémon').reduce((sum, c) => sum + c.quantity, 0)
  const trainerCount = cards.filter(c => normalizeType(c.supertype) === 'Trainer').reduce((sum, c) => sum + c.quantity, 0)
  const energyCount = cards.filter(c => normalizeType(c.supertype) === 'Energy').reduce((sum, c) => sum + c.quantity, 0)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEditMode
            ? (language === 'es' ? 'Editar Mazo' : 'Edit Deck')
            : (language === 'es' ? 'Crear Mazo' : 'Create Deck')}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {language === 'es' ? 'Importar' : 'Import'}
          </button>
          <button
            onClick={handleExport}
            disabled={cards.length === 0}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {language === 'es' ? 'Exportar' : 'Export'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Spinner size="sm" />}
            {language === 'es' ? 'Guardar' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        {/* Deck Info - Always first on both mobile and desktop */}
        <div className="order-1 lg:order-none lg:col-span-1">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {language === 'es' ? 'Información' : 'Information'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'es' ? 'Nombre' : 'Name'}*
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={language === 'es' ? 'Mi mazo increíble' : 'My awesome deck'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'es' ? 'Descripción' : 'Description'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder={language === 'es' ? 'Describe tu mazo...' : 'Describe your deck...'}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language === 'es' ? 'Mazo público' : 'Public deck'}
                </label>
              </div>

              {/* TCG System Indicator */}
              {tcgSystem && (
                <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg">
                  <span className="text-lg">
                    {tcgSystem === 'pokemon' ? '🎴' : '🌀'}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {tcgSystem === 'pokemon' ? 'Pokémon TCG' : 'Riftbound TCG'}
                    </span>
                    <p className="text-xs text-primary-600 dark:text-primary-400">
                      {language === 'es'
                        ? 'Solo cartas de este TCG pueden añadirse'
                        : 'Only cards from this TCG can be added'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tags ({tags.length}/10)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTagSelector(!showTagSelector)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {showTagSelector ? (language === 'es' ? 'Cerrar' : 'Close') : (language === 'es' ? 'Elegir tags' : 'Choose tags')}
                  </button>
                </div>

                {/* Selected tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm flex items-center gap-1"
                      >
                        {TAG_LABELS[tag]?.[language] || tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-primary-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag selector dropdown */}
                {showTagSelector && Object.keys(availableTags).length > 0 && (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-3 max-h-64 overflow-y-auto">
                    {Object.entries(availableTags).map(([category, categoryTags]) => (
                      <div key={category}>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                          {CATEGORY_LABELS[category]?.[language] || category}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {categoryTags.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                                tags.includes(tag)
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                            >
                              {TAG_LABELS[tag]?.[language] || tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Search & Deck - Second on mobile, right column on desktop */}
        <div className="order-2 lg:order-none lg:col-span-2 space-y-6">
          {/* Card Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {language === 'es' ? 'Buscar Cartas' : 'Search Cards'}
            </h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'es' ? 'Buscar por nombre...' : 'Search by name...'}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searching && (
                <div className="absolute right-3 top-3">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                {searchResults.map(card => (
                  <button
                    key={card.id}
                    onClick={() => addCard(card)}
                    className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition-colors"
                  >
                    <img
                      src={card.images?.small}
                      alt={card.name}
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">+</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Deck Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {language === 'es' ? 'Cartas en el Mazo' : 'Cards in Deck'} ({totalCards})
            </h2>

            {cards.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">🃏</div>
                <p>{language === 'es' ? 'Añade cartas buscando arriba o importando' : 'Add cards by searching above or importing'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group by supertype */}
                {['Pokémon', 'Trainer', 'Energy'].map(supertype => {
                  const supertypeCards = cards.filter(c => normalizeType(c.supertype) === supertype)
                  if (supertypeCards.length === 0) return null

                  return (
                    <div key={supertype}>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        {supertype} ({supertypeCards.reduce((sum, c) => sum + c.quantity, 0)})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {supertypeCards.map(card => (
                          <div
                            key={card.cardId}
                            className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
                          >
                            {card.imageSmall ? (
                              <img
                                src={card.imageSmall}
                                alt={card.name}
                                className="w-full h-auto"
                              />
                            ) : (
                              <div className="aspect-[63/88] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-xs text-gray-500 text-center px-1">{card.name}</span>
                              </div>
                            )}
                            {/* Quantity badge */}
                            <div className="absolute top-1 right-1 px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                              ×{card.quantity}
                            </div>
                            {/* Hover controls */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => removeCard(card.cardId)}
                                className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => addCard({ id: card.cardId, name: card.name, supertype: card.supertype, images: { small: card.imageSmall } })}
                                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteCard(card.cardId)}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Unknown supertype cards */}
                {cards.filter(c => !['Pokémon', 'Trainer', 'Energy'].includes(normalizeType(c.supertype))).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      {language === 'es' ? 'Otros' : 'Other'}
                    </h3>
                    <div className="space-y-1">
                      {cards.filter(c => !['Pokémon', 'Trainer', 'Energy'].includes(normalizeType(c.supertype))).map(card => (
                        <div
                          key={card.cardId}
                          className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {card.quantity}× {card.name} ({card.cardId})
                          </span>
                          <button
                            onClick={() => deleteCard(card.cardId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deck Stats - Last on mobile, sidebar on desktop */}
        <div className="order-3 lg:order-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {language === 'es' ? 'Estadísticas' : 'Stats'}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className={`font-bold ${totalCards === 60 ? 'text-green-600' : totalCards > 60 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                  {totalCards}/60
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Pokémon</span>
                <span className="font-semibold text-blue-600">{pokemonCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Trainer</span>
                <span className="font-semibold text-purple-600">{trainerCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Energy</span>
                <span className="font-semibold text-yellow-600">{energyCount}</span>
              </div>
            </div>

            {/* Visual breakdown bar */}
            {totalCards > 0 && (
              <div className="mt-4 h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
                <div
                  className="bg-blue-500"
                  style={{ width: `${(pokemonCount / totalCards) * 100}%` }}
                />
                <div
                  className="bg-purple-500"
                  style={{ width: `${(trainerCount / totalCards) * 100}%` }}
                />
                <div
                  className="bg-yellow-500"
                  style={{ width: `${(energyCount / totalCards) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <DeckImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </div>
  )
}

export default DeckBuilder

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { deckService } from '../services/deckService'
import { cardService } from '../services/cardService'
import Spinner from '../components/common/Spinner'

const FORMAT_OPTIONS = [
  { value: 'standard', label: { es: 'Estándar', en: 'Standard' } },
  { value: 'expanded', label: { es: 'Expandido', en: 'Expanded' } },
  { value: 'unlimited', label: { es: 'Sin límite', en: 'Unlimited' } }
]

const DeckBuilder = () => {
  const { deckId } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const isEditMode = !!deckId

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState('standard')
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [cards, setCards] = useState([])

  // UI state
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Card search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Import/Export modal
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (isEditMode) {
      fetchDeck()
    }
  }, [isAuthenticated, deckId])

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
        setFormat(deck.format || 'standard')
        setIsPublic(deck.isPublic)
        setTags(deck.tags || [])
        setCards(deck.cards || [])
      }
    } catch (error) {
      console.error('Error fetching deck:', error)
      setError(language === 'es' ? 'Error al cargar el mazo' : 'Error loading deck')
    } finally {
      setLoading(false)
    }
  }

  // Debounced card search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true)
        const response = await cardService.searchCards(searchQuery, 20)
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
  }, [searchQuery])

  const addCard = (card) => {
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

  const handleAddTag = (e) => {
    e.preventDefault()
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags(prev => [...prev, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const handleImport = async () => {
    try {
      setImportError(null)
      const parsedCards = deckService.parseTCGLiveFormat(importText)

      if (parsedCards.length === 0) {
        setImportError(language === 'es' ? 'No se encontraron cartas válidas' : 'No valid cards found')
        return
      }

      // Fetch card details for each parsed card
      const enrichedCards = []
      for (const card of parsedCards) {
        try {
          const response = await cardService.getCardById(card.cardId)
          if (response.success && response.data.card) {
            const cardData = response.data.card
            enrichedCards.push({
              cardId: card.cardId,
              name: cardData.name,
              quantity: card.quantity,
              supertype: cardData.supertype,
              imageSmall: cardData.images?.small
            })
          } else {
            // Card not found, add with minimal info
            enrichedCards.push({
              cardId: card.cardId,
              name: card.name || card.cardId,
              quantity: card.quantity,
              supertype: 'Unknown',
              imageSmall: null
            })
          }
        } catch (err) {
          // Card not found, add with minimal info
          enrichedCards.push({
            cardId: card.cardId,
            name: card.name || card.cardId,
            quantity: card.quantity,
            supertype: 'Unknown',
            imageSmall: null
          })
        }
      }

      setCards(enrichedCards)
      setShowImportModal(false)
      setImportText('')
    } catch (error) {
      console.error('Import error:', error)
      setImportError(language === 'es' ? 'Error al importar' : 'Import error')
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
        format,
        isPublic,
        tags,
        cards
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

  // Calculate deck stats
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)
  const pokemonCount = cards.filter(c => c.supertype === 'Pokémon').reduce((sum, c) => sum + c.quantity, 0)
  const trainerCount = cards.filter(c => c.supertype === 'Trainer').reduce((sum, c) => sum + c.quantity, 0)
  const energyCount = cards.filter(c => c.supertype === 'Energy').reduce((sum, c) => sum + c.quantity, 0)

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Deck Info */}
        <div className="lg:col-span-1 space-y-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'es' ? 'Formato' : 'Format'}
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {FORMAT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label[language]}
                    </option>
                  ))}
                </select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags ({tags.length}/5)
                </label>
                <form onSubmit={handleAddTag} className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    maxLength={20}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="aggro, control..."
                  />
                  <button
                    type="submit"
                    disabled={tags.length >= 5}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    +
                  </button>
                </form>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deck Stats */}
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

        {/* Right Column - Card Search & Deck */}
        <div className="lg:col-span-2 space-y-6">
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
                  const supertypeCards = cards.filter(c => c.supertype === supertype)
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
                {cards.filter(c => !['Pokémon', 'Trainer', 'Energy'].includes(c.supertype)).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      {language === 'es' ? 'Otros' : 'Other'}
                    </h3>
                    <div className="space-y-1">
                      {cards.filter(c => !['Pokémon', 'Trainer', 'Energy'].includes(c.supertype)).map(card => (
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
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {language === 'es' ? 'Importar Mazo (TCG Live Format)' : 'Import Deck (TCG Live Format)'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {language === 'es'
                ? 'Pega tu lista de mazo. Formato: "cantidad cardId" por línea'
                : 'Paste your deck list. Format: "quantity cardId" per line'}
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder={`4 sv4-123\n3 swsh12-456\n2 sv3-789`}
            />
            {importError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{importError}</p>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowImportModal(false); setImportText(''); setImportError(null) }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
              >
                {language === 'es' ? 'Importar' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeckBuilder

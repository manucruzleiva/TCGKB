import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { collectionService } from '../services/collectionService'
import Spinner from '../components/common/Spinner'

const PLAYSET = { pokemon: 4, riftbound: 3 }

const Catalog = () => {
  const { language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [viewMode, setViewMode] = useState('grid')
  const [collection, setCollection] = useState({}) // { cardId: quantity }
  const collectionRef = useRef({}) // Ref to track current collection state for rapid clicks

  // Filter states from URL
  const tcgSystem = searchParams.get('tcgSystem') || ''
  const set = searchParams.get('set') || ''
  const supertype = searchParams.get('supertype') || ''
  const rarity = searchParams.get('rarity') || ''
  const name = searchParams.get('name') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const sortBy = searchParams.get('sortBy') || 'name'
  const sortOrder = searchParams.get('sortOrder') || 'asc'
  const uniqueByName = searchParams.get('uniqueByName') === 'true'
  const alternateArtsOnly = searchParams.get('alternateArtsOnly') === 'true'

  // Fetch filters on mount
  useEffect(() => {
    fetchFilters()
  }, [tcgSystem])

  // Fetch cards when filters change
  useEffect(() => {
    fetchCards()
  }, [tcgSystem, set, supertype, rarity, name, page, sortBy, sortOrder, uniqueByName, alternateArtsOnly])

  // Fetch collection data when cards change
  useEffect(() => {
    if (isAuthenticated && cards.length > 0) {
      fetchCollectionData()
    }
  }, [cards, isAuthenticated])

  const fetchFilters = async () => {
    try {
      const response = await api.get('/cards/catalog/filters', {
        params: { tcgSystem: tcgSystem || undefined }
      })
      if (response.data.success) {
        setFilters(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching filters:', err)
    }
  }

  const fetchCards = async () => {
    try {
      setLoading(true)
      const response = await api.get('/cards/catalog', {
        params: {
          tcgSystem: tcgSystem || undefined,
          set: set || undefined,
          supertype: supertype || undefined,
          rarity: rarity || undefined,
          name: name || undefined,
          page,
          pageSize: 24,
          sortBy,
          sortOrder,
          uniqueByName: uniqueByName || undefined,
          alternateArtsOnly: alternateArtsOnly || undefined
        }
      })
      if (response.data.success) {
        setCards(response.data.data.cards)
        setPagination(response.data.data.pagination)
      }
    } catch (err) {
      console.error('Error fetching catalog:', err)
      setError(language === 'es' ? 'Error al cargar el catalogo' : 'Error loading catalog')
    } finally {
      setLoading(false)
    }
  }

  const fetchCollectionData = async () => {
    try {
      const cardIds = cards.map(c => c.id)
      const response = await collectionService.batchCheckOwnership(cardIds)
      if (response.success) {
        const collectionMap = {}
        Object.entries(response.data).forEach(([cardId, data]) => {
          collectionMap[cardId] = data.quantity
        })
        collectionRef.current = collectionMap
        setCollection(collectionMap)
      }
    } catch (err) {
      console.error('Error fetching collection:', err)
    }
  }

  const updateFilter = useCallback((key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    if (key !== 'page') {
      newParams.set('page', '1')
    }
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const clearFilters = () => {
    setSearchParams({})
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    updateFilter('name', formData.get('search'))
  }

  // Handle collection quantity change
  const handleCollectionChange = async (e, card, delta) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) return

    const tcg = card.tcgSystem || 'pokemon'

    // Use ref to get current value (handles rapid clicks correctly)
    const currentQty = collectionRef.current[card.id] || 0
    const newQty = Math.max(0, currentQty + delta)

    // Update both ref and state
    collectionRef.current = { ...collectionRef.current, [card.id]: newQty }
    setCollection(prev => ({ ...prev, [card.id]: newQty }))

    try {
      await collectionService.setQuantity({
        cardId: card.id,
        quantity: newQty,
        tcgSystem: tcg,
        cardName: card.name,
        cardImage: card.images?.small || card.images?.large,
        cardSet: card.set?.name || card.set?.id,
        cardRarity: card.rarity
      })
    } catch (err) {
      // Revert on error - refetch to get actual server state
      console.error('Error updating collection:', err)
      fetchCollectionData()
    }
  }

  const getPlaysetMax = (tcgSystem) => PLAYSET[tcgSystem] || 4

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm mb-4 inline-block"
        >
          {language === 'es' ? 'Volver al inicio' : 'Back to home'}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {language === 'es' ? 'Catalogo de Cartas' : 'Card Catalog'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {pagination.total.toLocaleString()} {language === 'es' ? 'cartas disponibles' : 'cards available'}
          {isAuthenticated && (
            <span className="ml-2 text-primary-600 dark:text-primary-400">
              • {language === 'es' ? 'Usa +/- para agregar a tu colección' : 'Use +/- to add to your collection'}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="card sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {language === 'es' ? 'Filtros' : 'Filters'}
              </h2>
              {(tcgSystem || set || supertype || rarity || name) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {language === 'es' ? 'Limpiar' : 'Clear'}
                </button>
              )}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                name="search"
                defaultValue={name}
                placeholder={language === 'es' ? 'Buscar por nombre...' : 'Search by name...'}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </form>

            {/* TCG System */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                TCG
              </label>
              <select
                value={tcgSystem}
                onChange={(e) => updateFilter('tcgSystem', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">{language === 'es' ? 'Todos' : 'All'}</option>
                <option value="pokemon">Pokemon</option>
                <option value="riftbound">Riftbound</option>
              </select>
            </div>

            {/* Set */}
            {filters?.sets?.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Set
                </label>
                <select
                  value={set}
                  onChange={(e) => updateFilter('set', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">{language === 'es' ? 'Todos' : 'All'}</option>
                  {filters.sets.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.count})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Supertype */}
            {filters?.supertypes?.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'es' ? 'Tipo' : 'Type'}
                </label>
                <select
                  value={supertype}
                  onChange={(e) => updateFilter('supertype', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">{language === 'es' ? 'Todos' : 'All'}</option>
                  {filters.supertypes.map(s => (
                    <option key={s.name} value={s.name}>{s.name} ({s.count})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Rarity */}
            {filters?.rarities?.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'es' ? 'Rareza' : 'Rarity'}
                </label>
                <select
                  value={rarity}
                  onChange={(e) => updateFilter('rarity', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">{language === 'es' ? 'Todas' : 'All'}</option>
                  {filters.rarities.map(r => (
                    <option key={r.name} value={r.name}>{r.name} ({r.count})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'es' ? 'Ordenar por' : 'Sort by'}
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('-')
                  updateFilter('sortBy', sb)
                  setTimeout(() => updateFilter('sortOrder', so), 0)
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="name-asc">{language === 'es' ? 'Nombre (A-Z)' : 'Name (A-Z)'}</option>
                <option value="name-desc">{language === 'es' ? 'Nombre (Z-A)' : 'Name (Z-A)'}</option>
                <option value="releaseDate-desc">{language === 'es' ? 'Mas reciente' : 'Newest'}</option>
                <option value="releaseDate-asc">{language === 'es' ? 'Mas antiguo' : 'Oldest'}</option>
              </select>
            </div>

            {/* Reprint Filters */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {language === 'es' ? 'Versiones' : 'Versions'}
              </h3>

              {/* Unique by Name Toggle */}
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uniqueByName}
                  onChange={(e) => updateFilter('uniqueByName', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'es' ? 'Una versión por carta' : 'One version per card'}
                </span>
              </label>

              {/* Alternate Arts Only Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alternateArtsOnly}
                  onChange={(e) => updateFilter('alternateArtsOnly', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'es' ? 'Solo alternate arts' : 'Alternate arts only'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="flex-1">
          {/* View Toggle & Pagination Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'es' ? 'Pagina' : 'Page'} {pagination.page} {language === 'es' ? 'de' : 'of'} {pagination.totalPages}
            </span>
          </div>

          {error ? (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
              {error}
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : cards.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {language === 'es' ? 'No se encontraron cartas' : 'No cards found'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {cards.map(card => {
                const qty = collection[card.id] || 0
                const playsetMax = getPlaysetMax(card.tcgSystem)
                const hasPlayset = qty >= playsetMax

                return (
                  <div
                    key={card.id}
                    className="group bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden relative"
                  >
                    <Link to={`/card/${card.id}`}>
                      <div className="aspect-[2.5/3.5] bg-gray-100 dark:bg-gray-700">
                        {card.images?.small && (
                          <img
                            src={card.images.small}
                            alt={card.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        )}
                      </div>
                    </Link>

                    {/* Collection Counter Overlay */}
                    {isAuthenticated && (
                      <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-black/70 rounded-full px-1 py-0.5">
                        <button
                          onClick={(e) => handleCollectionChange(e, card, -1)}
                          disabled={qty === 0}
                          className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className={`text-xs font-bold min-w-[20px] text-center ${hasPlayset ? 'text-green-400' : 'text-white'}`}>
                          {qty}
                        </span>
                        <button
                          onClick={(e) => handleCollectionChange(e, card, 1)}
                          className="w-5 h-5 flex items-center justify-center text-green-400 hover:text-green-300"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <Link to={`/card/${card.id}`} className="block p-2">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                          {card.name}
                        </p>
                        {card.variantCount > 1 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                            {card.variantCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {card.set?.name}
                      </p>
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {cards.map(card => {
                const qty = collection[card.id] || 0
                const playsetMax = getPlaysetMax(card.tcgSystem)
                const hasPlayset = qty >= playsetMax

                return (
                  <div
                    key={card.id}
                    className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <Link to={`/card/${card.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      {card.images?.small && (
                        <img
                          src={card.images.small}
                          alt={card.name}
                          className="w-12 h-16 object-cover rounded"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{card.name}</p>
                          {card.variantCount > 1 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                              {card.variantCount} {language === 'es' ? 'versiones' : 'versions'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{card.set?.name} - #{card.number}</p>
                      </div>
                    </Link>

                    {/* Collection Counter */}
                    {isAuthenticated && (
                      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1">
                        <button
                          onClick={(e) => handleCollectionChange(e, card, -1)}
                          disabled={qty === 0}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className={`text-sm font-bold min-w-[24px] text-center ${hasPlayset ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {qty}/{playsetMax}
                        </span>
                        <button
                          onClick={(e) => handleCollectionChange(e, card, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${
                        card.tcgSystem === 'pokemon'
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                          : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                      }`}>
                        {card.tcgSystem}
                      </span>
                      {card.rarity && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.rarity}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => updateFilter('page', String(Math.max(1, page - 1)))}
                disabled={page === 1}
                className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {language === 'es' ? 'Anterior' : 'Previous'}
              </button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => updateFilter('page', String(pageNum))}
                      className={`w-10 h-10 rounded ${
                        page === pageNum
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => updateFilter('page', String(Math.min(pagination.totalPages, page + 1)))}
                disabled={page === pagination.totalPages}
                className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {language === 'es' ? 'Siguiente' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Catalog

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import { deckService } from '../services/deckService'
import Spinner from '../components/common/Spinner'

const FORMAT_COLORS = {
  standard: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  expanded: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  unlimited: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
}

const FORMAT_LABELS = {
  standard: { es: 'Estándar', en: 'Standard' },
  expanded: { es: 'Expandido', en: 'Expanded' },
  unlimited: { es: 'Sin límite', en: 'Unlimited' }
}

const DeckList = () => {
  const { user, isAuthenticated } = useAuth()
  const { language } = useLanguage()
  const { timeAgo } = useDateFormat()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [decks, setDecks] = useState([])
  const [filter, setFilter] = useState('all') // all, mine, public
  const [formatFilter, setFormatFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  useEffect(() => {
    fetchDecks()
  }, [filter, formatFilter, pagination.page])

  const fetchDecks = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit
      }

      if (filter === 'mine') {
        params.mine = true
      }
      if (formatFilter !== 'all') {
        params.format = formatFilter
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const response = await deckService.getDecks(params)
      if (response.success) {
        setDecks(response.data.decks)
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }))
      }
    } catch (error) {
      console.error('Error fetching decks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchDecks()
  }

  const getDeckCoverImage = (deck) => {
    // Get the first Pokemon card image as cover
    const pokemon = deck.cards?.find(c => c.supertype === 'Pokémon')
    return pokemon?.imageSmall || deck.cards?.[0]?.imageSmall || null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {language === 'es' ? 'Mazos' : 'Decks'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'es'
              ? 'Explora mazos de la comunidad o crea el tuyo'
              : 'Explore community decks or create your own'}
          </p>
        </div>
        {isAuthenticated && (
          <Link
            to="/decks/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {language === 'es' ? 'Crear Mazo' : 'Create Deck'}
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'es' ? 'Buscar mazos...' : 'Search decks...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => { setFilter('all'); setPagination(p => ({ ...p, page: 1 })) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {language === 'es' ? 'Todos' : 'All'}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => { setFilter('mine'); setPagination(p => ({ ...p, page: 1 })) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'mine'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {language === 'es' ? 'Mis Mazos' : 'My Decks'}
              </button>
            )}
          </div>

          {/* Format Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => { setFormatFilter('all'); setPagination(p => ({ ...p, page: 1 })) }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                formatFilter === 'all'
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {language === 'es' ? 'Formato' : 'Format'}
            </button>
            {Object.entries(FORMAT_LABELS).map(([format, labels]) => (
              <button
                key={format}
                onClick={() => { setFormatFilter(format); setPagination(p => ({ ...p, page: 1 })) }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formatFilter === format
                    ? FORMAT_COLORS[format]
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {labels[language]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deck Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : decks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🃏</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {language === 'es' ? 'No se encontraron mazos' : 'No decks found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === 'mine'
              ? (language === 'es' ? 'Aún no has creado ningún mazo' : "You haven't created any decks yet")
              : (language === 'es' ? 'Sé el primero en crear un mazo' : 'Be the first to create a deck')}
          </p>
          {isAuthenticated && (
            <Link
              to="/decks/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {language === 'es' ? 'Crear Mazo' : 'Create Deck'}
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {decks.map((deck) => (
              <Link
                key={deck._id}
                to={`/decks/${deck._id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden group"
              >
                {/* Cover Image */}
                <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
                  {getDeckCoverImage(deck) ? (
                    <img
                      src={getDeckCoverImage(deck)}
                      alt={deck.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🃏
                    </div>
                  )}
                  {/* Privacy Badge */}
                  <div className="absolute top-2 right-2">
                    {deck.isPublic ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {language === 'es' ? 'Público' : 'Public'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {language === 'es' ? 'Privado' : 'Private'}
                      </span>
                    )}
                  </div>
                  {/* Format Badge */}
                  {deck.format && (
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${FORMAT_COLORS[deck.format]}`}>
                        {FORMAT_LABELS[deck.format][language]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Deck Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate mb-1">
                    {deck.name}
                  </h3>
                  {deck.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {deck.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <span>👤</span>
                      {deck.userId?.username || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>🃏</span>
                      {deck.totalCards || deck.cards?.reduce((sum, c) => sum + c.quantity, 0) || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span>{timeAgo(deck.createdAt)}</span>
                    <span className="flex items-center gap-2">
                      <span>👁 {deck.views || 0}</span>
                      <span>📋 {deck.copies || 0}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'es' ? 'Anterior' : 'Previous'}
              </button>
              <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language === 'es' ? 'Siguiente' : 'Next'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DeckList

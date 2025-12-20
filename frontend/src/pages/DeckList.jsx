import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import { deckService } from '../services/deckService'
import Spinner from '../components/common/Spinner'
import VoteButtons from '../components/decks/VoteButtons'

// Tag colors and labels
const TAG_COLORS = {
  // Format
  standard: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  expanded: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  unlimited: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  glc: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
  // Archetype
  aggro: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  control: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200',
  combo: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
  midrange: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  stall: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  mill: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
  turbo: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
  // Strategy
  meta: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
  budget: 'bg-lime-100 dark:bg-lime-900 text-lime-800 dark:text-lime-200',
  fun: 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200',
  competitive: 'bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200',
  casual: 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200',
  'beginner-friendly': 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
}

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
  budget: { es: 'Budget', en: 'Budget' },
  fun: { es: 'Diversión', en: 'Fun' },
  competitive: { es: 'Competitivo', en: 'Competitive' },
  casual: { es: 'Casual', en: 'Casual' },
  'beginner-friendly': { es: 'Para Principiantes', en: 'Beginner Friendly' }
}

const CATEGORY_LABELS = {
  format: { es: 'Formato', en: 'Format' },
  archetype: { es: 'Arquetipo', en: 'Archetype' },
  strategy: { es: 'Estrategia', en: 'Strategy' }
}

const TAG_CATEGORIES = {
  format: ['standard', 'expanded', 'unlimited', 'glc'],
  archetype: ['aggro', 'control', 'combo', 'midrange', 'stall', 'mill', 'turbo'],
  strategy: ['meta', 'budget', 'fun', 'competitive', 'casual', 'beginner-friendly']
}

const DeckList = () => {
  const { isAuthenticated } = useAuth()
  const { language, t } = useLanguage()
  const { timeAgo } = useDateFormat()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Get tab from URL, default to 'community' for non-authenticated users
  const urlTab = searchParams.get('tab')
  const defaultTab = isAuthenticated ? 'mine' : 'community'
  const activeTab = urlTab || defaultTab

  const [loading, setLoading] = useState(true)
  const [decks, setDecks] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [showTagFilters, setShowTagFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importName, setImportName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  // Update URL when tab changes
  const setActiveTab = (tab) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', tab)
    setSearchParams(newParams)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  useEffect(() => {
    fetchDecks()
  }, [activeTab, selectedTags, pagination.page, sortBy])

  const fetchDecks = async () => {
    try {
      setLoading(true)

      if (activeTab === 'mine') {
        // Fetch user's own decks
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          mine: true
        }
        if (selectedTags.length > 0) {
          params.tags = selectedTags.join(',')
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
      } else {
        // Fetch community decks using the new endpoint
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          sort: sortBy
        }
        if (selectedTags.length > 0) {
          params.tags = selectedTags.join(',')
        }

        const response = await deckService.getCommunityDecks(params)
        if (response.success) {
          // Map community response to match deck card format
          const mappedDecks = response.data.map(deck => ({
            _id: deck.id,
            name: deck.name,
            description: deck.description,
            tags: [...(deck.format ? [deck.format] : []), ...deck.tags],
            userId: { username: deck.author.username },
            isPublic: true,
            cards: [], // Community endpoint doesn't return full card list
            totalCards: deck.cardCount,
            views: deck.views,
            copies: deck.copies,
            createdAt: deck.createdAt,
            votes: deck.votes,
            isOriginal: deck.isOriginal
          }))
          setDecks(mappedDecks)
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total,
            pages: response.pagination.totalPages
          }))
        }
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

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearTags = () => {
    setSelectedTags([])
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getDeckCoverImage = (deck) => {
    const pokemon = deck.cards?.find(c => c.supertype === 'Pokémon')
    return pokemon?.imageSmall || deck.cards?.[0]?.imageSmall || null
  }

  // Handle import deck
  const handleImportDeck = async () => {
    if (!importText.trim()) {
      setImportError(t('decks.importModal.errorPasteCards'))
      return
    }

    if (!importName.trim()) {
      setImportError(t('decks.importModal.errorNameRequired'))
      return
    }

    setImporting(true)
    setImportError('')

    try {
      const response = await deckService.createDeck({
        name: importName.trim(),
        importString: importText.trim(),
        isPublic: false
      })

      if (response.success) {
        setShowImportModal(false)
        setImportText('')
        setImportName('')
        navigate(`/decks/${response.data._id}/edit`)
      }
    } catch (err) {
      console.error('Error importing deck:', err)
      setImportError(err.response?.data?.message || t('decks.importModal.errorImportFailed'))
    } finally {
      setImporting(false)
    }
  }

  const closeImportModal = () => {
    setShowImportModal(false)
    setImportText('')
    setImportName('')
    setImportError('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {t('decks.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('decks.subtitle')}
          </p>
        </div>
        {isAuthenticated && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t('decks.import')}
            </button>
            <Link
              to="/decks/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('decks.createDeck')}
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Top Row: Search and Main Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('decks.search')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Main Tabs */}
            <div className="flex gap-2">
              {isAuthenticated && (
                <button
                  onClick={() => setActiveTab('mine')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'mine'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('decks.tabs.myDecks')}
                </button>
              )}
              <button
                onClick={() => setActiveTab('community')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'community'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t('decks.tabs.community')}
              </button>
              <button
                onClick={() => setShowTagFilters(!showTagFilters)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  showTagFilters || selectedTags.length > 0
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                🏷️ {t('decks.tags')}
                {selectedTags.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary-500 text-white">
                    {selectedTags.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Sort Options (only for community tab) */}
          {activeTab === 'community' && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('decks.sortLabel')}
              </span>
              <div className="flex gap-1">
                {[
                  { value: 'recent', label: t('decks.sortRecent') },
                  { value: 'popular', label: t('decks.sortPopular') },
                  { value: 'votes', label: t('decks.sortVotes') }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => { setSortBy(option.value); setPagination(p => ({ ...p, page: 1 })) }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      sortBy === option.value
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tag Filters (Expandable) */}
          {showTagFilters && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {selectedTags.length > 0 && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('decks.activeFilters')}
                  </span>
                  {selectedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'} flex items-center gap-1`}
                    >
                      {TAG_LABELS[tag]?.[language] || tag}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                  <button
                    onClick={clearTags}
                    className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    {t('decks.clearAll')}
                  </button>
                </div>
              )}

              {Object.entries(TAG_CATEGORIES).map(([category, tags]) => (
                <div key={category} className="mb-3">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    {CATEGORY_LABELS[category][language]}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedTags.includes(tag)
                            ? `${TAG_COLORS[tag]} ring-2 ring-primary-500`
                            : `${TAG_COLORS[tag]} opacity-60 hover:opacity-100`
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

      {/* Deck Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : decks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🃏</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('decks.noDecks')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {activeTab === 'mine'
              ? t('decks.noMyDecks')
              : t('decks.noCommunityDecks')}
          </p>
          {isAuthenticated && (
            <Link
              to="/decks/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('decks.createDeck')}
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
                        {t('decks.public')}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {t('decks.private')}
                      </span>
                    )}
                  </div>
                  {/* Format Badge (first format tag) */}
                  {deck.tags?.find(t => ['standard', 'expanded', 'unlimited', 'glc'].includes(t)) && (
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${TAG_COLORS[deck.tags.find(t => ['standard', 'expanded', 'unlimited', 'glc'].includes(t))]}`}>
                        {TAG_LABELS[deck.tags.find(t => ['standard', 'expanded', 'unlimited', 'glc'].includes(t))][language]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Deck Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                      {deck.name}
                    </h3>
                    {deck.isOriginal && (
                      <span
                        className="flex-shrink-0"
                        title={t('decks.originalBadge.tooltip')}
                      >
                        🏆
                      </span>
                    )}
                  </div>
                  {deck.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {deck.description}
                    </p>
                  )}
                  {/* Tags */}
                  {deck.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {deck.tags.filter(t => !['standard', 'expanded', 'unlimited', 'glc'].includes(t)).slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className={`px-1.5 py-0.5 rounded text-xs ${TAG_COLORS[tag] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                          {TAG_LABELS[tag]?.[language] || tag}
                        </span>
                      ))}
                    </div>
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
                  <div
                    className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                    onClick={(e) => e.preventDefault()}
                  >
                    <VoteButtons deckId={deck._id} compact />
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
                {t('decks.previous')}
              </button>
              <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('decks.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t('decks.importModal.title')}
              </h2>
              <button
                onClick={closeImportModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Deck Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('decks.importModal.deckName')}
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder={t('decks.importModal.deckNamePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Deck List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('decks.importModal.cardList')}
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={t('decks.importModal.cardListPlaceholder')}
                  className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('decks.importModal.formatHint')}
                </p>
              </div>

              {/* Error */}
              {importError && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {importError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeImportModal}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('decks.importModal.cancel')}
              </button>
              <button
                onClick={handleImportDeck}
                disabled={importing}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {importing && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {t('decks.importModal.importBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeckList

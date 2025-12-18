import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { collectionService } from '../services/collectionService'
import Spinner from '../components/common/Spinner'

const Collection = () => {
  const { language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [viewMode, setViewMode] = useState('grid')

  // Filter states from URL
  const tcgSystem = searchParams.get('tcgSystem') || ''
  const set = searchParams.get('set') || ''
  const playset = searchParams.get('playset') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const sort = searchParams.get('sort') || '-updatedAt'

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  // Fetch stats and filters on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
      fetchFilters()
    }
  }, [isAuthenticated])

  // Fetch collection when filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchCollection()
    }
  }, [tcgSystem, set, playset, page, sort, isAuthenticated])

  const fetchStats = async () => {
    try {
      const response = await collectionService.getStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const fetchFilters = async () => {
    try {
      const response = await collectionService.getFilters()
      if (response.success) {
        setFilters(response.data)
      }
    } catch (err) {
      console.error('Error fetching filters:', err)
    }
  }

  const fetchCollection = async () => {
    try {
      setLoading(true)
      const response = await collectionService.getCollection({
        tcgSystem: tcgSystem || undefined,
        set: set || undefined,
        playset: playset || undefined,
        page,
        limit: 24,
        sort
      })
      if (response.success) {
        setItems(response.data.items)
        setPagination(response.data.pagination)
      }
    } catch (err) {
      console.error('Error fetching collection:', err)
      setError(language === 'es' ? 'Error al cargar la coleccion' : 'Error loading collection')
    } finally {
      setLoading(false)
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

  if (!isAuthenticated) {
    return null
  }

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <span>📦</span>
          {language === 'es' ? 'Mi Coleccion' : 'My Collection'}
        </h1>
        {stats && (
          <p className="text-gray-600 dark:text-gray-400">
            {stats.total.uniqueCards.toLocaleString()} {language === 'es' ? 'cartas unicas' : 'unique cards'} •{' '}
            {stats.total.totalCopies.toLocaleString()} {language === 'es' ? 'copias totales' : 'total copies'}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Pokemon Stats */}
          <div className="card bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚡</span>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Pokemon</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Cartas unicas' : 'Unique cards'}</span>
                <p className="font-bold text-xl text-gray-900 dark:text-gray-100">{stats.bySystem.pokemon.uniqueCards}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Copias' : 'Copies'}</span>
                <p className="font-bold text-xl text-gray-900 dark:text-gray-100">{stats.bySystem.pokemon.totalCopies}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Playsets completos' : 'Complete playsets'}</span>
                <p className="font-bold text-green-600 dark:text-green-400">{stats.bySystem.pokemon.completePlaysets}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Incompletos' : 'Incomplete'}</span>
                <p className="font-bold text-amber-600 dark:text-amber-400">{stats.bySystem.pokemon.incompletePlaysets}</p>
              </div>
            </div>
          </div>

          {/* Riftbound Stats */}
          <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌀</span>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Riftbound</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Cartas unicas' : 'Unique cards'}</span>
                <p className="font-bold text-xl text-gray-900 dark:text-gray-100">{stats.bySystem.riftbound.uniqueCards}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Copias' : 'Copies'}</span>
                <p className="font-bold text-xl text-gray-900 dark:text-gray-100">{stats.bySystem.riftbound.totalCopies}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Playsets completos' : 'Complete playsets'}</span>
                <p className="font-bold text-green-600 dark:text-green-400">{stats.bySystem.riftbound.completePlaysets}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Incompletos' : 'Incomplete'}</span>
                <p className="font-bold text-amber-600 dark:text-amber-400">{stats.bySystem.riftbound.incompletePlaysets}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="card sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {language === 'es' ? 'Filtros' : 'Filters'}
              </h2>
              {(tcgSystem || set || playset) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {language === 'es' ? 'Limpiar' : 'Clear'}
                </button>
              )}
            </div>

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
                {filters?.tcgSystems?.map(sys => (
                  <option key={sys} value={sys}>{sys === 'pokemon' ? 'Pokemon' : 'Riftbound'}</option>
                ))}
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
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Playset Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Playset
              </label>
              <select
                value={playset}
                onChange={(e) => updateFilter('playset', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">{language === 'es' ? 'Todos' : 'All'}</option>
                <option value="complete">{language === 'es' ? 'Completos' : 'Complete'}</option>
                <option value="incomplete">{language === 'es' ? 'Incompletos' : 'Incomplete'}</option>
              </select>
            </div>

            {/* Sort */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'es' ? 'Ordenar por' : 'Sort by'}
              </label>
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="-updatedAt">{language === 'es' ? 'Recien agregado' : 'Recently added'}</option>
                <option value="updatedAt">{language === 'es' ? 'Primero agregado' : 'First added'}</option>
                <option value="cardName">{language === 'es' ? 'Nombre (A-Z)' : 'Name (A-Z)'}</option>
                <option value="-cardName">{language === 'es' ? 'Nombre (Z-A)' : 'Name (Z-A)'}</option>
                <option value="-quantity">{language === 'es' ? 'Mayor cantidad' : 'Most copies'}</option>
                <option value="quantity">{language === 'es' ? 'Menor cantidad' : 'Fewest copies'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Collection Grid */}
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
              {pagination.total} {language === 'es' ? 'cartas' : 'cards'} •{' '}
              {language === 'es' ? 'Pagina' : 'Page'} {pagination.page} {language === 'es' ? 'de' : 'of'} {pagination.pages}
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
          ) : items.length === 0 ? (
            <div className="card text-center py-12">
              <span className="text-4xl mb-4 block">📭</span>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {language === 'es' ? 'Tu coleccion esta vacia' : 'Your collection is empty'}
              </p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                <span>📚</span>
                {language === 'es' ? 'Explorar catalogo' : 'Browse catalog'}
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map(item => (
                <Link
                  key={item.cardId}
                  to={`/card/${item.cardId}`}
                  className="group bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden relative"
                >
                  <div className="aspect-[2.5/3.5] bg-gray-100 dark:bg-gray-700">
                    {item.cardImage && (
                      <img
                        src={item.cardImage}
                        alt={item.cardName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    )}
                  </div>
                  {/* Quantity Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                    item.hasPlayset
                      ? 'bg-green-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    x{item.quantity}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.cardName}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.cardSet}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {item.quantity}/{item.playsetMax}
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.hasPlayset ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (item.quantity / item.playsetMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {items.map(item => (
                <Link
                  key={item.cardId}
                  to={`/card/${item.cardId}`}
                  className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  {item.cardImage && (
                    <img
                      src={item.cardImage}
                      alt={item.cardName}
                      className="w-12 h-16 object-cover rounded"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.cardName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.cardSet}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className={`text-lg font-bold ${item.hasPlayset ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {item.quantity}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">/{item.playsetMax}</span>
                    </div>
                    {item.hasPlayset && (
                      <span className="text-green-500 text-xl" title={language === 'es' ? 'Playset completo' : 'Playset complete'}>✓</span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.tcgSystem === 'pokemon'
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                        : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                    }`}>
                      {item.tcgSystem}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
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
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum
                  if (pagination.pages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i
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
                onClick={() => updateFilter('page', String(Math.min(pagination.pages, page + 1)))}
                disabled={page === pagination.pages}
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

export default Collection

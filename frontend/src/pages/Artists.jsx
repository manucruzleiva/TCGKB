import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

const Artists = () => {
  const { language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Filter states from URL
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const sortBy = searchParams.get('sortBy') || 'fanCount'

  // Fetch artists
  useEffect(() => {
    fetchArtists()
  }, [search, page, sortBy])

  const fetchArtists = async () => {
    try {
      setLoading(true)
      const response = await api.get('/artists', {
        params: {
          search: search || undefined,
          page,
          limit: 50,
          sortBy
        }
      })
      if (response.data.success) {
        setArtists(response.data.data.artists)
        setPagination(response.data.data.pagination)
      }
    } catch (err) {
      console.error('Error fetching artists:', err)
      setError(language === 'es' ? 'Error al cargar artistas' : 'Error loading artists')
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

  const handleSearch = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    updateFilter('search', formData.get('search'))
  }

  const handleToggleFan = async (e, artistName) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) return

    try {
      const response = await api.post('/artists/toggle-fan', { artistName })
      if (response.data.success) {
        // Update local state
        setArtists(prev => prev.map(artist => {
          if (artist.artistName === artistName) {
            return {
              ...artist,
              fanCount: response.data.data.fanCount,
              isFan: response.data.data.isFan
            }
          }
          return artist
        }))
      }
    } catch (err) {
      console.error('Error toggling fan:', err)
    }
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {language === 'es' ? 'Artistas' : 'Artists'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'es'
              ? `${pagination.total} artistas encontrados`
              : `${pagination.total} artists found`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder={language === 'es' ? 'Buscar artista...' : 'Search artist...'}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'es' ? 'Ordenar:' : 'Sort:'}
            </label>
            <select
              value={sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="fanCount">{language === 'es' ? 'Popularidad' : 'Popularity'}</option>
              <option value="cardCount">{language === 'es' ? 'Cartas' : 'Cards'}</option>
              <option value="name">{language === 'es' ? 'Nombre' : 'Name'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Artists Grid */}
      {!loading && artists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {artists.map((artist) => (
            <Link
              key={artist.artistName}
              to={`/artist/${encodeURIComponent(artist.artistName)}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {artist.artistName}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {artist.cardCount}
                    </span>
                    <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      {artist.fanCount}
                    </span>
                  </div>
                  {/* TCG badges */}
                  <div className="flex gap-1 mt-2">
                    {artist.tcgSystems?.includes('pokemon') && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                        Pokemon
                      </span>
                    )}
                    {artist.tcgSystems?.includes('riftbound') && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                        Riftbound
                      </span>
                    )}
                  </div>
                </div>
                {isAuthenticated && (
                  <button
                    onClick={(e) => handleToggleFan(e, artist.artistName)}
                    className={`p-2 rounded-full transition-colors ${
                      artist.isFan
                        ? 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30'
                        : 'text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                    }`}
                    title={artist.isFan
                      ? (language === 'es' ? 'Dejar de seguir' : 'Unfollow')
                      : (language === 'es' ? 'Seguir' : 'Follow')}
                  >
                    <svg className="w-5 h-5" fill={artist.isFan ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && artists.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {language === 'es' ? 'No se encontraron artistas' : 'No artists found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'es'
              ? 'Intenta con otro término de búsqueda'
              : 'Try a different search term'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => updateFilter('page', String(page - 1))}
            disabled={page <= 1}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {language === 'es' ? 'Anterior' : 'Previous'}
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => updateFilter('page', String(page + 1))}
            disabled={page >= pagination.totalPages}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {language === 'es' ? 'Siguiente' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Artists

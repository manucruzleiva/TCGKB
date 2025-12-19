import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

const ArtistDetail = () => {
  const { artistName } = useParams()
  const { language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [artist, setArtist] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  // Filter states from URL
  const page = parseInt(searchParams.get('page') || '1')
  const tcgSystem = searchParams.get('tcgSystem') || ''

  // Decode artist name
  const decodedArtistName = decodeURIComponent(artistName || '')

  // Fetch artist cards
  useEffect(() => {
    if (decodedArtistName) {
      fetchArtistCards()
    }
  }, [decodedArtistName, page, tcgSystem])

  const fetchArtistCards = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/artists/cards/${encodeURIComponent(decodedArtistName)}`, {
        params: {
          page,
          limit: 24,
          tcgSystem: tcgSystem || undefined
        }
      })
      if (response.data.success) {
        setArtist(response.data.data.artist)
        setCards(response.data.data.cards)
        setPagination(response.data.data.pagination)
      }
    } catch (err) {
      console.error('Error fetching artist cards:', err)
      setError(language === 'es' ? 'Error al cargar cartas del artista' : 'Error loading artist cards')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFan = async () => {
    if (!isAuthenticated || !artist) return

    try {
      const response = await api.post('/artists/toggle-fan', { artistName: decodedArtistName })
      if (response.data.success) {
        setArtist(prev => ({
          ...prev,
          fanCount: response.data.data.fanCount,
          isFan: response.data.data.isFan
        }))
      }
    } catch (err) {
      console.error('Error toggling fan:', err)
    }
  }

  const updateFilter = (key, value) => {
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
      {/* Back Link */}
      <Link
        to="/artists"
        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {language === 'es' ? 'Volver a Artistas' : 'Back to Artists'}
      </Link>

      {/* Artist Header */}
      {artist && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {artist.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {artist.cardCount} {language === 'es' ? 'cartas' : 'cards'}
                </span>
                <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {artist.fanCount} {language === 'es' ? 'fans' : 'fans'}
                </span>
              </div>
            </div>

            {isAuthenticated && (
              <button
                onClick={handleToggleFan}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  artist.isFan
                    ? 'bg-pink-600 text-white hover:bg-pink-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:text-pink-600 dark:hover:text-pink-400'
                }`}
              >
                <svg className="w-5 h-5" fill={artist.isFan ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {artist.isFan
                  ? (language === 'es' ? 'Siguiendo' : 'Following')
                  : (language === 'es' ? 'Seguir' : 'Follow')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'es' ? 'Filtrar por TCG:' : 'Filter by TCG:'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => updateFilter('tcgSystem', '')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                !tcgSystem
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {language === 'es' ? 'Todos' : 'All'}
            </button>
            <button
              onClick={() => updateFilter('tcgSystem', 'pokemon')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                tcgSystem === 'pokemon'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
              }`}
            >
              Pokemon
            </button>
            <button
              onClick={() => updateFilter('tcgSystem', 'riftbound')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                tcgSystem === 'riftbound'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/50'
              }`}
            >
              Riftbound
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Cards Grid */}
      {!loading && cards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {cards.map((card) => (
            <Link
              key={card.id}
              to={`/card/${card.id}`}
              className="group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[2.5/3.5] relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* TCG Badge */}
                <span className={`absolute top-1 right-1 px-1.5 py-0.5 text-xs font-medium rounded ${
                  card.tcgSystem === 'pokemon'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-purple-600 text-white'
                }`}>
                  {card.tcgSystem === 'pokemon' ? 'PKM' : 'RB'}
                </span>
              </div>
              <div className="p-2">
                <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                  {card.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {card.set}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && cards.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {language === 'es' ? 'No se encontraron cartas' : 'No cards found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'es'
              ? 'Este artista no tiene cartas en el sistema'
              : 'This artist has no cards in the system'}
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

export default ArtistDetail

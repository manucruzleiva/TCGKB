import { useState, useEffect, useCallback, useRef } from 'react'
import { cardService } from '../../services/cardService'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { cache } from '../../utils/cache'
import CardItem from './CardItem'
import Spinner from '../common/Spinner'

const CardGrid = ({ searchTerm, onLoadingChange, onCancelAvailable }) => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [showingCached, setShowingCached] = useState(false)
  const loadingRef = useRef(false)
  const abortControllerRef = useRef(null)

  // Load cards with cache
  const loadCards = useCallback(async (searchName, pageNum, append = false) => {
    // Prevent duplicate requests
    if (loadingRef.current && !append) return

    const cacheKey = `cards_${searchName}_${pageNum}`

    try {
      // Try to load from cache first (only for first page)
      if (pageNum === 1 && !append) {
        const cached = cache.get(cacheKey)
        if (cached) {
          setCards(cached.data.cards || [])
          setTotalCount(cached.data.pagination?.totalCount || 0)
          setShowingCached(!cached.isStale)

          // If cache is fresh (< 5 min), don't fetch
          if (cached.age < 5 * 60 * 1000) {
            return
          }
        }
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()

      // Pass cancel function to parent
      onCancelAvailable?.(() => {
        abortControllerRef.current?.abort()
      })

      loadingRef.current = true
      setLoading(true)
      onLoadingChange?.(true)
      setError(null)

      const response = await cardService.getCards(searchName, pageNum, 20, abortControllerRef.current.signal)
      const { cards: newCards, pagination } = response.data

      // Cache the results (only first page)
      if (pageNum === 1) {
        cache.set(cacheKey, { cards: newCards, pagination })
      }

      if (append) {
        setCards(prev => [...prev, ...newCards])
      } else {
        setCards(newCards)
      }

      setTotalCount(pagination.totalCount)
      setHasMore(newCards.length > 0 && cards.length + newCards.length < pagination.totalCount)
      setShowingCached(false)
    } catch (err) {
      // Check if error is from user cancellation
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log('Search canceled by user')
      } else {
        setError(err.response?.data?.message || 'Error cargando cartas. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
      loadingRef.current = false
      onLoadingChange?.(false)
      onCancelAvailable?.(null)
      abortControllerRef.current = null
    }
  }, [onLoadingChange, onCancelAvailable, cards.length])

  // Initial load and search term change with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setCards([])
      setHasMore(true)
      loadCards(searchTerm, 1, false)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load more cards
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadCards(searchTerm, nextPage, true)
    }
  }, [loading, hasMore, page, searchTerm, loadCards])

  // Infinite scroll ref
  const lastCardRef = useInfiniteScroll(loadMore, hasMore, loading)

  if (error && cards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => loadCards(searchTerm, 1, false)}
          className="btn-primary"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  if (cards.length === 0 && !loading && !showingCached) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          {searchTerm ? 'No se encontraron cartas' : 'Cargando cartas...'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Cache indicator and results count */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Mostrando {cards.length} de {totalCount} resultados
          </p>
          {showingCached && (
            <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              📦 Datos en caché
            </p>
          )}
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {cards.map((card, index) => {
          if (index === cards.length - 1) {
            return (
              <div key={card.id} ref={lastCardRef}>
                <CardItem card={card} />
              </div>
            )
          }
          return <CardItem key={card.id} card={card} />
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* End message */}
      {!hasMore && cards.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Has visto todas las cartas</p>
        </div>
      )}
    </div>
  )
}

export default CardGrid

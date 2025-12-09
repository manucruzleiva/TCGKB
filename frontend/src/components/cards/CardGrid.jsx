import { useState, useEffect, useCallback } from 'react'
import { cardService } from '../../services/cardService'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import CardItem from './CardItem'
import Spinner from '../common/Spinner'

const CardGrid = ({ searchTerm }) => {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Load cards
  const loadCards = useCallback(async (searchName, pageNum, append = false) => {
    try {
      setLoading(true)
      setError(null)

      const response = await cardService.getCards(searchName, pageNum, 20)
      const { cards: newCards, pagination } = response.data

      if (append) {
        setCards(prev => [...prev, ...newCards])
      } else {
        setCards(newCards)
      }

      setTotalCount(pagination.totalCount)
      setHasMore(cards.length + newCards.length < pagination.totalCount)
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading cards')
      console.error('Error loading cards:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and search term change
  useEffect(() => {
    setPage(1)
    setCards([])
    setHasMore(true)
    loadCards(searchTerm, 1, false)
  }, [searchTerm, loadCards])

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

  if (error) {
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

  if (cards.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          {searchTerm ? 'No se encontraron cartas' : 'No hay cartas disponibles'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Results count */}
      {totalCount > 0 && (
        <p className="text-sm text-gray-600 mb-4">
          Mostrando {cards.length} de {totalCount} resultados
        </p>
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

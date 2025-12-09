import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { cardService } from '../services/cardService'
import CardDetail from '../components/cards/CardDetail'
import CommentList from '../components/comments/CommentList'
import Spinner from '../components/common/Spinner'

const CardDetails = () => {
  const { cardId } = useParams()
  const [card, setCard] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await cardService.getCardById(cardId)
        setCard(response.data.card)
        setStats(response.data.stats)
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading card')
        console.error('Error fetching card:', err)
      } finally {
        setLoading(false)
      }
    }

    if (cardId) {
      fetchCard()
    }
  }, [cardId])

  if (loading) {
    return (
      <div className="text-center py-12">
        <Spinner size="lg" />
        <p className="text-gray-500 mt-4">Cargando carta...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4 text-lg">{error}</div>
        <Link to="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/" className="text-primary-600 hover:text-primary-700">
          ← Volver a búsqueda
        </Link>
      </div>

      <CardDetail card={card} stats={stats} />

      {/* Comments section */}
      <div className="mt-8">
        <CommentList cardId={cardId} />
      </div>
    </div>
  )
}

export default CardDetails

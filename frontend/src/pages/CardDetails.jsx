import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { cardService } from '../services/cardService'
import CardDetail from '../components/cards/CardDetail'
import CommentList from '../components/comments/CommentList'
import Spinner from '../components/common/Spinner'
import { useLanguage } from '../contexts/LanguageContext'

const CardDetails = () => {
  const { cardId } = useParams()
  const { t } = useLanguage()
  const [card, setCard] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [alternateArts, setAlternateArts] = useState([])
  const [loadingAlternates, setLoadingAlternates] = useState(false)

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await cardService.getCardById(cardId)
        setCard(response.data.card)
        setStats(response.data.stats)

        // Fetch alternate arts in background
        fetchAlternateArts(cardId)
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading card')
        console.error('Error fetching card:', err)
      } finally {
        setLoading(false)
      }
    }

    const fetchAlternateArts = async (id) => {
      try {
        setLoadingAlternates(true)
        const response = await cardService.getCardAlternateArts(id)
        setAlternateArts(response.data.allArts || [])
      } catch (err) {
        console.error('Error fetching alternate arts:', err)
        setAlternateArts([])
      } finally {
        setLoadingAlternates(false)
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
        <p className="text-gray-500 dark:text-gray-400 mt-4">{t('pages.cardDetails.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 dark:text-red-400 mb-4 text-lg">{error}</div>
        <Link to="/" className="btn-primary">
          {t('pages.cardDetails.backToHome')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <CardDetail card={card} stats={stats} cardId={cardId} alternateArts={alternateArts} />
    </div>
  )
}

export default CardDetails

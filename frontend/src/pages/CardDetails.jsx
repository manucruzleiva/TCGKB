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
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
          ← {t('pages.cardDetails.backToSearch')}
        </Link>
      </div>

      <CardDetail card={card} stats={stats} cardId={cardId} />
    </div>
  )
}

export default CardDetails

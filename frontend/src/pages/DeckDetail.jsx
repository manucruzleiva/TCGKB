import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import { deckService } from '../services/deckService'
import CommentList from '../components/comments/CommentList'
import Spinner from '../components/common/Spinner'
import VoteButtons from '../components/decks/VoteButtons'

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

const DeckDetail = () => {
  const { deckId } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { language, t } = useLanguage()
  const { formatDate, timeAgo } = useDateFormat()
  const navigate = useNavigate()

  const [deck, setDeck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copying, setCopying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)

  const isOwner = user && deck && (deck.userId._id === user._id || deck.userId === user._id)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchDeck()
  }, [deckId])

  const fetchDeck = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await deckService.getDeck(deckId)
      if (response.success) {
        setDeck(response.data.deck)
      }
    } catch (err) {
      console.error('Error fetching deck:', err)
      if (err.response?.status === 404) {
        setError(t('decks.detail.notFound'))
      } else if (err.response?.status === 403) {
        setError(t('decks.detail.noAccess'))
      } else {
        setError(t('decks.detail.errorLoading'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      setCopying(true)
      const response = await deckService.copyDeck(deckId)
      if (response.success) {
        navigate(`/decks/${response.data.deck._id}/edit`)
      }
    } catch (err) {
      console.error('Error copying deck:', err)
      alert(t('decks.detail.errorCopying'))
    } finally {
      setCopying(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await deckService.exportDeck(deckId)
      if (response.success) {
        navigator.clipboard.writeText(response.data.deckList)
        alert(t('decks.detail.copiedToClipboard'))
      }
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await deckService.deleteDeck(deckId)
      navigate('/decks')
    } catch (err) {
      console.error('Delete error:', err)
      alert(t('decks.detail.errorDeleting'))
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Calculate stats
  const getTotalCards = () => deck?.cards?.reduce((sum, c) => sum + c.quantity, 0) || 0
  const getPokemonCount = () => deck?.cards?.filter(c => c.supertype === 'Pokémon').reduce((sum, c) => sum + c.quantity, 0) || 0
  const getTrainerCount = () => deck?.cards?.filter(c => c.supertype === 'Trainer').reduce((sum, c) => sum + c.quantity, 0) || 0
  const getEnergyCount = () => deck?.cards?.filter(c => c.supertype === 'Energy').reduce((sum, c) => sum + c.quantity, 0) || 0

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/50 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">😢</div>
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">{error}</h2>
          <Link
            to="/decks"
            className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {t('decks.detail.backToDecks')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/decks"
          className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-2 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('decks.detail.backToDecks')}
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {deck.name}
              </h1>
              {deck.format && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${FORMAT_COLORS[deck.format]}`}>
                  {FORMAT_LABELS[deck.format][language]}
                </span>
              )}
              {!deck.isPublic && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  🔒 {t('decks.private')}
                </span>
              )}
              {deck.isOriginal && (
                <span
                  className="px-2 py-1 rounded-full text-sm bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                  title={t('decks.originalBadge.tooltip')}
                >
                  🏆
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span>👤</span>
                {deck.userId?.username || 'Unknown'}
              </span>
              <span>📅 {formatDate(deck.createdAt)}</span>
              <span>👁 {deck.views || 0} {t('decks.detail.views')}</span>
              <span>📋 {deck.copies || 0} {t('decks.detail.copies')}</span>
            </div>
            <div className="mt-3">
              <VoteButtons deckId={deckId} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t('decks.detail.export')}
            </button>
            {!isOwner && (
              <button
                onClick={handleCopy}
                disabled={copying}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {copying ? <Spinner size="sm" /> : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                {t('decks.detail.copyDeck')}
              </button>
            )}
            {(isOwner || isAdmin) && (
              <>
                <Link
                  to={`/decks/${deckId}/edit`}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('decks.detail.edit')}
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t('decks.detail.delete')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description and Tags */}
      {(deck.description || deck.tags?.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          {deck.description && (
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
              {deck.description}
            </p>
          )}
          {deck.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deck.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Deck View */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t('decks.detail.cards')} ({getTotalCards()})
              </h2>
            </div>

            {deck.cards?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('decks.detail.emptyDeck')}
              </div>
            ) : (
              <div className="space-y-6">
                {['Pokémon', 'Trainer', 'Energy'].map(supertype => {
                  const supertypeCards = deck.cards?.filter(c => c.supertype === supertype) || []
                  if (supertypeCards.length === 0) return null

                  return (
                    <div key={supertype}>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                        {supertype} ({supertypeCards.reduce((sum, c) => sum + c.quantity, 0)})
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {supertypeCards.map(card => (
                          <div
                            key={card.cardId}
                            className="relative group cursor-pointer"
                            onClick={() => setSelectedCard(selectedCard === card.cardId ? null : card.cardId)}
                          >
                            {card.imageSmall ? (
                              <img
                                src={card.imageSmall}
                                alt={card.name}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-500 transition-colors"
                              />
                            ) : (
                              <div className="aspect-[63/88] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-500 text-center px-1">{card.name}</span>
                              </div>
                            )}
                            <div className="absolute top-1 right-1 px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                              ×{card.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <CommentList
              deckId={deckId}
              targetType="deck"
            />
          </div>
        </div>

        {/* Sidebar - Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('decks.detail.stats')}
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className={`font-bold text-lg ${getTotalCards() === 60 ? 'text-green-600' : getTotalCards() > 60 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                  {getTotalCards()}/60
                </span>
              </div>

              {/* Visual breakdown */}
              {getTotalCards() > 0 && (
                <div className="h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
                  <div
                    className="bg-blue-500"
                    style={{ width: `${(getPokemonCount() / getTotalCards()) * 100}%` }}
                    title={`Pokémon: ${getPokemonCount()}`}
                  />
                  <div
                    className="bg-purple-500"
                    style={{ width: `${(getTrainerCount() / getTotalCards()) * 100}%` }}
                    title={`Trainer: ${getTrainerCount()}`}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{ width: `${(getEnergyCount() / getTotalCards()) * 100}%` }}
                    title={`Energy: ${getEnergyCount()}`}
                  />
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Pokémon
                  </span>
                  <span className="font-semibold">{getPokemonCount()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    Trainer
                  </span>
                  <span className="font-semibold">{getTrainerCount()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    Energy
                  </span>
                  <span className="font-semibold">{getEnergyCount()}</span>
                </div>
              </div>

              {/* Deck Status */}
              {getTotalCards() !== 60 && (
                <div className={`p-3 rounded-lg ${getTotalCards() < 60 ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                  <p className="text-sm">
                    {getTotalCards() < 60
                      ? t('decks.detail.missingCards').replace('{count}', 60 - getTotalCards())
                      : t('decks.detail.overLimit').replace('{count}', getTotalCards() - 60)}
                  </p>
                </div>
              )}

              {getTotalCards() === 60 && (
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                  <p className="text-sm flex items-center gap-2">
                    <span>✓</span>
                    {t('decks.detail.deckComplete')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('decks.detail.deleteConfirm.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('decks.detail.deleteConfirm.message')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {t('decks.detail.deleteConfirm.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <Spinner size="sm" />}
                {t('decks.detail.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeckDetail

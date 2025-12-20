import { useState, useEffect, useContext } from 'react'
import { deckService } from '../../services/deckService'
import { useSocket } from '../../contexts/SocketContext'
import { LanguageContext } from '../../contexts/LanguageContext'

/**
 * Vote buttons component for decks (thumbs up/down)
 * @param {string} deckId - The deck ID to vote on
 * @param {boolean} compact - Use compact styling
 */
const VoteButtons = ({ deckId, compact = false }) => {
  const { t } = useContext(LanguageContext)
  const [counts, setCounts] = useState({ up: 0, down: 0 })
  const [userVote, setUserVote] = useState(null)
  const [loading, setLoading] = useState(false)
  const { socket } = useSocket()

  useEffect(() => {
    if (deckId) {
      loadVotes()
    }
  }, [deckId])

  useEffect(() => {
    if (!socket) return

    const handleVoteUpdate = (data) => {
      if (data.deckId === deckId) {
        setCounts(data.counts)
      }
    }

    socket.on('deck:vote:updated', handleVoteUpdate)

    return () => {
      socket.off('deck:vote:updated', handleVoteUpdate)
    }
  }, [socket, deckId])

  const loadVotes = async () => {
    try {
      const response = await deckService.getVotes(deckId)
      if (response.success) {
        setCounts(response.data.counts)
        setUserVote(response.data.userVote)
      }
    } catch (error) {
      console.error('Error loading votes:', error)
    }
  }

  const handleVote = async (vote) => {
    if (loading) return

    try {
      setLoading(true)
      const response = await deckService.vote(deckId, vote)

      if (response.success) {
        setCounts(response.data.counts)
        setUserVote(response.data.userVote)
      }
    } catch (error) {
      console.error('Error voting:', error)
      loadVotes()
    } finally {
      setLoading(false)
    }
  }

  const score = counts.up - counts.down

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {/* Upvote button */}
      <button
        onClick={() => handleVote('up')}
        disabled={loading}
        title={t('decks.vote.upvote')}
        className={`
          ${compact ? 'px-2 py-1' : 'px-3 py-1.5'}
          rounded-lg flex items-center gap-1.5 transition-all
          ${userVote === 'up'
            ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border border-green-500'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 border border-transparent'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <svg
          className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
          {counts.up}
        </span>
      </button>

      {/* Downvote button */}
      <button
        onClick={() => handleVote('down')}
        disabled={loading}
        title={t('decks.vote.downvote')}
        className={`
          ${compact ? 'px-2 py-1' : 'px-3 py-1.5'}
          rounded-lg flex items-center gap-1.5 transition-all
          ${userVote === 'down'
            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-500'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border border-transparent'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <svg
          className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
          />
        </svg>
        <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
          {counts.down}
        </span>
      </button>
    </div>
  )
}

export default VoteButtons

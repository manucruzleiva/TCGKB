import { useState, useEffect } from 'react'
import { commentService } from '../../services/commentService'
import { useSocket } from '../../contexts/SocketContext'
import { useLanguage } from '../../contexts/LanguageContext'
import CommentItem from './CommentItem'
import CommentComposer from './CommentComposer'
import Spinner from '../common/Spinner'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más nuevos' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'popular', label: 'Más populares' }
]

const CommentList = ({ cardId, deckId, targetType = 'card', contextCard = null }) => {
  const { t } = useLanguage()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
  const { socket, joinCardRoom, leaveCardRoom } = useSocket()

  const targetId = targetType === 'deck' ? deckId : cardId

  useEffect(() => {
    loadComments()

    // Join socket room for real-time updates
    if (targetId) {
      joinCardRoom(targetId) // Using same room mechanism for now
    }

    return () => {
      if (targetId) {
        leaveCardRoom(targetId)
      }
    }
  }, [targetId, sortBy])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewComment = (data) => {
      if (!data.parentId) {
        // Top-level comment - check if it already exists (prevent duplicates)
        setComments(prev => {
          const exists = prev.some(c => c._id === data.comment._id)
          if (exists) return prev

          if (sortBy === 'newest') {
            return [data.comment, ...prev]
          }
          return prev // Will reload for other sort orders
        })

        if (sortBy !== 'newest') {
          loadComments() // Reload to maintain sort order
        }
      } else {
        // Reply - reload to get updated tree
        loadComments()
      }
    }

    const handleCommentReply = () => {
      loadComments()
    }

    const handleCommentHidden = () => {
      loadComments()
    }

    const handleCommentDeleted = (data) => {
      setComments(prev => prev.filter(c => c._id !== data.commentId))
    }

    socket.on('comment:new', handleNewComment)
    socket.on('comment:reply', handleCommentReply)
    socket.on('comment:hidden', handleCommentHidden)
    socket.on('comment:deleted', handleCommentDeleted)

    return () => {
      socket.off('comment:new', handleNewComment)
      socket.off('comment:reply', handleCommentReply)
      socket.off('comment:hidden', handleCommentHidden)
      socket.off('comment:deleted', handleCommentDeleted)
    }
  }, [socket, sortBy])

  const loadComments = async () => {
    try {
      setLoading(true)
      setError(null)

      let response
      if (targetType === 'deck') {
        response = await commentService.getCommentsByDeck(deckId, 1, 50, sortBy)
      } else {
        response = await commentService.getCommentsByCard(cardId, 1, 50, sortBy)
      }
      setComments(response.data.comments)
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading comments')
      console.error('Error loading comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentAdded = (newComment) => {
    if (!newComment.parentId) {
      // Check if it already exists (socket may have added it)
      setComments(prev => {
        const exists = prev.some(c => c._id === newComment._id)
        if (exists) return prev

        if (sortBy === 'newest') {
          return [newComment, ...prev]
        }
        return prev
      })

      if (sortBy !== 'newest') {
        loadComments()
      }
    } else {
      loadComments() // Reload to update tree
    }
  }

  const handleCommentDeleted = (commentId) => {
    setComments(prev => prev.filter(c => c._id !== commentId))
  }

  if (loading && comments.length === 0) {
    return (
      <div className="text-center py-8">
        <Spinner size="md" />
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t('comments.loadingComments')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button onClick={loadComments} className="btn-primary">
          {t('common.retry')}
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Comment composer */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('comments.leaveComment')}</h3>
        <CommentComposer
          cardId={cardId}
          deckId={deckId}
          targetType={targetType}
          contextCard={contextCard}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Comments list header with sorting */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('comments.title')} ({comments.length})
        </h3>

        {comments.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {t('comments.noCommentsPrompt')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              cardId={cardId}
              deckId={deckId}
              targetType={targetType}
              onCommentAdded={handleCommentAdded}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentList

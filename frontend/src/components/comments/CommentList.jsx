import { useState, useEffect } from 'react'
import { commentService } from '../../services/commentService'
import { useSocket } from '../../contexts/SocketContext'
import { useLanguage } from '../../contexts/LanguageContext'
import CommentItem from './CommentItem'
import CommentComposer from './CommentComposer'
import Spinner from '../common/Spinner'

const CommentList = ({ cardId }) => {
  const { t } = useLanguage()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { socket, joinCardRoom, leaveCardRoom } = useSocket()

  useEffect(() => {
    loadComments()

    // Join socket room for real-time updates
    if (cardId) {
      joinCardRoom(cardId)
    }

    return () => {
      if (cardId) {
        leaveCardRoom(cardId)
      }
    }
  }, [cardId])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewComment = (data) => {
      if (!data.parentId) {
        // Top-level comment
        setComments(prev => [data.comment, ...prev])
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
  }, [socket])

  const loadComments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await commentService.getCommentsByCard(cardId)
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
      setComments(prev => [newComment, ...prev])
    } else {
      loadComments() // Reload to update tree
    }
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
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Comments list */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {t('comments.title')} ({comments.length})
        </h3>

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
                onCommentAdded={handleCommentAdded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentList

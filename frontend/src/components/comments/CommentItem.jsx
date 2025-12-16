import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDateFormat } from '../../contexts/DateFormatContext'
import { commentService } from '../../services/commentService'
import CommentComposer from './CommentComposer'
import CommentReactions from './CommentReactions'
import Button from '../common/Button'

const CommentItem = ({ comment, cardId, onCommentAdded, level = 0 }) => {
  const { user, isAdmin } = useAuth()
  const { timeAgo } = useDateFormat()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [localComment, setLocalComment] = useState(comment)
  const [deleting, setDeleting] = useState(false)

  const isOwnComment = user && localComment.userId._id === user.id
  const canDelete = isOwnComment && isWithinGracePeriod(localComment.createdAt)

  // Check if within 5 minute grace period
  function isWithinGracePeriod(createdAt) {
    const gracePeriod = 5 * 60 * 1000 // 5 minutes
    const timeSince = Date.now() - new Date(createdAt).getTime()
    return timeSince < gracePeriod
  }

  const handleReply = () => {
    setShowReplyForm(!showReplyForm)
  }

  const handleHideToggle = async () => {
    try {
      const newHiddenState = !localComment.isHiddenByUser
      await commentService.hideComment(localComment._id, newHiddenState)
      setLocalComment({
        ...localComment,
        isHiddenByUser: newHiddenState
      })
    } catch (error) {
      console.error('Error hiding comment:', error)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este comentario? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setDeleting(true)
      await commentService.deleteComment(localComment._id)
      // The component will be removed via socket event or parent refresh
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar comentario')
      setDeleting(false)
    }
  }

  const handleReplyAdded = (newReply) => {
    setLocalComment({
      ...localComment,
      replies: [...(localComment.replies || []), newReply]
    })
    setShowReplyForm(false)

    if (onCommentAdded) {
      onCommentAdded(newReply)
    }
  }

  // Render card mentions as links
  const renderContent = () => {
    let content = localComment.content

    if (localComment.cardMentions && localComment.cardMentions.length > 0) {
      localComment.cardMentions.forEach(mention => {
        const mentionText = `@${mention.cardName}`
        const link = `<a href="/card/${mention.cardId}" class="text-primary-600 hover:text-primary-700 font-medium">${mentionText}</a>`
        content = content.replace(mentionText, link)
      })
    }

    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }

  // User hidden comment
  if (localComment.isHiddenByUser && !isOwnComment) {
    return (
      <div className="border-l-4 border-gray-300 pl-4 mb-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500 text-sm flex items-center gap-2">
            <span>👁️‍🗨️</span>
            <span>Comentario escondido por el autor</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary-600 hover:text-primary-700 text-xs ml-2"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </button>
          </p>
          {isExpanded && (
            <div className="mt-3 text-gray-600">
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Admin moderated comment
  if (localComment.isModerated) {
    return (
      <div className="border-l-4 border-yellow-500 pl-4 mb-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-700 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">Comentario moderado por administrador</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary-600 hover:text-primary-700 text-xs ml-2"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </button>
          </p>
          {localComment.moderationReason && (
            <p className="text-yellow-600 text-xs mt-1">
              Razón: {localComment.moderationReason}
            </p>
          )}
          {isExpanded && (
            <div className="mt-3 text-gray-600">
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`${level > 0 ? 'ml-6 md:ml-8 border-l-2 border-gray-200 pl-4' : ''} mb-4`}>
      <div className="bg-white rounded-lg">
        {/* Comment header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">
                {localComment.userId.username}
              </span>
              {localComment.userId.role === 'admin' && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  Admin
                </span>
              )}
              {localComment.isHiddenByUser && isOwnComment && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  Escondido
                </span>
              )}
              <span className="text-gray-500 text-sm">
                {timeAgo(localComment.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Comment content */}
        <div className="text-gray-800 mb-2 whitespace-pre-wrap break-words">
          {renderContent()}
        </div>

        {/* Comment actions and reactions in same row */}
        <div className="flex items-center gap-4 flex-wrap text-sm mb-2">
          <button
            onClick={handleReply}
            className="text-gray-600 hover:text-primary-600 font-medium"
          >
            Responder
          </button>

          {isOwnComment && (
            <>
              <button
                onClick={handleHideToggle}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                {localComment.isHiddenByUser ? 'Mostrar' : 'Esconder'}
              </button>

              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              )}
            </>
          )}

          {level < 10 && localComment.replies && localComment.replies.length > 0 && (
            <span className="text-gray-500">
              {localComment.replies.length} {localComment.replies.length === 1 ? 'respuesta' : 'respuestas'}
            </span>
          )}

          {/* Reactions inline with actions */}
          <div className="ml-auto">
            <CommentReactions commentId={localComment._id} compact={true} />
          </div>
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-4">
            <CommentComposer
              cardId={cardId}
              parentId={localComment._id}
              onCommentAdded={handleReplyAdded}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}

        {/* Nested replies */}
        {localComment.replies && localComment.replies.length > 0 && (
          <div className="mt-4">
            {localComment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                cardId={cardId}
                onCommentAdded={onCommentAdded}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentItem

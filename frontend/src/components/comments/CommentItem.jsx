import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDateFormat } from '../../contexts/DateFormatContext'
import { commentService } from '../../services/commentService'
import { useLiveTimeAgo } from '../../hooks/useLiveTime'
import CommentComposer from './CommentComposer'
import CommentReactions from './CommentReactions'
import CardMentionLink from './CardMentionLink'

const CommentItem = ({ comment, cardId, onCommentAdded, level = 0 }) => {
  const { user, isAdmin } = useAuth()
  const { timeAgo } = useDateFormat()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [localComment, setLocalComment] = useState(comment)
  const [showModerateForm, setShowModerateForm] = useState(false)
  const [moderationReason, setModerationReason] = useState('')
  const [moderating, setModerating] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-updating relative time
  const liveTimeAgo = useLiveTimeAgo(localComment.createdAt, timeAgo)

  const isOwnComment = user && localComment.userId._id === user.id
  const hasReplies = localComment.replies && localComment.replies.length > 0

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

  const handleModerate = async () => {
    try {
      setModerating(true)
      await commentService.moderateComment(localComment._id, !localComment.isModerated, moderationReason)
      setLocalComment({
        ...localComment,
        isModerated: !localComment.isModerated,
        moderationReason: localComment.isModerated ? null : moderationReason
      })
      setShowModerateForm(false)
      setModerationReason('')
    } catch (error) {
      console.error('Error moderating comment:', error)
      alert(error.response?.data?.message || 'Error al moderar comentario')
    } finally {
      setModerating(false)
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

  // Render content with card mentions as interactive links
  const renderContent = () => {
    const content = localComment.content
    const mentions = localComment.cardMentions || []

    // Build a map of cardName to mention data for quick lookup
    const mentionsByName = new Map()
    mentions.forEach(m => {
      mentionsByName.set(m.cardName.toLowerCase(), m)
    })

    const parts = []
    let lastIndex = 0

    // Regex to find all mention patterns: [@CardName.AbilityName] or [@CardName] or @CardName
    const mentionRegex = /\[@([^\]]+)\]|@([\w\s-]+?)(?=\s|$|[.,!?;:])/g
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      const fullMatch = match[0]
      const insideBrackets = match[1] // Content inside [@...]
      const atMention = match[2] // Content after @ (old format)

      // Add text before this match
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${match.index}`}>{content.slice(lastIndex, match.index)}</span>)
      }

      let cardName, abilityName, abilityType

      if (insideBrackets) {
        // Parse [@CardName] or [@CardName.AbilityName]
        const dotIndex = insideBrackets.indexOf('.')
        if (dotIndex > 0) {
          cardName = insideBrackets.substring(0, dotIndex)
          abilityName = insideBrackets.substring(dotIndex + 1)
        } else {
          cardName = insideBrackets
        }
      } else if (atMention) {
        cardName = atMention.trim()
      }

      // Find the mention data for this card
      const mention = mentionsByName.get(cardName?.toLowerCase())

      if (mention) {
        // Use ability info from content if available, fallback to mention data
        parts.push(
          <CardMentionLink
            key={`mention-${match.index}`}
            cardId={mention.cardId}
            cardName={mention.cardName}
            abilityName={abilityName || mention.abilityName}
          />
        )
      } else {
        // No mention data found, render as styled text
        parts.push(
          <span
            key={`text-mention-${match.index}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            🃏 {cardName}{abilityName ? ` • ${abilityName}` : ''}
          </span>
        )
      }

      lastIndex = match.index + fullMatch.length
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(<span key="text-end">{content.slice(lastIndex)}</span>)
    }

    return parts.length > 0 ? <>{parts}</> : <span>{content}</span>
  }

  // Moderated comment - only admins see the original content
  if (localComment.isModerated && !isAdmin) {
    return (
      <div className={`${level > 0 ? 'ml-4 md:ml-6 pl-3 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
        <div className="py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="text-red-500">🚫</span>
            <span className="italic">Este comentario ha sido moderado</span>
            {localComment.moderationReason && (
              <span className="text-xs">- {localComment.moderationReason}</span>
            )}
          </div>
        </div>

        {hasReplies && (
          <div className="mt-2">
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
    )
  }

  // User hidden comment
  if (localComment.isHiddenByUser && !isOwnComment && !isAdmin) {
    return (
      <div className={`${level > 0 ? 'ml-4 md:ml-6 pl-3 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
        <div className="py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 italic">
            <span>👁️‍🗨️</span>
            <span>Comentario oculto por el autor</span>
          </div>
        </div>

        {hasReplies && (
          <div className="mt-2">
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
    )
  }

  // Determine background color based on status
  const getCommentBgClass = () => {
    if (localComment.isModerated && isAdmin) {
      return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 pl-3'
    }
    if (localComment.isHiddenByUser && (isOwnComment || isAdmin)) {
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 pl-3'
    }
    return ''
  }

  return (
    <div className={`${level > 0 ? 'ml-4 md:ml-6 pl-3 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
      <div className={`py-3 rounded-r ${getCommentBgClass()}`}>
        {/* Status badges */}
        {(localComment.isHiddenByUser || localComment.isModerated) && (
          <div className="flex gap-2 mb-2">
            {localComment.isHiddenByUser && (
              <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-0.5 rounded">
                👁️ Oculto públicamente
              </span>
            )}
            {localComment.isModerated && isAdmin && (
              <span className="inline-flex items-center gap-1 text-xs text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded">
                🚫 Moderado
              </span>
            )}
          </div>
        )}

        {/* Comment header */}
        <div className="flex items-center gap-2 mb-1">
          {/* User avatar */}
          <div className={`w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br ${localComment.userId.avatarBackground || 'from-primary-400 to-primary-600'} flex-shrink-0 flex items-center justify-center`}>
            {localComment.userId.avatar ? (
              <img
                src={localComment.userId.avatar}
                alt={localComment.userId.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">
                {localComment.userId.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <Link
            to={`/activity/${localComment.userId._id}`}
            className="font-semibold text-gray-900 dark:text-gray-100 text-sm hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
          >
            {localComment.userId.username}
          </Link>
          {/* Role badges - Mod and/or Dev */}
          {localComment.userId.role === 'admin' && (
            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs rounded font-medium">
              👑 Mod
            </span>
          )}
          {localComment.userId.isDev && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded font-medium">
              💻 Dev
            </span>
          )}
          <span className="text-gray-400 dark:text-gray-500 text-xs">
            {liveTimeAgo}
          </span>
        </div>

        {/* Comment content */}
        <div className="text-gray-700 dark:text-gray-300 text-sm mb-2 whitespace-pre-wrap break-words leading-relaxed">
          {renderContent()}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-3 text-xs">
          <CommentReactions commentId={localComment._id} compact={true} />

          <button
            onClick={handleReply}
            className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            Responder
          </button>

          {isOwnComment && (
            <button
              onClick={handleHideToggle}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {localComment.isHiddenByUser ? 'Mostrar' : 'Ocultar'}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowModerateForm(!showModerateForm)}
              className={localComment.isModerated
                ? 'text-green-600 hover:text-green-700'
                : 'text-orange-500 hover:text-orange-600'}
            >
              {localComment.isModerated ? 'Restaurar' : 'Moderar'}
            </button>
          )}

          {hasReplies && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <span className="transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
              <span>{localComment.replies.length} {localComment.replies.length === 1 ? 'respuesta' : 'respuestas'}</span>
            </button>
          )}
        </div>

        {/* Moderation form */}
        {showModerateForm && isAdmin && (
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
              {localComment.isModerated ? 'Restaurar comentario' : 'Moderar comentario'}
            </p>
            {!localComment.isModerated && (
              <input
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Razón (opcional)"
                className="w-full px-2 py-1 text-sm border border-orange-300 dark:border-orange-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-2"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={handleModerate}
                disabled={moderating}
                className="px-3 py-1 text-xs rounded text-white bg-orange-600 hover:bg-orange-700"
              >
                {moderating ? '...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setShowModerateForm(false)}
                className="px-3 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentComposer
              cardId={cardId}
              parentId={localComment._id}
              onCommentAdded={handleReplyAdded}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>

      {/* Nested replies - collapsible with animation */}
      {hasReplies && (
        <div
          className={`mt-1 overflow-hidden transition-all duration-300 ease-in-out ${
            isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'
          }`}
        >
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
  )
}

export default CommentItem

import { useState, useEffect } from 'react'
import { reactionService } from '../../services/reactionService'
import { useSocket } from '../../contexts/SocketContext'
import { useLanguage } from '../../contexts/LanguageContext'
import EmojiPicker from '../common/EmojiPicker'

const CommentReactions = ({ commentId, compact = false }) => {
  const { t } = useLanguage()
  const [reactions, setReactions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const { socket } = useSocket()

  useEffect(() => {
    loadReactions()
  }, [commentId])

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return

    const handleReactionUpdate = (data) => {
      if (data.targetType === 'comment' && data.targetId === commentId) {
        loadReactions()
      }
    }

    socket.on('reaction:updated', handleReactionUpdate)

    return () => {
      socket.off('reaction:updated', handleReactionUpdate)
    }
  }, [socket, commentId])

  const loadReactions = async () => {
    try {
      const response = await reactionService.getReactions('comment', commentId)
      setReactions(response.data.reactions)
      setTotal(response.data.total)
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }

  const handleEmojiSelect = async (emoji) => {
    const existingReaction = reactions.find(
      r => r.emoji === emoji && r.userReacted
    )

    try {
      setLoading(true)

      if (existingReaction) {
        // Remove reaction if clicking same emoji
        await reactionService.removeReaction('comment', commentId, emoji)

        setReactions(prev =>
          prev.map(r =>
            r.emoji === emoji
              ? { ...r, count: r.count - 1, userReacted: false }
              : r
          ).filter(r => r.count > 0)
        )
        setTotal(prev => prev - 1)
      } else {
        // Add or change reaction
        const response = await reactionService.addReaction('comment', commentId, emoji)

        // If backend changed the reaction (removed old one), update UI accordingly
        if (response.data.changed && response.data.previousEmoji) {
          // Remove previous emoji reaction
          setReactions(prev => {
            let updated = prev.map(r => {
              if (r.emoji === response.data.previousEmoji) {
                return { ...r, count: r.count - 1, userReacted: false }
              }
              return r
            }).filter(r => r.count > 0)

            // Add new emoji reaction
            const existing = updated.find(r => r.emoji === emoji)
            if (existing) {
              updated = updated.map(r =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, userReacted: true }
                  : r
              )
            } else {
              updated = [...updated, { emoji, count: 1, userReacted: true }]
            }

            return updated
          })
        } else {
          // Just add the new reaction
          setReactions(prev => {
            const existing = prev.find(r => r.emoji === emoji)
            if (existing) {
              return prev.map(r =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, userReacted: true }
                  : r
              )
            } else {
              return [...prev, { emoji, count: 1, userReacted: true }]
            }
          })
          setTotal(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
      // Reload reactions to ensure consistency
      loadReactions()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'} flex-wrap`}>
      {reactions.length > 0 && reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleEmojiSelect(reaction.emoji)}
          disabled={loading}
          className={`
            ${compact
              ? 'px-1.5 py-0.5 text-xs'
              : 'px-2 py-0.5 text-xs'
            }
            rounded-full flex items-center gap-1 transition-all
            ${reaction.userReacted
              ? 'bg-primary-100 dark:bg-primary-900 border border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent dark:border-gray-600'
            }
          `}
          title={reaction.userReacted ? t('reactions.change') : t('reactions.react')}
        >
          <span>{reaction.emoji}</span>
          <span className={`${compact ? 'text-xs' : ''} font-medium`}>{reaction.count}</span>
        </button>
      ))}

      <EmojiPicker
        onEmojiSelect={handleEmojiSelect}
        className={compact ? 'text-xs' : 'text-sm'}
      />
    </div>
  )
}

export default CommentReactions

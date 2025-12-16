import { useState, useEffect } from 'react'
import { reactionService } from '../../services/reactionService'
import { useSocket } from '../../contexts/SocketContext'
import { useLanguage } from '../../contexts/LanguageContext'
import EmojiPicker from '../common/EmojiPicker'

const CardReactions = ({ cardId }) => {
  const { t } = useLanguage()
  const [reactions, setReactions] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const { socket } = useSocket()

  useEffect(() => {
    loadReactions()
  }, [cardId])

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return

    const handleReactionUpdate = (data) => {
      if (data.targetType === 'card' && data.targetId === cardId) {
        loadReactions() // Reload to get fresh counts
      }
    }

    socket.on('reaction:updated', handleReactionUpdate)

    return () => {
      socket.off('reaction:updated', handleReactionUpdate)
    }
  }, [socket, cardId])

  const loadReactions = async () => {
    try {
      const response = await reactionService.getReactions('card', cardId)
      setReactions(response.data.reactions)
      setTotal(response.data.total)
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }

  const handleEmojiSelect = async (emoji) => {
    // Find if user already reacted with this emoji
    const existingReaction = reactions.find(
      r => r.emoji === emoji && r.userReacted
    )

    try {
      setLoading(true)

      if (existingReaction) {
        // Remove reaction
        await reactionService.removeReaction('card', cardId, emoji)

        // Optimistic update
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
        const response = await reactionService.addReaction('card', cardId, emoji)

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
      // Reload on error to sync state
      loadReactions()
    } finally {
      setLoading(false)
    }
  }

  if (reactions.length === 0 && total === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{t('comments.beFirst')}</span>
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleEmojiSelect(reaction.emoji)}
          disabled={loading}
          className={`
            px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-all
            ${reaction.userReacted
              ? 'bg-primary-100 dark:bg-primary-900 border-2 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent'
            }
          `}
          title={reaction.userReacted ? t('reactions.change') : t('reactions.react')}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Add new reaction */}
      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
    </div>
  )
}

export default CardReactions

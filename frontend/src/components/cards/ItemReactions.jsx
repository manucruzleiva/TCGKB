import { useState, useEffect } from 'react'
import { reactionService } from '../../services/reactionService'
import { useSocket } from '../../contexts/SocketContext'

const THUMBS = ['👍', '👎']

/**
 * Generic reaction component for attacks and abilities
 * @param {string} targetType - 'attack' or 'ability'
 * @param {string} targetId - Format: cardId_type_index (e.g., "swsh1-1_attack_0")
 * @param {boolean} compact - Use compact styling
 */
const ItemReactions = ({ targetType, targetId, compact = true }) => {
  const [reactions, setReactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [userReaction, setUserReaction] = useState(null)
  const { socket } = useSocket()

  useEffect(() => {
    loadReactions()
  }, [targetId])

  useEffect(() => {
    if (!socket) return

    const handleReactionUpdate = (data) => {
      if (data.targetType === targetType && data.targetId === targetId) {
        loadReactions()
      }
    }

    socket.on('reaction:updated', handleReactionUpdate)

    return () => {
      socket.off('reaction:updated', handleReactionUpdate)
    }
  }, [socket, targetId, targetType])

  const loadReactions = async () => {
    try {
      const response = await reactionService.getReactions(targetType, targetId)
      setReactions(response.data.reactions)
      const userReacted = response.data.reactions.find(r => r.userReacted)
      setUserReaction(userReacted ? userReacted.emoji : null)
    } catch (error) {
      console.error('Error loading reactions:', error)
    }
  }

  const handleReaction = async (emoji) => {
    try {
      setLoading(true)

      if (userReaction === emoji) {
        // Remove reaction
        await reactionService.removeReaction(targetType, targetId, emoji)
        setReactions(prev =>
          prev.map(r =>
            r.emoji === emoji
              ? { ...r, count: r.count - 1, userReacted: false }
              : r
          ).filter(r => r.count > 0)
        )
        setUserReaction(null)
      } else {
        // Add or change reaction
        const response = await reactionService.addReaction(targetType, targetId, emoji)

        if (response.data.changed && response.data.previousEmoji) {
          setReactions(prev => {
            let updated = prev.map(r => {
              if (r.emoji === response.data.previousEmoji) {
                return { ...r, count: r.count - 1, userReacted: false }
              }
              return r
            }).filter(r => r.count > 0)

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
        }
        setUserReaction(emoji)
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
      loadReactions()
    } finally {
      setLoading(false)
    }
  }

  const getCount = (emoji) => {
    const reaction = reactions.find(r => r.emoji === emoji)
    return reaction ? reaction.count : 0
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {THUMBS.map((emoji) => {
        const count = getCount(emoji)
        const isSelected = userReaction === emoji
        const isOther = userReaction && userReaction !== emoji

        // Hide the other option if user has selected one
        if (isOther && count === 0) return null

        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={loading}
            className={`
              ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'}
              rounded-full flex items-center gap-1 transition-all text-sm
              ${isSelected
                ? 'bg-primary-100 dark:bg-primary-900 border border-primary-500 dark:border-primary-400'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-transparent'
              }
            `}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="font-medium text-xs">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default ItemReactions

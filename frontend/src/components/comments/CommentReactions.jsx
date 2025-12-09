import { useState, useEffect } from 'react'
import { reactionService } from '../../services/reactionService'
import { useSocket } from '../../contexts/SocketContext'
import EmojiPicker from '../common/EmojiPicker'

const CommentReactions = ({ commentId }) => {
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
        await reactionService.addReaction('comment', commentId, emoji)

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
    } catch (error) {
      console.error('Error updating reaction:', error)
      loadReactions()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {reactions.length > 0 && reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleEmojiSelect(reaction.emoji)}
          disabled={loading}
          className={`
            px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all
            ${reaction.userReacted
              ? 'bg-primary-100 border border-primary-500 text-primary-700'
              : 'bg-gray-100 hover:bg-gray-200 border border-transparent'
            }
          `}
          title={reaction.userReacted ? 'Quitar reacción' : 'Reaccionar'}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      <EmojiPicker onEmojiSelect={handleEmojiSelect} className="text-sm" />
    </div>
  )
}

export default CommentReactions

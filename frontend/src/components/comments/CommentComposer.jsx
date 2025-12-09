import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { cardService } from '../../services/cardService'
import { commentService } from '../../services/commentService'
import Button from '../common/Button'
import { COMMENT_MAX_LENGTH } from '../../utils/constants'

const CommentComposer = ({ cardId, parentId = null, onCommentAdded, onCancel }) => {
  const { isAuthenticated } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionCards, setMentionCards] = useState([])
  const [mentionLoading, setMentionLoading] = useState(false)
  const [cardMentions, setCardMentions] = useState([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef(null)

  // Detect @ mentions
  useEffect(() => {
    const detectMention = () => {
      if (!content) return

      const beforeCursor = content.substring(0, cursorPosition)
      const match = beforeCursor.match(/@(\w*)$/)

      if (match) {
        const query = match[1]
        setMentionQuery(query)
        setShowMentionDropdown(true)

        if (query.length >= 2) {
          searchCards(query)
        }
      } else {
        setShowMentionDropdown(false)
        setMentionCards([])
      }
    }

    detectMention()
  }, [content, cursorPosition])

  const searchCards = async (query) => {
    try {
      setMentionLoading(true)
      const response = await cardService.searchCards(query, 5)
      setMentionCards(response.data.cards)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setMentionLoading(false)
    }
  }

  const insertMention = (card) => {
    const beforeCursor = content.substring(0, cursorPosition)
    const afterCursor = content.substring(cursorPosition)

    // Remove the @ and partial query
    const beforeMention = beforeCursor.replace(/@\w*$/, '')
    const mentionText = `@${card.name}`
    const newContent = beforeMention + mentionText + ' ' + afterCursor

    setContent(newContent)

    // Track the mention
    setCardMentions([...cardMentions, {
      cardId: card.id,
      cardName: card.name,
      position: beforeMention.length
    }])

    setShowMentionDropdown(false)
    setMentionCards([])

    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus()
      const newPosition = beforeMention.length + mentionText.length + 1
      textareaRef.current.setSelectionRange(newPosition, newPosition)
    }
  }

  const handleChange = (e) => {
    setContent(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }

  const handleKeyDown = (e) => {
    if (showMentionDropdown && mentionCards.length > 0) {
      if (e.key === 'Escape') {
        setShowMentionDropdown(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('El comentario no puede estar vacío')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await commentService.createComment(
        cardId,
        content.trim(),
        parentId,
        cardMentions
      )

      setContent('')
      setCardMentions([])

      if (onCommentAdded) {
        onCommentAdded(response.data.comment)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear comentario')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="card bg-gray-50">
        <p className="text-gray-600 text-center">
          <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Inicia sesión
          </a>{' '}
          para dejar un comentario
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={(e) => setCursorPosition(e.target.selectionStart)}
            placeholder={parentId ? "Escribe tu respuesta... (usa @ para mencionar cartas)" : "Escribe tu comentario... (usa @ para mencionar cartas)"}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            rows="4"
            maxLength={COMMENT_MAX_LENGTH}
          />

          {/* Mention dropdown */}
          {showMentionDropdown && mentionQuery.length >= 2 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {mentionLoading ? (
                <div className="p-4 text-center text-gray-500">Buscando...</div>
              ) : mentionCards.length > 0 ? (
                <ul>
                  {mentionCards.map((card) => (
                    <li
                      key={card.id}
                      onClick={() => insertMention(card)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                    >
                      {card.image && (
                        <img
                          src={card.image}
                          alt={card.name}
                          className="w-10 h-14 object-contain rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium">{card.name}</div>
                        <div className="text-xs text-gray-500">{card.set}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron cartas
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-gray-500">
            {content.length}/{COMMENT_MAX_LENGTH}
          </span>

          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !content.trim()}
            >
              {loading ? 'Publicando...' : parentId ? 'Responder' : 'Comentar'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CommentComposer

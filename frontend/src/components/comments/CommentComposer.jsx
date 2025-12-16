import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { cardService } from '../../services/cardService'
import { commentService } from '../../services/commentService'
import Button from '../common/Button'
import { COMMENT_MAX_LENGTH } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import { mentionCache } from '../../utils/mentionCache'

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
  const [abilityMention, setAbilityMention] = useState(null) // For @card.ability format
  const textareaRef = useRef(null)

  // Debounce the mention query to reduce API calls
  const debouncedMentionQuery = useDebounce(mentionQuery, 300)

  // Detect @ mentions (supports @card and @card.ability formats)
  useEffect(() => {
    const detectMention = () => {
      if (!content) return

      const beforeCursor = content.substring(0, cursorPosition)
      // Match @cardname or @cardname.ability
      const match = beforeCursor.match(/@([\w\s-]+)(?:\.(attack|ability|weakness|resistance))?$/i)

      if (match) {
        const cardQuery = match[1]
        const abilityType = match[2] // attack, ability, weakness, or resistance

        setMentionQuery(cardQuery)
        setAbilityMention(abilityType || null)
        setShowMentionDropdown(true)
      } else {
        setShowMentionDropdown(false)
        setMentionCards([])
        setAbilityMention(null)
      }
    }

    detectMention()
  }, [content, cursorPosition])

  // Search cards when debounced query changes
  useEffect(() => {
    if (debouncedMentionQuery && debouncedMentionQuery.length >= 2) {
      searchCards(debouncedMentionQuery)
    } else {
      setMentionCards([])
    }
  }, [debouncedMentionQuery])

  const searchCards = useCallback(async (query) => {
    // Check cache first
    const cached = mentionCache.get(query)
    if (cached) {
      setMentionCards(cached)
      return
    }

    try {
      setMentionLoading(true)
      const response = await cardService.searchCards(query, 5)
      const cards = response.data.cards

      // Cache the results
      mentionCache.set(query, cards)
      setMentionCards(cards)
    } catch (err) {
      console.error('Search error:', err)
      setMentionCards([])
    } finally {
      setMentionLoading(false)
    }
  }, [])

  const insertMention = (card, selectedAbility = null) => {
    const beforeCursor = content.substring(0, cursorPosition)
    const afterCursor = content.substring(cursorPosition)

    // Remove the @ and partial query (including .ability if present)
    const beforeMention = beforeCursor.replace(/@[\w\s-]+(?:\.\w+)?$/i, '')

    // Build mention text based on whether ability is specified
    let mentionText = `@${card.name}`
    if (selectedAbility) {
      mentionText += `.${selectedAbility.type}`
    }

    const newContent = beforeMention + mentionText + ' ' + afterCursor

    setContent(newContent)

    // Track the mention
    setCardMentions([...cardMentions, {
      cardId: card.id,
      cardName: card.name,
      position: beforeMention.length,
      abilityType: selectedAbility?.type || null,
      abilityName: selectedAbility?.name || null
    }])

    setShowMentionDropdown(false)
    setMentionCards([])
    setAbilityMention(null)

    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus()
      const newPosition = beforeMention.length + mentionText.length + 1
      textareaRef.current.setSelectionRange(newPosition, newPosition)
    }
  }

  // Get abilities/attacks for a card based on the mention type
  const getCardAbilities = (card, type) => {
    if (!type) return []

    switch (type.toLowerCase()) {
      case 'attack':
        return (card.attacks || []).map(a => ({ ...a, type: 'attack' }))
      case 'ability':
        return (card.abilities || []).map(a => ({ ...a, type: 'ability' }))
      default:
        return []
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
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {mentionLoading ? (
                <div className="p-4 text-center text-gray-500">Buscando...</div>
              ) : mentionCards.length > 0 ? (
                <div>
                  {abilityMention ? (
                    // Show abilities/attacks for each card
                    mentionCards.map((card) => {
                      const abilities = getCardAbilities(card, abilityMention)
                      return (
                        <div key={card.id} className="border-b border-gray-200 last:border-b-0">
                          <div className="px-4 py-2 bg-gray-50 flex items-center gap-3">
                            {card.image && (
                              <img
                                src={card.image}
                                alt={card.name}
                                className="w-8 h-11 object-contain rounded"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-sm">{card.name}</div>
                              <div className="text-xs text-gray-500">{card.set}</div>
                            </div>
                          </div>
                          {abilities.length > 0 ? (
                            <ul>
                              {abilities.map((ability, idx) => (
                                <li
                                  key={idx}
                                  onClick={() => insertMention(card, ability)}
                                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-l-4 border-transparent hover:border-blue-500"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{ability.type === 'attack' ? '⚔️' : '✨'}</span>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{ability.name}</div>
                                      {ability.damage && (
                                        <span className="text-xs text-red-600 font-semibold">💥 {ability.damage}</span>
                                      )}
                                      {ability.text && (
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{ability.text}</p>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500 italic">
                              No {abilityMention}s found for this card
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    // Show card list only
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
                  )}
                </div>
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

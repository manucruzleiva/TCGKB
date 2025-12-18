import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { cardService } from '../../services/cardService'
import { commentService } from '../../services/commentService'
import Button from '../common/Button'
import PokemonSprite from '../common/PokemonSprite'
import { COMMENT_MAX_LENGTH } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import { mentionCache } from '../../utils/mentionCache'

const CommentComposer = ({ cardId, deckId, targetType = 'card', parentId = null, contextCard = null, onCommentAdded, onCancel }) => {
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
  const [selectedCardForAbility, setSelectedCardForAbility] = useState(null) // Card selected, waiting for ability
  const [showAbilityDropdown, setShowAbilityDropdown] = useState(false)
  const textareaRef = useRef(null)

  const debouncedMentionQuery = useDebounce(mentionQuery, 300)

  useEffect(() => {
    const detectMention = () => {
      if (!content) return

      const beforeCursor = content.substring(0, cursorPosition)

      // Check if we just typed a "." after a card mention chip
      if (selectedCardForAbility) {
        const chipText = `[@${selectedCardForAbility.name}]`
        const chipEndPos = beforeCursor.lastIndexOf(chipText) + chipText.length
        const afterChip = beforeCursor.substring(chipEndPos)

        if (afterChip === '.') {
          setShowAbilityDropdown(true)
          setShowMentionDropdown(false)
          return
        } else if (afterChip.length > 0 && afterChip !== '.') {
          // User typed something else, clear the selected card
          setSelectedCardForAbility(null)
          setShowAbilityDropdown(false)
        }
      }

      // Check for new @ mention
      const match = beforeCursor.match(/@([\w\s-]*)$/i)

      if (match) {
        const cardQuery = match[1]
        setMentionQuery(cardQuery)
        setShowMentionDropdown(true)
        setShowAbilityDropdown(false)
      } else {
        setShowMentionDropdown(false)
        setMentionCards([])
      }
    }

    detectMention()
  }, [content, cursorPosition, selectedCardForAbility])

  useEffect(() => {
    if (debouncedMentionQuery && debouncedMentionQuery.length >= 2) {
      searchCards(debouncedMentionQuery)
    } else {
      setMentionCards([])
    }
  }, [debouncedMentionQuery])

  const searchCards = useCallback(async (query) => {
    const cached = mentionCache.get(query)
    // Only use cache if it includes attacks/abilities data
    if (cached && cached.length > 0 && (cached[0].attacks !== undefined || cached[0].abilities !== undefined)) {
      setMentionCards(cached)
      return
    }

    try {
      setMentionLoading(true)
      const response = await cardService.searchCards(query, 5)
      const cards = response.data.cards

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

    // Remove the @query part
    const beforeMention = beforeCursor.replace(/@[\w\s-]*$/i, '')

    // Create chip-style text with brackets to indicate it's a chip
    let mentionText = `[@${card.name}]`

    if (selectedAbility) {
      mentionText = `[@${card.name}.${selectedAbility.name}]`
    }

    const newContent = beforeMention + mentionText + (selectedAbility ? ' ' : '') + afterCursor

    setContent(newContent)

    // Add to mentions tracking
    setCardMentions([...cardMentions, {
      cardId: card.id,
      cardName: card.name,
      position: beforeMention.length,
      abilityType: selectedAbility?.type || null,
      abilityName: selectedAbility?.name || null
    }])

    setShowMentionDropdown(false)
    setMentionCards([])

    if (selectedAbility) {
      // Ability selected, done
      setSelectedCardForAbility(null)
      setShowAbilityDropdown(false)
    } else {
      // Card selected, wait for possible "." to select ability
      setSelectedCardForAbility(card)
    }

    if (textareaRef.current) {
      textareaRef.current.focus()
      const newPosition = beforeMention.length + mentionText.length
      textareaRef.current.setSelectionRange(newPosition, newPosition)
      setCursorPosition(newPosition)
    }
  }

  const insertAbility = (ability) => {
    if (!selectedCardForAbility) return

    const beforeCursor = content.substring(0, cursorPosition)
    const afterCursor = content.substring(cursorPosition)

    // Find and replace the chip text with ability
    const chipText = `[@${selectedCardForAbility.name}]`
    const chipPos = beforeCursor.lastIndexOf(chipText)

    if (chipPos >= 0) {
      const beforeChip = beforeCursor.substring(0, chipPos)
      const afterChipAndDot = afterCursor // The "." is part of beforeCursor

      const newMentionText = `[@${selectedCardForAbility.name}.${ability.name}]`
      // Remove the trailing "."
      const cleanBeforeCursor = beforeCursor.substring(0, beforeCursor.length - 1)
      const newContent = cleanBeforeCursor.replace(chipText, newMentionText) + ' ' + afterCursor

      setContent(newContent)

      // Update the mention with ability info
      setCardMentions(prev => prev.map(m =>
        m.cardId === selectedCardForAbility.id && !m.abilityName
          ? { ...m, abilityType: ability.type, abilityName: ability.name }
          : m
      ))
    }

    setShowAbilityDropdown(false)
    setSelectedCardForAbility(null)

    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const getAllCardAbilities = (card) => {
    const abilities = []

    // Add attacks
    if (card.attacks) {
      card.attacks.forEach(a => abilities.push({ ...a, type: 'attack' }))
    }

    // Add abilities
    if (card.abilities) {
      card.abilities.forEach(a => abilities.push({ ...a, type: 'ability' }))
    }

    return abilities
  }

  // Get contextual suggestions from the current card page
  const getContextSuggestions = () => {
    if (!contextCard) return []

    const suggestions = []
    const isPokemon = contextCard.tcgSystem === 'pokemon' || !contextCard.tcgSystem
    const isRiftbound = contextCard.tcgSystem === 'riftbound'

    // For Pokemon cards: show attacks and abilities as quick-select options
    if (isPokemon) {
      if (contextCard.attacks) {
        contextCard.attacks.forEach(attack => {
          suggestions.push({
            type: 'context_attack',
            card: contextCard,
            ability: { ...attack, type: 'attack' },
            label: attack.name,
            description: attack.text || (attack.damage ? `Daño: ${attack.damage}` : 'Ataque')
          })
        })
      }
      if (contextCard.abilities) {
        contextCard.abilities.forEach(ability => {
          suggestions.push({
            type: 'context_ability',
            card: contextCard,
            ability: { ...ability, type: 'ability' },
            label: ability.name,
            description: ability.text || 'Habilidad'
          })
        })
      }
    }

    // For Riftbound cards: show card text as a quick reference
    if (isRiftbound && contextCard.text) {
      suggestions.push({
        type: 'context_text',
        card: contextCard,
        ability: null,
        label: 'Card Text',
        description: contextCard.text.substring(0, 100) + (contextCard.text.length > 100 ? '...' : '')
      })
    }

    // Always add option to just mention the card itself
    if (suggestions.length > 0) {
      suggestions.unshift({
        type: 'context_card',
        card: contextCard,
        ability: null,
        label: contextCard.name,
        description: 'Mencionar esta carta'
      })
    }

    return suggestions
  }

  const contextSuggestions = getContextSuggestions()

  const removeChip = (cardId) => {
    // Find and remove the chip from content
    const mention = cardMentions.find(m => m.cardId === cardId)
    if (mention) {
      let chipText = `[@${mention.cardName}]`
      if (mention.abilityName) {
        chipText = `[@${mention.cardName}.${mention.abilityName}]`
      }
      setContent(prev => prev.replace(chipText, '').replace(/\s+/g, ' ').trim())
      setCardMentions(prev => prev.filter(m => m.cardId !== cardId))
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
    if (showAbilityDropdown) {
      if (e.key === 'Escape') {
        setShowAbilityDropdown(false)
        setSelectedCardForAbility(null)
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

      let response
      if (targetType === 'deck') {
        response = await commentService.createDeckComment(
          deckId,
          content.trim(),
          parentId,
          cardMentions
        )
      } else {
        response = await commentService.createComment(
          cardId,
          content.trim(),
          parentId,
          cardMentions
        )
      }

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
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-gray-600 dark:text-gray-400 text-center text-sm">
          <a href="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            Inicia sesión
          </a>{' '}
          para dejar un comentario
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit}>
        {/* Chips display for mentioned cards */}
        {cardMentions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {cardMentions.map((mention, idx) => (
              <span
                key={`${mention.cardId}-${idx}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  mention.abilityName
                    ? 'bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/50 dark:to-purple-900/50 text-primary-700 dark:text-primary-300'
                    : 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                }`}
              >
                {mention.abilityName ? (
                  <>
                    <span className="text-sm">{mention.abilityType === 'attack' ? '⚔️' : '✨'}</span>
                    <span className="font-semibold">{mention.cardName}</span>
                    <span className="text-primary-500 dark:text-primary-400">•</span>
                    <span className="italic">{mention.abilityName}</span>
                  </>
                ) : (
                  <>
                    <PokemonSprite cardName={mention.cardName} size="sm" fallbackEmoji="🃏" />
                    <span>{mention.cardName}</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => removeChip(mention.cardId)}
                  className="ml-1 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-200 text-lg leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={(e) => setCursorPosition(e.target.selectionStart)}
            placeholder={parentId ? "Escribe tu respuesta... (usa @ para mencionar cartas)" : "Escribe tu comentario... (usa @ para mencionar cartas, luego . para habilidades)"}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            rows="3"
            maxLength={COMMENT_MAX_LENGTH}
          />

          {/* Hint when card is selected */}
          {selectedCardForAbility && !showAbilityDropdown && (
            <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded shadow">
              Escribe <span className="font-bold">.</span> para seleccionar una habilidad de {selectedCardForAbility.name}
            </div>
          )}

          {/* Ability dropdown */}
          {showAbilityDropdown && selectedCardForAbility && (
            <div
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()} // Prevent blur on textarea
            >
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  {(selectedCardForAbility.images?.small || selectedCardForAbility.images?.large) && (
                    <img
                      src={selectedCardForAbility.images?.small || selectedCardForAbility.images?.large}
                      alt={selectedCardForAbility.name}
                      className="w-8 h-11 object-contain rounded"
                    />
                  )}
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{selectedCardForAbility.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Selecciona una habilidad o ataque</div>
                  </div>
                </div>
              </div>
              <ul>
                {getAllCardAbilities(selectedCardForAbility).length > 0 ? (
                  getAllCardAbilities(selectedCardForAbility).map((ability, idx) => (
                    <li
                      key={idx}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        insertAbility(ability)
                      }}
                      className="px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm mt-0.5">{ability.type === 'attack' ? '⚔️' : '✨'}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{ability.name}</div>
                          {ability.damage && (
                            <span className="text-xs text-red-600 dark:text-red-400 font-semibold">💥 {ability.damage}</span>
                          )}
                          {ability.text && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{ability.text}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                    Esta carta no tiene habilidades o ataques
                  </li>
                )}
              </ul>
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowAbilityDropdown(false)
                    setSelectedCardForAbility(null)
                    // Remove the "." from content
                    setContent(prev => prev.slice(0, -1))
                    textareaRef.current?.focus()
                  }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Cancelar (solo mencionar carta)
                </button>
              </div>
            </div>
          )}

          {/* Mention dropdown */}
          {showMentionDropdown && (mentionQuery.length >= 2 || contextSuggestions.length > 0) && (
            <div
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()} // Prevent blur on textarea
            >
              {/* Contextual suggestions - show when query is short */}
              {contextSuggestions.length > 0 && mentionQuery.length < 2 && (
                <>
                  <div className="px-3 py-2 bg-primary-50 dark:bg-primary-900/30 border-b border-primary-200 dark:border-primary-700">
                    <div className="flex items-center gap-2">
                      <span className="text-primary-600 dark:text-primary-400 text-sm">✨</span>
                      <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                        Esta carta
                      </span>
                    </div>
                  </div>
                  <ul>
                    {contextSuggestions.map((suggestion, idx) => (
                      <li
                        key={`ctx-${idx}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (suggestion.ability) {
                            insertMention(suggestion.card, suggestion.ability)
                          } else {
                            insertMention(suggestion.card)
                          }
                        }}
                        className="px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-sm mt-0.5">
                            {suggestion.type === 'context_card' ? '🃏' :
                             suggestion.type === 'context_attack' ? '⚔️' :
                             suggestion.type === 'context_ability' ? '✨' : '📜'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{suggestion.label}</div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{suggestion.description}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {mentionQuery.length === 0 && (
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        💡 Escribe para buscar otras cartas
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Global search results */}
              {mentionQuery.length >= 2 && (
                <>
                  {mentionLoading ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Buscando...
                    </div>
                  ) : mentionCards.length > 0 ? (
                    <ul>
                      {mentionCards.map((card) => {
                        const cardImage = card.images?.small || card.images?.large || card.image
                        const setName = typeof card.set === 'string' ? card.set : card.set?.name || ''
                        const hasAbilities = (card.attacks?.length > 0) || (card.abilities?.length > 0)
                        return (
                          <li
                            key={card.id}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              insertMention(card)
                            }}
                            className="px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 cursor-pointer flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            {cardImage && (
                              <img
                                src={cardImage}
                                alt={card.name}
                                className="w-10 h-14 object-contain rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{card.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{setName}</div>
                              {hasAbilities && (
                                <div className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                                  Escribe . después para ver habilidades
                                </div>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No se encontraron cartas
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">
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

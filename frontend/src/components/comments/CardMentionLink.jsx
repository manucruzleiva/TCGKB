import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { cardService } from '../../services/cardService'
import PokemonSprite from '../common/PokemonSprite'

const CardMentionLink = ({ cardId, cardName, abilityName = null }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef(null)
  const tooltipRef = useRef(null)
  const linkRef = useRef(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      // Calculate position based on the link element
      // Using fixed positioning, so use viewport coordinates directly (no scroll offsets)
      if (linkRef.current) {
        const rect = linkRef.current.getBoundingClientRect()
        setTooltipPosition({
          top: rect.top - 10, // Above the element (viewport coordinates)
          left: rect.left + rect.width / 2 // Centered (viewport coordinates)
        })
      }
      setShowTooltip(true)
      if (!cardData && !loading) {
        loadCardData()
      }
    }, 300)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setShowTooltip(false)
  }

  const loadCardData = async () => {
    try {
      setLoading(true)
      const response = await cardService.getCardById(cardId)
      setCardData(response.data.card)
    } catch (error) {
      console.error('Error loading card:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Find the specific ability from card data
  const getAbilityDetails = () => {
    if (!cardData || !abilityName) return null

    // Check attacks
    if (cardData.attacks) {
      const attack = cardData.attacks.find(a => a.name === abilityName)
      if (attack) return { ...attack, type: 'attack' }
    }

    // Check abilities
    if (cardData.abilities) {
      const ability = cardData.abilities.find(a => a.name === abilityName)
      if (ability) return { ...ability, type: 'ability' }
    }

    return null
  }

  const abilityDetails = cardData ? getAbilityDetails() : null

  // Determine TCG system from card data
  const tcgSystem = cardData?.tcgSystem || 'pokemon'
  const isPokemon = tcgSystem === 'pokemon' || !tcgSystem

  // Unified chip style for all mentions
  const chipStyles = 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 border border-blue-300 dark:border-blue-700'

  return (
    <span className="relative inline-block align-middle">
      <Link
        ref={linkRef}
        to={`/card/${cardId}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium transition-all ${chipStyles}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Pokemon sprite or card emoji for Riftbound */}
        {isPokemon ? (
          <PokemonSprite cardName={cardName} size="sm" fallbackEmoji="🃏" showFallback={true} />
        ) : (
          <span className="text-xs">🃏</span>
        )}

        {/* Card name or ability name */}
        <span className="text-xs">{abilityName ? abilityName : cardName}</span>
      </Link>

      {/* Tooltip rendered via portal to avoid z-index/overflow issues */}
      {showTooltip && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2">
            {loading ? (
              <div className="w-[120px] h-[120px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
              </div>
            ) : cardData ? (
              abilityDetails ? (
                /* Horizontal layout for ability mentions */
                <div className="flex gap-3 max-w-[340px]">
                  {/* Card image on the left */}
                  <div className="flex-shrink-0">
                    <img
                      src={cardData.images?.small || cardData.images?.large}
                      alt={cardName}
                      className="w-[80px] h-auto rounded"
                    />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center truncate w-[80px]">
                      {cardData.set?.name}
                    </p>
                  </div>
                  {/* Ability details on the right */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {abilityDetails.type === 'attack' ? 'Attack' : 'Ability'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {abilityDetails.name}
                    </h4>
                    {abilityDetails.damage && (
                      <div className="text-sm text-red-600 dark:text-red-400 font-bold mt-0.5">
                        💥 {abilityDetails.damage}
                      </div>
                    )}
                    {abilityDetails.cost && abilityDetails.cost.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {abilityDetails.cost.map((cost, idx) => (
                          <span key={idx} className="text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                            {cost}
                          </span>
                        ))}
                      </div>
                    )}
                    {abilityDetails.text && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-4">
                        {abilityDetails.text}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Vertical layout for card-only mentions */
                <div className="text-center max-w-[120px]">
                  <img
                    src={cardData.images?.small || cardData.images?.large}
                    alt={cardName}
                    className="w-[100px] h-auto rounded mx-auto"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                    {cardData.set?.name}
                  </p>
                </div>
              )
            ) : (
              <div className="w-[120px] h-[120px] flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                No disponible
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white dark:border-t-gray-800"></div>
        </div>,
        document.body
      )}
    </span>
  )
}

export default CardMentionLink

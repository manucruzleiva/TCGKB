import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cardService } from '../../services/cardService'
import PokemonSprite from '../common/PokemonSprite'

const CardMentionLink = ({ cardId, cardName, abilityName = null, abilityType = null }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef(null)
  const tooltipRef = useRef(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
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

  return (
    <span className="relative inline-block align-middle">
      <Link
        to={`/card/${cardId}`}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium transition-all ${
          abilityName
            ? 'bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/50 dark:to-purple-900/50 text-primary-700 dark:text-primary-300 hover:from-primary-200 hover:to-purple-200 dark:hover:from-primary-800/50 dark:hover:to-purple-800/50'
            : 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/50'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {abilityName ? (
          <>
            <span className="text-base">{abilityType === 'attack' ? '⚔️' : '✨'}</span>
            <span className="font-semibold">{cardName}</span>
            <span className="text-primary-500 dark:text-primary-400 font-normal">•</span>
            <span className="italic">{abilityName}</span>
          </>
        ) : (
          <>
            <PokemonSprite cardName={cardName} size="sm" fallbackEmoji="🃏" />
            <span>{cardName}</span>
          </>
        )}
      </Link>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[120px]">
            {loading ? (
              <div className="w-[140px] h-[140px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
              </div>
            ) : cardData ? (
              <div className={`text-center ${abilityDetails ? 'max-w-[280px]' : 'max-w-[140px]'}`}>
                <img
                  src={cardData.images?.small || cardData.images?.large}
                  alt={cardName}
                  className="w-[100px] h-auto rounded mx-auto"
                />
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                  {cardData.set?.name}
                </p>
                {/* Show ability details if mentioned */}
                {abilityDetails && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-left">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <span>{abilityDetails.type === 'attack' ? '⚔️' : '✨'}</span>
                      <span>{abilityDetails.name}</span>
                    </div>
                    {abilityDetails.damage && (
                      <div className="text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">
                        💥 {abilityDetails.damage}
                      </div>
                    )}
                    {abilityDetails.text && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {abilityDetails.text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-[140px] h-[140px] flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                No disponible
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white dark:border-t-gray-800"></div>
        </div>
      )}
    </span>
  )
}

export default CardMentionLink

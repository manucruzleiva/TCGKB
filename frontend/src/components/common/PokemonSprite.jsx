import { useState, useEffect, memo } from 'react'
import { pokeApiService } from '../../services/pokeApiService'

/**
 * PokemonSprite - Displays a Pokemon sprite based on card name
 * Falls back to emoji if sprite not found
 */
const PokemonSprite = memo(function PokemonSprite({
  cardName,
  size = 'sm',
  fallbackEmoji = '🃏',
  className = '',
  showFallback = true
}) {
  const [spriteUrl, setSpriteUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Size mappings
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  useEffect(() => {
    let mounted = true

    const loadSprite = async () => {
      if (!cardName) {
        setLoading(false)
        setError(true)
        return
      }

      try {
        setLoading(true)
        setError(false)

        // First try direct URL (fast, no API call)
        const directUrl = pokeApiService.getDirectSpriteUrl(cardName)

        if (directUrl) {
          // Verify the image exists by trying to load it
          const img = new Image()

          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = directUrl
          })

          if (mounted) {
            setSpriteUrl(directUrl)
            setLoading(false)
          }
        } else {
          throw new Error('Could not generate sprite URL')
        }
      } catch (err) {
        // If direct URL fails, try API fetch
        try {
          const spriteData = await pokeApiService.getPokemonSprite(cardName)

          if (mounted) {
            if (spriteData?.sprites?.default) {
              setSpriteUrl(spriteData.sprites.default)
              setError(false)
            } else {
              setError(true)
            }
            setLoading(false)
          }
        } catch (apiError) {
          if (mounted) {
            setError(true)
            setLoading(false)
          }
        }
      }
    }

    loadSprite()

    return () => {
      mounted = false
    }
  }, [cardName])

  // Show fallback emoji while loading or on error
  if (loading || error || !spriteUrl) {
    if (!showFallback) return null

    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        {fallbackEmoji}
      </span>
    )
  }

  return (
    <img
      src={spriteUrl}
      alt={cardName}
      className={`${sizeClasses[size] || sizeClasses.sm} object-contain inline-block ${className}`}
      loading="lazy"
      style={{ imageRendering: 'pixelated' }}
      onError={() => setError(true)}
    />
  )
})

export default PokemonSprite

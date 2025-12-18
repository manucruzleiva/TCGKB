import { useState, useEffect } from 'react'
import Spinner from '../common/Spinner'
import CardReactions from './CardReactions'
import ItemReactions from './ItemReactions'
import CommentList from '../comments/CommentList'
import { getRotationInfo, formatDaysUntilRotation } from '../../config/rotation'
import { useLanguage } from '../../contexts/LanguageContext'
import { useDateFormat } from '../../contexts/DateFormatContext'
import { useAuth } from '../../contexts/AuthContext'
import { collectionService } from '../../services/collectionService'
import { artistsService } from '../../services/artistsService'

// Type emoji mapping for Pokemon
const TYPE_EMOJIS = {
  'Fire': '🔥',
  'Water': '💧',
  'Grass': '🌿',
  'Electric': '⚡',
  'Psychic': '🔮',
  'Fighting': '👊',
  'Darkness': '🌙',
  'Metal': '⚙️',
  'Dragon': '🐉',
  'Fairy': '✨',
  'Colorless': '⭐',
  'Lightning': '⚡'
}

// Domain emoji mapping for Riftbound
const DOMAIN_EMOJIS = {
  'fire': '🔥',
  'water': '💧',
  'earth': '🌍',
  'air': '💨',
  'light': '✨',
  'dark': '🌙',
  'nature': '🌿',
  'chaos': '💀',
  'order': '⚖️',
  'neutral': '⭐'
}

// Rarity colors for Riftbound
const RARITY_COLORS = {
  'Common': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  'Uncommon': 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  'Rare': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  'Epic': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  'Legendary': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
}

const CardDetail = ({ card, stats, cardId, alternateArts = [] }) => {
  const { t, language } = useLanguage()
  const { formatDate } = useDateFormat()
  const { isAuthenticated } = useAuth()
  const [currentArtIndex, setCurrentArtIndex] = useState(0)
  const [collectionData, setCollectionData] = useState({ quantity: 0, playsetMax: 4, hasPlayset: false })
  const [loadingCollection, setLoadingCollection] = useState(false)
  const [artistData, setArtistData] = useState({ fanCount: 0, isFan: false })
  const [loadingArtist, setLoadingArtist] = useState(false)

  // Fetch collection status when card changes
  useEffect(() => {
    const fetchCollectionStatus = async () => {
      if (!isAuthenticated || !card?.id) return

      try {
        setLoadingCollection(true)
        const response = await collectionService.getCardOwnership(card.id)
        if (response.success) {
          setCollectionData(response.data)
        }
      } catch (error) {
        console.error('Error fetching collection status:', error)
      } finally {
        setLoadingCollection(false)
      }
    }

    fetchCollectionStatus()
  }, [card?.id, isAuthenticated])

  // Fetch artist info when card changes
  useEffect(() => {
    const fetchArtistInfo = async () => {
      if (!card?.artist) return

      try {
        setLoadingArtist(true)
        const response = await artistsService.getArtistInfo(card.artist)
        if (response.success) {
          setArtistData({
            fanCount: response.data.fanCount,
            isFan: response.data.isFan
          })
        }
      } catch (error) {
        console.error('Error fetching artist info:', error)
      } finally {
        setLoadingArtist(false)
      }
    }

    fetchArtistInfo()
  }, [card?.artist])

  // Handle toggling fan status
  const handleToggleFan = async () => {
    if (!isAuthenticated || !card?.artist) return

    try {
      setLoadingArtist(true)
      const response = await artistsService.toggleFan(card.artist)
      if (response.success) {
        setArtistData({
          fanCount: response.data.fanCount,
          isFan: response.data.isFan
        })
      }
    } catch (error) {
      console.error('Error toggling fan status:', error)
    } finally {
      setLoadingArtist(false)
    }
  }

  // Handle adding/removing from collection
  const handleCollectionChange = async (delta) => {
    if (!isAuthenticated || !card) return

    const newQuantity = Math.max(0, collectionData.quantity + delta)
    const tcgSystem = card.tcgSystem || 'pokemon'

    try {
      const response = await collectionService.setQuantity({
        cardId: card.id,
        quantity: newQuantity,
        tcgSystem,
        cardName: card.name,
        cardImage: card.images?.small || card.images?.large,
        cardSet: card.set?.name || card.set?.id,
        cardRarity: card.rarity
      })

      if (response.success) {
        setCollectionData(response.data)
      }
    } catch (error) {
      console.error('Error updating collection:', error)
    }
  }

  if (!card) {
    return (
      <div className="text-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // Get the current card (either from alternateArts or the original card)
  const displayedCard = alternateArts.length > 0 ? alternateArts[currentArtIndex] : card
  const imageUrl = displayedCard?.images?.large || displayedCard?.images?.small || card.images?.large || card.images?.small
  const setCode = card.set?.ptcgoCode || card.set?.id || 'Unknown'
  const setName = card.set?.name || 'Unknown Set'
  const releaseDate = card.set?.releaseDate || ''
  const hasMultipleArts = alternateArts.length > 1

  const goToPrevArt = () => {
    setCurrentArtIndex((prev) => (prev === 0 ? alternateArts.length - 1 : prev - 1))
  }

  const goToNextArt = () => {
    setCurrentArtIndex((prev) => (prev === alternateArts.length - 1 ? 0 : prev + 1))
  }

  // Calculate legal format date (2 weeks after release)
  const calculateLegalDate = (releaseDateStr) => {
    if (!releaseDateStr) return null
    const release = new Date(releaseDateStr)
    const legalDate = new Date(release)
    legalDate.setDate(legalDate.getDate() + 14)
    return legalDate
  }

  // Check if this is a Pokemon card (rotation features only apply to Pokemon)
  // Default to true if tcgSystem is not specified (most cards in the API are Pokemon)
  const isPokemonCard = card.tcgSystem === 'pokemon' || !card.tcgSystem
  const isRiftboundCard = card.tcgSystem === 'riftbound'

  // Pokemon-specific calculations
  const legalFormatDate = isPokemonCard ? calculateLegalDate(releaseDate) : null
  const rotationInfo = isPokemonCard && card.regulationMark ? getRotationInfo(card.regulationMark) : null

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Card Image with Carousel */}
      <div>
        <div className="card sticky top-4">
          <div className="aspect-[2.5/3.5] relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={card.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}

            {/* Carousel Navigation */}
            {hasMultipleArts && (
              <>
                {/* Previous Button */}
                <button
                  onClick={goToPrevArt}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  aria-label="Previous art"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Next Button */}
                <button
                  onClick={goToNextArt}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                  aria-label="Next art"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Art Counter Badge */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-md text-white text-xs font-medium">
                  {currentArtIndex + 1} / {alternateArts.length}
                </div>
              </>
            )}

          </div>

          {/* Alternate Arts / Reprints Thumbnails */}
          {hasMultipleArts && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'es' ? 'Otras Versiones' : 'Other Versions'} ({alternateArts.length})
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {alternateArts.map((art, idx) => {
                  // Determine version type based on rarity/set
                  const isPromo = art.set?.id?.toLowerCase().includes('promo') || art.rarity?.toLowerCase().includes('promo')
                  const isSpecialArt = art.rarity?.toLowerCase().includes('illustration') ||
                                       art.rarity?.toLowerCase().includes('special') ||
                                       art.rarity?.toLowerCase().includes('secret')
                  const versionType = isPromo ? 'promo' : isSpecialArt ? 'special' : 'reprint'
                  const versionColors = {
                    promo: 'bg-yellow-500',
                    special: 'bg-gradient-to-r from-pink-500 to-purple-500',
                    reprint: 'bg-blue-500'
                  }

                  return (
                    <button
                      key={art.id}
                      onClick={() => setCurrentArtIndex(idx)}
                      className={`flex-shrink-0 relative rounded-md overflow-hidden border-2 transition-all ${
                        idx === currentArtIndex
                          ? 'border-primary-500 shadow-lg scale-105'
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                      }`}
                      title={`${art.set?.name || ''} ${art.rarity ? `(${art.rarity})` : ''}`}
                    >
                      <img
                        src={art.images?.small || art.images?.large}
                        alt={`${art.name} - ${art.set?.name || ''}`}
                        className="w-16 h-22 object-contain"
                      />
                      {/* Version type indicator */}
                      <div className={`absolute bottom-0 left-0 right-0 ${versionColors[versionType]} text-white text-[8px] font-bold text-center py-0.5 uppercase`}>
                        {art.set?.ptcgoCode || art.set?.id?.substring(0, 4) || '???'}
                      </div>
                    </button>
                  )
                })}
              </div>
              {/* Current art set info with type indicator */}
              {displayedCard && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{displayedCard.set?.name}</span>
                  {displayedCard.number && <span className="text-gray-500 dark:text-gray-400">#{displayedCard.number}</span>}
                  {displayedCard.rarity && (
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-[10px]">
                      {displayedCard.rarity}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Info - Main Container */}
      <div>
        <div className="card mb-6">
          {/* Card Header with Name, Versions Badge, and Card Reactions */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{card.name}</h1>
              {/* Versions Badge */}
              {hasMultipleArts && (
                <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                  {alternateArts.length} {language === 'es' ? 'versiones' : 'versions'}
                </span>
              )}
            </div>
            <div className="flex-shrink-0">
              <CardReactions cardId={card.id} />
            </div>
          </div>

          {/* Collection Counter */}
          {isAuthenticated && (
            <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {language === 'es' ? 'Mi Colección' : 'My Collection'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Quantity display with playset indicator */}
                  <div className="text-center">
                    <span className={`text-2xl font-bold ${collectionData.hasPlayset ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {collectionData.quantity}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm"> / {collectionData.playsetMax}</span>
                    {collectionData.hasPlayset && (
                      <span className="ml-1 text-green-500" title={language === 'es' ? 'Playset completo' : 'Playset complete'}>✓</span>
                    )}
                  </div>

                  {/* Counter buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCollectionChange(-1)}
                      disabled={loadingCollection || collectionData.quantity === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={language === 'es' ? 'Quitar una' : 'Remove one'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleCollectionChange(1)}
                      disabled={loadingCollection}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={language === 'es' ? 'Agregar una' : 'Add one'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              {/* Playset progress bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${collectionData.hasPlayset ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, (collectionData.quantity / collectionData.playsetMax) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  {collectionData.hasPlayset
                    ? (language === 'es' ? '¡Playset completo!' : 'Playset complete!')
                    : (language === 'es'
                      ? `${collectionData.playsetMax - collectionData.quantity} más para playset`
                      : `${collectionData.playsetMax - collectionData.quantity} more for playset`)}
                </p>
              </div>
            </div>
          )}

          {/* Card Data */}
          <div className="space-y-3 mb-6">
            {/* Set Info */}
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{t('card.set')}:</span>
              <span className="ml-2 font-mono font-semibold text-primary-600 dark:text-primary-400">{setCode}</span>
              <span className="ml-2 text-gray-500 dark:text-gray-500 text-sm">({setName})</span>
            </div>

            {releaseDate && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('card.releaseDate')}:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{formatDate(releaseDate)}</span>
              </div>
            )}

            {/* Pokemon-specific: Regulation Mark with status */}
            {isPokemonCard && card.regulationMark && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('card.regulationMark')}:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-bold rounded ${
                  rotationInfo?.status === 'rotated'
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    : rotationInfo?.status === 'rotating-soon'
                    ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                    : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                }`}>
                  <span className="text-lg">{card.regulationMark}</span>
                  {rotationInfo?.status === 'rotating-soon' && (
                    <span className="text-xs font-normal">⚠️</span>
                  )}
                  {rotationInfo?.status === 'rotated' && (
                    <span className="text-xs font-normal">🚫</span>
                  )}
                  {rotationInfo?.status === 'legal' && (
                    <span className="text-xs font-normal">✓</span>
                  )}
                </span>
              </div>
            )}

            {/* Pokemon-specific: Enter Standard date */}
            {isPokemonCard && legalFormatDate && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('card.enterLegal')}:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{formatDate(legalFormatDate)}</span>
              </div>
            )}

            {/* Pokemon-specific: Leave Standard date (for rotating cards) */}
            {isPokemonCard && rotationInfo && rotationInfo.status === 'rotating-soon' && rotationInfo.rotationDate && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-orange-600 dark:text-orange-400">Leave Standard:</span>
                <span className="text-orange-600 dark:text-orange-400">
                  {formatDate(rotationInfo.rotationDate)}
                </span>
                <span className="text-xs text-orange-500 dark:text-orange-400">
                  ({formatDaysUntilRotation(rotationInfo.daysUntilRotation)})
                </span>
              </div>
            )}

            {/* Pokemon-specific: Already rotated info */}
            {isPokemonCard && rotationInfo && rotationInfo.status === 'rotated' && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-red-600 dark:text-red-400">Estado:</span>
                <span className="text-red-600 dark:text-red-400">
                  No legal en Standard
                </span>
              </div>
            )}

            {card.supertype && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('card.type')}:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {card.supertype}
                  {card.subtypes && card.subtypes.length > 0 && (
                    <span className="ml-1 text-gray-500 dark:text-gray-500">
                      ({card.subtypes.join(', ')})
                    </span>
                  )}
                </span>
              </div>
            )}

            {card.types && card.types.length > 0 && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('card.types')}:</span>
                <div className="inline-flex gap-2 ml-2">
                  {card.types.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded flex items-center gap-1"
                    >
                      {TYPE_EMOJIS[type] && <span>{TYPE_EMOJIS[type]}</span>}
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {card.hp && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('card.hp')}:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{card.hp}</span>
              </div>
            )}

            {/* Card Number */}
            {card.number && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Número:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {card.number}{card.set?.printedTotal ? ` / ${card.set.printedTotal}` : ''}
                </span>
              </div>
            )}

            {/* Rarity */}
            {card.rarity && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Rareza:</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-sm ${isRiftboundCard ? (RARITY_COLORS[card.rarity] || 'text-gray-600 dark:text-gray-400') : 'text-gray-600 dark:text-gray-400'}`}>
                  {card.rarity}
                </span>
              </div>
            )}

            {/* Riftbound-specific: Card Type */}
            {isRiftboundCard && card.type && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{t('card.type')}:</span>
                <span className="ml-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm rounded">
                  {card.type}
                </span>
              </div>
            )}

            {/* Riftbound-specific: Domain */}
            {isRiftboundCard && card.domain && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Domain:</span>
                <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-sm rounded flex items-center gap-1 inline-flex">
                  {DOMAIN_EMOJIS[card.domain?.toLowerCase()] && <span>{DOMAIN_EMOJIS[card.domain?.toLowerCase()]}</span>}
                  {card.domain}
                </span>
              </div>
            )}

            {/* Riftbound-specific: Attributes (Energy, Might, Power) */}
            {isRiftboundCard && card.attributes && (card.attributes.energy || card.attributes.might || card.attributes.power) && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">Attributes:</span>
                <div className="flex gap-3">
                  {card.attributes.energy !== undefined && card.attributes.energy !== null && (
                    <div className="flex flex-col items-center px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <span className="text-lg">⚡</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Energy</span>
                      <span className="font-bold text-yellow-700 dark:text-yellow-300">{card.attributes.energy}</span>
                    </div>
                  )}
                  {card.attributes.might !== undefined && card.attributes.might !== null && (
                    <div className="flex flex-col items-center px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <span className="text-lg">💪</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Might</span>
                      <span className="font-bold text-red-700 dark:text-red-300">{card.attributes.might}</span>
                    </div>
                  )}
                  {card.attributes.power !== undefined && card.attributes.power !== null && (
                    <div className="flex flex-col items-center px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <span className="text-lg">🔮</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Power</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">{card.attributes.power}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Riftbound-specific: Collector Number */}
            {isRiftboundCard && card.collector_number && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Collector #:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400 font-mono">{card.collector_number}</span>
              </div>
            )}

            {/* Artist with Fan System */}
            {card.artist && (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {language === 'es' ? 'Artista' : 'Artist'}:
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{card.artist}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Fan count */}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {artistData.fanCount} {artistData.fanCount === 1 ? 'fan' : 'fans'}
                  </span>
                  {/* Fan toggle button */}
                  {isAuthenticated && (
                    <button
                      onClick={handleToggleFan}
                      disabled={loadingArtist}
                      className={`p-1.5 rounded-full transition-all duration-200 ${
                        artistData.isFan
                          ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-500 hover:bg-pink-200 dark:hover:bg-pink-800'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-pink-400'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={artistData.isFan
                        ? (language === 'es' ? 'Dejar de ser fan' : 'Unfollow artist')
                        : (language === 'es' ? 'Hacerme fan' : 'Become a fan')}
                    >
                      <svg
                        className={`w-5 h-5 ${artistData.isFan ? 'fill-current' : ''}`}
                        fill={artistData.isFan ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Riftbound-specific: Tags */}
            {isRiftboundCard && card.tags && card.tags.length > 0 && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Tags:</span>
                <div className="flex gap-1 flex-wrap">
                  {card.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Riftbound-specific: Special badges */}
            {isRiftboundCard && (card.alternateArt || card.signature) && (
              <div className="flex gap-2">
                {card.alternateArt && (
                  <span className="px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs rounded font-medium">
                    ✨ Alternate Art
                  </span>
                )}
                {card.signature && (
                  <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded font-medium">
                    ✍️ Signature
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Attacks - Nested Inside Card Data Box (Pokemon only) */}
          {isPokemonCard && card.attacks && card.attacks.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                <span className="mr-2">⚔️</span>
                {t('card.attacks')}
              </h2>
              <div className="space-y-4">
                {card.attacks.map((attack, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-primary-500"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{attack.name}</h3>
                          {attack.damage && (
                            <span className="text-red-600 dark:text-red-400 font-bold">
                              <span className="mr-1">💥</span>{attack.damage}
                            </span>
                          )}
                        </div>
                        {attack.text && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{attack.text}</p>
                        )}
                        {attack.cost && attack.cost.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {attack.cost.map((cost, costIdx) => (
                              <span
                                key={costIdx}
                                className="px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded flex items-center gap-1 border border-gray-200 dark:border-gray-600"
                              >
                                {TYPE_EMOJIS[cost] && <span>{TYPE_EMOJIS[cost]}</span>}
                                {cost}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Attack Reactions */}
                      <div className="flex-shrink-0">
                        <ItemReactions
                          targetType="attack"
                          targetId={`${card.id}_attack_${idx}`}
                          compact={true}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abilities - Nested Inside Card Data Box (Pokemon only) */}
          {isPokemonCard && card.abilities && card.abilities.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                <span className="mr-2">✨</span>
                {t('card.abilities')}
              </h2>
              <div className="space-y-4">
                {card.abilities.map((ability, idx) => (
                  <div
                    key={idx}
                    className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{ability.name}</h3>
                          <span className="text-xs text-green-700 dark:text-green-400 italic bg-green-100 dark:bg-green-800/50 px-2 py-0.5 rounded">
                            {ability.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{ability.text}</p>
                      </div>
                      {/* Ability Reactions */}
                      <div className="flex-shrink-0">
                        <ItemReactions
                          targetType="ability"
                          targetId={`${card.id}_ability_${idx}`}
                          compact={true}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riftbound Card Text - Main card effect/description */}
          {isRiftboundCard && card.text && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                <span className="mr-2">📜</span>
                Card Text
              </h2>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border-l-4 border-indigo-500">
                {card.textHtml ? (
                  <div
                    className="text-gray-700 dark:text-gray-300 prose dark:prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: card.textHtml }}
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{card.text}</p>
                )}
              </div>
            </div>
          )}

          {/* Weakness / Resistance / Retreat (Pokemon only) */}
          {isPokemonCard && (card.weaknesses || card.resistances || card.retreatCost) && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-sm">
                {/* Weakness */}
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Debilidad</span>
                  {card.weaknesses && card.weaknesses.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {card.weaknesses.map((w, idx) => (
                        <span key={idx} className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          {TYPE_EMOJIS[w.type] && <span>{TYPE_EMOJIS[w.type]}</span>}
                          <span>{w.value}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </div>

                {/* Resistance */}
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Resistencia</span>
                  {card.resistances && card.resistances.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {card.resistances.map((r, idx) => (
                        <span key={idx} className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          {TYPE_EMOJIS[r.type] && <span>{TYPE_EMOJIS[r.type]}</span>}
                          <span>{r.value}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </div>

                {/* Retreat */}
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">Retirada</span>
                  {card.retreatCost && card.retreatCost.length > 0 ? (
                    <div className="flex gap-0.5">
                      {card.retreatCost.map((cost, idx) => (
                        <span key={idx}>
                          {TYPE_EMOJIS[cost] || '⭐'}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">0</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        {cardId && (
          <div className="mt-8">
            <CommentList cardId={cardId} contextCard={card} />
          </div>
        )}
      </div>
    </div>
  )
}

export default CardDetail

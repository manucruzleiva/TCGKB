import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDateFormat } from '../../contexts/DateFormatContext'
import { getRotationInfo, formatDaysUntilRotation } from '../../config/rotation'

const CardItem = ({ card }) => {
  const { formatDate } = useDateFormat()
  const [showTooltip, setShowTooltip] = useState(false)
  const imageUrl = card.images?.small || card.images?.large
  const setCode = card.set?.ptcgoCode || card.set?.id || card.set?.name || 'Unknown'
  const releaseDate = card.set?.releaseDate || ''

  // Check rotation status for Pokemon cards
  const isPokemonCard = card.tcgSystem === 'pokemon' || !card.tcgSystem
  const rotationInfo = isPokemonCard && card.regulationMark ? getRotationInfo(card.regulationMark) : null
  const isRotatingSoon = rotationInfo?.status === 'rotating-soon'
  const isRotated = rotationInfo?.status === 'rotated'

  return (
    <Link to={`/card/${card.id}`}>
      <div className="card hover:shadow-xl transition-shadow duration-200 cursor-pointer h-full">
        <div className="aspect-[2.5/3.5] relative mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={card.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}

          {/* Rotation indicator badge */}
          {isPokemonCard && card.regulationMark && (isRotatingSoon || isRotated) && (
            <div
              className="absolute top-2 right-2"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-lg ${
                isRotated
                  ? 'bg-red-500 text-white'
                  : 'bg-yellow-400 text-yellow-900'
              }`}>
                {card.regulationMark}!
              </span>

              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute z-50 right-0 top-full mt-1 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                  {isRotated ? (
                    <div>
                      <div className="font-semibold text-red-400 mb-1">No legal en Standard</div>
                      <div>Esta carta ya rotó del formato estándar</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-yellow-400 mb-1">Rotará pronto</div>
                      {rotationInfo.rotationDate && (
                        <div>Sale del formato: {formatDate(rotationInfo.rotationDate)}</div>
                      )}
                      {rotationInfo.daysUntilRotation && (
                        <div className="mt-1 text-yellow-300">
                          {formatDaysUntilRotation(rotationInfo.daysUntilRotation)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-bold text-lg mb-1 line-clamp-2 text-gray-900 dark:text-gray-100">{card.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-mono">{setCode}</p>
          {releaseDate && (
            <p className="text-xs text-gray-500 dark:text-gray-500">{formatDate(releaseDate)}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {card.rarity && (
              <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded">
                {card.rarity}
              </span>
            )}
            {/* Regulation mark for non-rotating cards */}
            {isPokemonCard && card.regulationMark && !isRotatingSoon && !isRotated && (
              <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded font-medium">
                {card.regulationMark}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CardItem

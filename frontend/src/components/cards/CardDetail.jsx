import Spinner from '../common/Spinner'
import CardReactions from './CardReactions'

// Type emoji mapping
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

const CardDetail = ({ card, stats }) => {
  if (!card) {
    return (
      <div className="text-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const imageUrl = card.images?.large || card.images?.small
  const setName = card.set?.name || 'Unknown Set'
  const releaseDate = card.set?.releaseDate || ''

  // Calculate legal format date (2 weeks after release)
  const calculateLegalDate = (releaseDateStr) => {
    if (!releaseDateStr) return null
    const releaseDate = new Date(releaseDateStr)
    const legalDate = new Date(releaseDate)
    legalDate.setDate(legalDate.getDate() + 14)
    return legalDate.toISOString().split('T')[0]
  }

  const legalFormatDate = calculateLegalDate(releaseDate)

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Card Image */}
      <div>
        <div className="card sticky top-4">
          <div className="aspect-[2.5/3.5] relative bg-gray-100 rounded-lg overflow-hidden">
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
          </div>
        </div>
      </div>

      {/* Card Info */}
      <div>
        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-4">{card.name}</h1>

          <div className="space-y-3">
            {/* Set Info */}
            <div>
              <span className="font-semibold text-gray-700">Set:</span>
              <span className="ml-2 text-gray-600">{setName}</span>
            </div>

            {releaseDate && (
              <div>
                <span className="font-semibold text-gray-700">Release Date:</span>
                <span className="ml-2 text-gray-600">{releaseDate}</span>
              </div>
            )}

            {legalFormatDate && (
              <div>
                <span className="font-semibold text-gray-700">Enter Legal Format:</span>
                <span className="ml-2 text-gray-600">{legalFormatDate}</span>
              </div>
            )}

            {card.regulationMark && (
              <div>
                <span className="font-semibold text-gray-700">Regulation Mark:</span>
                <span className="ml-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded font-bold">
                    {card.regulationMark}
                  </span>
                </span>
              </div>
            )}

            {card.rarity && (
              <div>
                <span className="font-semibold text-gray-700">Rarity:</span>
                <span className="ml-2">
                  <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded">
                    {card.rarity}
                  </span>
                </span>
              </div>
            )}

            {card.supertype && (
              <div>
                <span className="font-semibold text-gray-700">Type:</span>
                <span className="ml-2 text-gray-600">{card.supertype}</span>
              </div>
            )}

            {card.types && card.types.length > 0 && (
              <div>
                <span className="font-semibold text-gray-700">Types:</span>
                <div className="inline-flex gap-2 ml-2">
                  {card.types.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-sm rounded flex items-center gap-1"
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
                <span className="font-semibold text-gray-700">HP:</span>
                <span className="ml-2 text-gray-600">{card.hp}</span>
              </div>
            )}
          </div>

          {/* Card Reactions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <CardReactions cardId={card.id} />
          </div>
        </div>

        {/* Attacks */}
        {card.attacks && card.attacks.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">⚔️ Attacks</h2>
            <div className="space-y-4">
              {card.attacks.map((attack, idx) => (
                <div key={idx} className="border-l-4 border-primary-500 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{attack.name}</h3>
                    {attack.damage && (
                      <span className="text-red-600 font-bold">💥 {attack.damage}</span>
                    )}
                  </div>
                  {attack.text && (
                    <p className="text-sm text-gray-600">{attack.text}</p>
                  )}
                  {attack.cost && attack.cost.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {attack.cost.map((cost, costIdx) => (
                        <span
                          key={costIdx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded flex items-center gap-1"
                        >
                          {TYPE_EMOJIS[cost] && <span>{TYPE_EMOJIS[cost]}</span>}
                          {cost}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Abilities */}
        {card.abilities && card.abilities.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">✨ Abilities</h2>
            <div className="space-y-4">
              {card.abilities.map((ability, idx) => (
                <div key={idx} className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{ability.name}</h3>
                    <span className="text-xs text-gray-500 italic">({ability.type})</span>
                  </div>
                  <p className="text-sm text-gray-700">{ability.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Community Activity</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Comments:</span>
                <span className="font-semibold">{stats.commentCount || 0}</span>
              </div>
              {stats.reactionCounts && Object.keys(stats.reactionCounts).length > 0 && (
                <div>
                  <span className="text-gray-600 block mb-2">Reactions:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.reactionCounts).map(([emoji, count]) => (
                      <span key={emoji} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                        {emoji} {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CardDetail

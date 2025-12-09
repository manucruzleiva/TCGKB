import { Link } from 'react-router-dom'

const CardItem = ({ card }) => {
  const imageUrl = card.images?.small || card.images?.large
  const setName = card.set?.name || 'Unknown Set'
  const releaseDate = card.set?.releaseDate || ''

  return (
    <Link to={`/card/${card.id}`}>
      <div className="card hover:shadow-xl transition-shadow duration-200 cursor-pointer h-full">
        <div className="aspect-[2.5/3.5] relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
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
        </div>

        <div>
          <h3 className="font-bold text-lg mb-1 line-clamp-2">{card.name}</h3>
          <p className="text-sm text-gray-600 mb-1">{setName}</p>
          {releaseDate && (
            <p className="text-xs text-gray-500">{releaseDate}</p>
          )}
          {card.rarity && (
            <span className="inline-block mt-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
              {card.rarity}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default CardItem

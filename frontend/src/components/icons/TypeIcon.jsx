/**
 * TypeIcon - Pokemon Type SVG Icons Component
 *
 * SVG paths from duiker101/pokemon-type-svg-icons (MIT License)
 * https://github.com/duiker101/pokemon-type-svg-icons
 *
 * Supports:
 * - All 11 TCG types: Fire, Water, Grass, Electric, Psychic, Fighting, Dark, Steel, Dragon, Fairy, Colorless
 * - Color/grayscale toggle via `active` prop
 * - Customizable size
 */

// Pokemon Type Colors (official TCG colors)
export const TYPE_COLORS = {
  fire: '#F08030',
  water: '#6890F0',
  grass: '#78C850',
  electric: '#F8D030',
  psychic: '#F85888',
  fighting: '#C03028',
  dark: '#705848',
  steel: '#B8B8D0',
  dragon: '#7038F8',
  fairy: '#EE99AC',
  colorless: '#A8A878'
}

// SVG Path data for each type (viewBox: 0 0 512 512)
const TYPE_PATHS = {
  fire: 'M352.258 395.394C358.584 372.263 346.305 324.71 346.305 324.71C346.305 324.71 337.399 363.449 323.483 377.767C311.611 389.98 297.066 398.451 276.206 400.677C293.261 392.393 304.99 375.12 304.99 355.155C304.99 327.129 281.878 304.409 253.368 304.409C224.858 304.409 201.745 327.129 201.745 355.155C201.745 362.809 203.47 370.068 206.557 376.576C188.725 362.37 185.921 339.594 185.921 339.594C185.921 339.594 166.009 422.264 220.875 461.152C275.74 500.04 383.219 466.614 383.219 466.614C383.219 466.614 229.41 574.837 115.436 457.05C17.2568 355.584 89.8111 222.003 89.8111 222.003C89.8111 222.003 86.6777 234.395 86.6777 248.78C86.6777 263.165 94.477 274.11 94.477 274.11C94.477 274.11 117.742 225.071 135.848 205.128C152.984 186.254 174.465 170.946 193.019 157.724C207.301 147.546 219.849 138.604 227.343 130.223C268.62 84.0687 243.311 0 243.311 0C243.311 0 289.841 41.02 302.831 93.9978C307.783 114.192 304.597 137.169 301.749 157.716C297.125 191.072 293.388 218.025 326.793 216.276C380.775 213.449 333.866 130.223 333.866 130.223C333.866 130.223 456.318 194.583 447.17 307.145C438.021 419.707 313.324 445.297 313.324 445.297C313.324 445.297 345.931 418.525 352.258 395.394Z',
  water: 'M256 512C167.634 512 96 440.366 96 352C96 263.634 256 0 256 0C256 0 416 263.634 416 352C416 440.366 344.366 512 256 512ZM256 448C309.019 448 352 405.019 352 352C352 298.981 309.019 256 256 256C202.981 256 160 298.981 160 352C160 405.019 202.981 448 256 448Z',
  grass: 'M437.019 74.981C346.353 -15.685 165.647 -15.685 74.981 74.981C-15.685 165.647 -15.685 346.353 74.981 437.019C165.647 527.685 346.353 527.685 437.019 437.019C527.685 346.353 527.685 165.647 437.019 74.981ZM256 384C185.308 384 128 326.692 128 256C128 185.308 185.308 128 256 128C326.692 128 384 185.308 384 256C384 326.692 326.692 384 256 384ZM256 192L288 256L256 320L224 256L256 192Z',
  electric: 'M352 0L160 224H256L160 512L416 224H288L352 0Z',
  psychic: 'M256 0C256 0 128 128 128 256C128 384 256 512 256 512C256 512 384 384 384 256C384 128 256 0 256 0ZM256 352C202.981 352 160 309.019 160 256C160 202.981 202.981 160 256 160C309.019 160 352 202.981 352 256C352 309.019 309.019 352 256 352Z',
  fighting: 'M416 160C416 71.634 344.366 0 256 0C167.634 0 96 71.634 96 160C96 248.366 167.634 320 256 320V512L320 448L384 512V320C384 320 416 248.366 416 160ZM256 256C220.654 256 192 227.346 192 192C192 156.654 220.654 128 256 128C291.346 128 320 156.654 320 192C320 227.346 291.346 256 256 256Z',
  dark: 'M256 0C114.615 0 0 114.615 0 256C0 397.385 114.615 512 256 512C397.385 512 512 397.385 512 256C512 114.615 397.385 0 256 0ZM256 384C185.308 384 128 326.692 128 256C128 185.308 185.308 128 256 128C326.692 128 384 185.308 384 256C384 326.692 326.692 384 256 384ZM352 256C352 309.019 309.019 352 256 352C202.981 352 160 309.019 160 256C160 202.981 202.981 160 256 160C309.019 160 352 202.981 352 256Z',
  steel: 'M256 0L128 128V256L0 256L128 384V512L256 384L384 512V384L512 256L384 256V128L256 0ZM256 192L320 256L256 320L192 256L256 192Z',
  dragon: 'M437.019 74.981C346.353 -15.685 165.647 -15.685 74.981 74.981C-15.685 165.647 -15.685 346.353 74.981 437.019C165.647 527.685 346.353 527.685 437.019 437.019C527.685 346.353 527.685 165.647 437.019 74.981ZM352 352L256 448L160 352L160 160L256 64L352 160L352 352Z',
  fairy: 'M256 0L320 128L448 128L352 224L384 352L256 288L128 352L160 224L64 128L192 128L256 0ZM256 192C229.49 192 208 213.49 208 240C208 266.51 229.49 288 256 288C282.51 288 304 266.51 304 240C304 213.49 282.51 192 256 192Z',
  colorless: 'M256 0C114.615 0 0 114.615 0 256C0 397.385 114.615 512 256 512C397.385 512 512 397.385 512 256C512 114.615 397.385 0 256 0ZM256 448C150.115 448 64 361.885 64 256C64 150.115 150.115 64 256 64C361.885 64 448 150.115 448 256C448 361.885 361.885 448 256 448Z'
}

/**
 * TypeIcon Component
 *
 * @param {Object} props
 * @param {string} props.type - Pokemon type (fire, water, grass, etc.)
 * @param {number} props.size - Icon size in pixels (default: 24)
 * @param {boolean} props.active - Color when active, grayscale when inactive (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 */
const TypeIcon = ({
  type,
  size = 24,
  active = true,
  className = '',
  onClick,
  title
}) => {
  const normalizedType = type?.toLowerCase()
  const path = TYPE_PATHS[normalizedType]
  const color = TYPE_COLORS[normalizedType] || '#888888'

  if (!path) {
    // Fallback for unknown types
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-gray-400 ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
        title={title || type}
      >
        <span className="text-white text-xs font-bold">?</span>
      </div>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`
        transition-all duration-200 cursor-pointer
        ${active ? '' : 'grayscale opacity-40'}
        ${className}
      `}
      onClick={onClick}
      role="img"
      aria-label={`${type} type`}
      title={title || type}
    >
      <circle cx="256" cy="256" r="256" fill={color} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={path}
        fill="white"
        transform="scale(0.7) translate(110, 110)"
      />
    </svg>
  )
}

/**
 * TypeIconList - Display multiple type icons
 *
 * @param {Object} props
 * @param {string[]} props.types - Array of type names
 * @param {number} props.size - Icon size (default: 20)
 * @param {string} props.className - Container classes
 */
export const TypeIconList = ({ types = [], size = 20, className = '' }) => {
  if (!types || types.length === 0) return null

  return (
    <div className={`flex gap-1 ${className}`}>
      {types.map((type, index) => (
        <TypeIcon key={`${type}-${index}`} type={type} size={size} />
      ))}
    </div>
  )
}

/**
 * TypeFilterBar - Toggleable type filter bar
 *
 * @param {Object} props
 * @param {string[]} props.types - All available types
 * @param {string[]} props.activeTypes - Currently active (visible) types
 * @param {Function} props.onToggle - Called with type name when toggled
 * @param {number} props.size - Icon size (default: 28)
 */
export const TypeFilterBar = ({
  types = Object.keys(TYPE_COLORS),
  activeTypes = [],
  onToggle,
  size = 28,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {types.map(type => (
        <TypeIcon
          key={type}
          type={type}
          size={size}
          active={activeTypes.includes(type)}
          onClick={() => onToggle?.(type)}
          title={type.charAt(0).toUpperCase() + type.slice(1)}
        />
      ))}
    </div>
  )
}

export default TypeIcon

/**
 * DomainIcon - Riftbound Domain SVG Icons Component
 *
 * Custom SVG icons for the 6 Riftbound domains:
 * Fury, Calm, Mind, Body, Order, Chaos
 *
 * Supports:
 * - All 6 domains with unique icons
 * - Color/grayscale toggle via `active` prop
 * - Customizable size
 */

// Riftbound Domain Colors
export const DOMAIN_COLORS = {
  fury: '#DC2626',    // Red - aggressive, fiery
  calm: '#3B82F6',    // Blue - peaceful, water
  mind: '#8B5CF6',    // Purple - psychic, mental
  body: '#16A34A',    // Green - physical, nature
  order: '#F59E0B',   // Amber - structure, light
  chaos: '#1F2937'    // Dark gray - entropy, void
}

// SVG Path data for each domain (viewBox: 0 0 24 24)
const DOMAIN_PATHS = {
  // Fury: Flame/fire icon
  fury: 'M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12.5 18.5C10.5 18.5 9 17 9 15C9 13 12.5 9 12.5 9C12.5 9 16 13 16 15C16 17 14.5 18.5 12.5 18.5Z',
  // Calm: Water drop icon
  calm: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 19C8.69 19 6 16.31 6 13C6 9 12 4 12 4C12 4 18 9 18 13C18 16.31 15.31 19 12 19Z',
  // Mind: Eye/psychic icon
  mind: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z',
  // Body: Shield/strength icon
  body: 'M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z',
  // Order: Star/balance icon
  order: 'M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2ZM12 6.24L13.68 10.39L18.11 10.78L14.66 13.71L15.72 18.05L12 15.82L8.28 18.05L9.34 13.71L5.89 10.78L10.32 10.39L12 6.24Z',
  // Chaos: Spiral/entropy icon
  chaos: 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12ZM12 6C9.24 6 7 8.24 7 11H9C9 9.35 10.35 8 12 8C13.65 8 15 9.35 15 11C15 12.65 13.65 14 12 14V16C14.76 16 17 13.76 17 11C17 8.24 14.76 6 12 6Z'
}

/**
 * DomainIcon Component
 *
 * @param {Object} props
 * @param {string} props.domain - Riftbound domain (fury, calm, mind, body, order, chaos)
 * @param {number} props.size - Icon size in pixels (default: 24)
 * @param {boolean} props.active - Color when active, grayscale when inactive (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 */
const DomainIcon = ({
  domain,
  size = 24,
  active = true,
  className = '',
  onClick,
  title
}) => {
  const normalizedDomain = domain?.toLowerCase()
  const path = DOMAIN_PATHS[normalizedDomain]
  const color = DOMAIN_COLORS[normalizedDomain] || '#888888'

  if (!path) {
    // Fallback for unknown domains
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-gray-400 ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
        title={title || domain}
      >
        <span className="text-white text-xs font-bold">?</span>
      </div>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`
        transition-all duration-200 cursor-pointer
        ${active ? '' : 'grayscale opacity-40'}
        ${className}
      `}
      onClick={onClick}
      role="img"
      aria-label={`${domain} domain`}
      title={title || domain}
    >
      <circle cx="12" cy="12" r="11" fill={color} />
      <path
        d={path}
        fill="white"
        transform="scale(0.6) translate(8, 8)"
      />
    </svg>
  )
}

/**
 * DomainIconList - Display multiple domain icons
 *
 * @param {Object} props
 * @param {string[]} props.domains - Array of domain names
 * @param {number} props.size - Icon size (default: 20)
 * @param {string} props.className - Container classes
 */
export const DomainIconList = ({ domains = [], size = 20, className = '' }) => {
  if (!domains || domains.length === 0) return null

  return (
    <div className={`flex gap-1 ${className}`}>
      {domains.map((domain, index) => (
        <DomainIcon key={`${domain}-${index}`} domain={domain} size={size} />
      ))}
    </div>
  )
}

/**
 * DomainFilterBar - Toggleable domain filter bar
 *
 * @param {Object} props
 * @param {string[]} props.domains - All available domains
 * @param {string[]} props.activeDomains - Currently active (visible) domains
 * @param {Function} props.onToggle - Called with domain name when toggled
 * @param {number} props.size - Icon size (default: 28)
 */
export const DomainFilterBar = ({
  domains = Object.keys(DOMAIN_COLORS),
  activeDomains = [],
  onToggle,
  size = 28,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {domains.map(domain => (
        <DomainIcon
          key={domain}
          domain={domain}
          size={size}
          active={activeDomains.includes(domain)}
          onClick={() => onToggle?.(domain)}
          title={domain.charAt(0).toUpperCase() + domain.slice(1)}
        />
      ))}
    </div>
  )
}

export default DomainIcon

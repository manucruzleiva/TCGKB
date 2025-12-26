/**
 * TrainerSubtypeIcon - Pokemon Trainer Subtype SVG Icons Component
 *
 * Supports:
 * - Tool (wrench/gear icon)
 * - Stadium (building/arena icon)
 * - Supporter (person icon)
 * - Item (pokeball/bag icon)
 * - Color/grayscale toggle via `active` prop
 * - Customizable size
 */

// Trainer Subtype Colors
export const SUBTYPE_COLORS = {
  tool: '#818CF8',      // Indigo
  stadium: '#FB923C',   // Orange
  supporter: '#FCA5D7', // Pink
  item: '#A5F84D'       // Green
}

// SVG Path data for each subtype (viewBox: 0 0 512 512)
const SUBTYPE_PATHS = {
  // Tool icon (wrench/gear)
  tool: 'M352 0L320 32L384 96L416 64L480 128L448 160L512 224L480 256L448 224L416 256L384 224L352 256L320 224L288 256L256 224L224 256L192 224L160 256L128 224L96 256L64 224L32 256L0 224L64 160L32 128L96 64L128 96L192 32L160 0L256 0L288 32L320 0L352 0ZM256 128C220.654 128 192 156.654 192 192C192 227.346 220.654 256 256 256C291.346 256 320 227.346 320 192C320 156.654 291.346 128 256 128ZM416 288L384 320L448 384L416 416L480 480L512 448L448 384L480 352L416 288Z',

  // Stadium icon (building/arena)
  stadium: 'M256 32L96 96V192H64V448H128V256H192V448H320V256H384V448H448V192H416V96L256 32ZM256 96L384 144V192H352V224H160V192H128V144L256 96ZM160 256V288H192V256H160ZM224 256V288H256V256H224ZM288 256V288H320V256H288ZM160 320V352H192V320H160ZM224 320V352H256V320H224ZM288 320V352H320V320H288ZM160 384V416H192V384H160ZM224 384V416H256V384H224ZM288 384V416H320V384H288Z',

  // Supporter icon (person)
  supporter: 'M256 64C202.981 64 160 106.981 160 160C160 213.019 202.981 256 256 256C309.019 256 352 213.019 352 160C352 106.981 309.019 64 256 64ZM128 288C92.654 288 64 316.654 64 352V512H448V352C448 316.654 419.346 288 384 288H128Z',

  // Item icon (bag/pokeball)
  item: 'M256 0C114.615 0 0 114.615 0 256C0 397.385 114.615 512 256 512C397.385 512 512 397.385 512 256C512 114.615 397.385 0 256 0ZM256 64C326.692 64 384 121.308 384 192H320C320 156.654 291.346 128 256 128C220.654 128 192 156.654 192 192H128C128 121.308 185.308 64 256 64ZM128 224H192V256H128V224ZM320 224H384V256H320V224ZM128 320C128 249.308 185.308 192 256 192C326.692 192 384 249.308 384 320C384 390.692 326.692 448 256 448C185.308 448 128 390.692 128 320ZM256 256C220.654 256 192 284.654 192 320C192 355.346 220.654 384 256 384C291.346 384 320 355.346 320 320C320 284.654 291.346 256 256 256Z'
}

/**
 * TrainerSubtypeIcon Component
 *
 * @param {Object} props
 * @param {string} props.subtype - Trainer subtype (tool, stadium, supporter, item)
 * @param {number} props.size - Icon size in pixels (default: 24)
 * @param {boolean} props.active - Color when active, grayscale when inactive (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 */
const TrainerSubtypeIcon = ({
  subtype,
  size = 24,
  active = true,
  className = '',
  onClick,
  title
}) => {
  const normalizedSubtype = subtype?.toLowerCase()
  const path = SUBTYPE_PATHS[normalizedSubtype]
  const color = SUBTYPE_COLORS[normalizedSubtype] || '#888888'

  if (!path) {
    // Fallback for unknown subtypes
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-gray-400 ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
        title={title || subtype}
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
      className={`inline-block transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:scale-110' : ''
      } ${className}`}
      onClick={onClick}
      title={title || subtype}
      style={{
        fill: active ? color : '#9CA3AF',
        filter: active ? 'none' : 'grayscale(100%)',
        opacity: active ? 1 : 0.5
      }}
    >
      <path d={path} />
    </svg>
  )
}

/**
 * TrainerSubtypeIconList - Display multiple subtype icons
 *
 * @param {Object} props
 * @param {string[]} props.subtypes - Array of subtype names
 * @param {number} props.size - Icon size in pixels
 * @param {boolean} props.active - Active state for all icons
 */
export const TrainerSubtypeIconList = ({ subtypes = [], size = 20, active = true }) => {
  return (
    <div className="inline-flex gap-1 items-center">
      {subtypes.map(subtype => (
        <TrainerSubtypeIcon
          key={subtype}
          subtype={subtype}
          size={size}
          active={active}
        />
      ))}
    </div>
  )
}

/**
 * TrainerSubtypeFilterBar - Toggleable filter bar with all Trainer subtypes
 *
 * @param {Object} props
 * @param {string[]} props.activeSubtypes - Array of active subtype names
 * @param {Function} props.onToggle - Callback when subtype is toggled (subtype) => void
 * @param {number} props.size - Icon size in pixels
 */
export const TrainerSubtypeFilterBar = ({ activeSubtypes = [], onToggle, size = 24 }) => {
  const subtypes = ['supporter', 'item', 'tool', 'stadium']

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {subtypes.map(subtype => {
        const isActive = activeSubtypes.includes(subtype)
        return (
          <TrainerSubtypeIcon
            key={subtype}
            subtype={subtype}
            size={size}
            active={isActive}
            onClick={() => onToggle && onToggle(subtype)}
            title={subtype.charAt(0).toUpperCase() + subtype.slice(1)}
            className="transition-transform"
          />
        )
      })}
    </div>
  )
}

export default TrainerSubtypeIcon

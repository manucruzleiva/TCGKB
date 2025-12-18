import { memo } from 'react'

/**
 * GameLogo - Displays a TCG system logo (Pokeball or Riftbound)
 */
const GameLogo = memo(function GameLogo({
  tcgSystem = 'pokemon',
  size = 'sm',
  className = ''
}) {
  // Size mappings
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }

  const sizeClass = sizeClasses[size] || sizeClasses.sm

  // Pokeball SVG
  const PokeballIcon = () => (
    <svg viewBox="0 0 100 100" className={`${sizeClass} ${className}`}>
      <circle cx="50" cy="50" r="48" fill="#fff" stroke="#333" strokeWidth="4"/>
      <path d="M2 50 H98" stroke="#333" strokeWidth="4"/>
      <path d="M2 50 A48 48 0 0 0 98 50" fill="#ff1a1a"/>
      <circle cx="50" cy="50" r="18" fill="#fff" stroke="#333" strokeWidth="4"/>
      <circle cx="50" cy="50" r="8" fill="#fff" stroke="#333" strokeWidth="2"/>
    </svg>
  )

  // Riftbound SVG
  const RiftboundIcon = () => (
    <svg viewBox="0 0 100 100" className={`${sizeClass} ${className}`}>
      <defs>
        <linearGradient id={`riftGradMini-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
      </defs>
      <rect x="10" y="5" width="80" height="90" rx="8" fill={`url(#riftGradMini-${size})`} stroke="#1e293b" strokeWidth="3"/>
      <path d="M35 30 L50 45 L65 30 M35 50 L50 65 L65 50"
            fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="50" cy="55" r="4" fill="#fff"/>
    </svg>
  )

  if (tcgSystem === 'riftbound') {
    return <RiftboundIcon />
  }

  // Default to Pokemon
  return <PokeballIcon />
})

export default GameLogo

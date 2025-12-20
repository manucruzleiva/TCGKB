import { useState, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

/**
 * DeckCardInteractive - Card component with full interaction support
 *
 * Interactions:
 * - Left Click: Add 1 copy (search) / Show controls (deck)
 * - Right Click: Remove 1 copy
 * - Ctrl + Click: Open quantity input
 * - Drag & Drop: Drag to add to deck
 *
 * Props:
 * - card: { id/cardId, name, images, supertype, quantity }
 * - mode: 'search' | 'deck'
 * - onAdd: (card, quantity) => void
 * - onRemove: (cardId) => void
 * - onDelete: (cardId) => void
 * - onSetQuantity: (cardId, quantity) => void
 * - maxQuantity: number (default 4, 60 for energy)
 * - draggable: boolean
 */
const DeckCardInteractive = ({
  card,
  mode = 'search',
  onAdd,
  onRemove,
  onDelete,
  onSetQuantity,
  maxQuantity = 4,
  draggable = true
}) => {
  const { language } = useLanguage()
  const [showQuantityInput, setShowQuantityInput] = useState(false)
  const [quantityValue, setQuantityValue] = useState(card.quantity || 1)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef(null)

  const cardId = card.id || card.cardId
  const imageUrl = card.images?.small || card.imageSmall

  // Handle left click
  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+Click: Open quantity input
      e.preventDefault()
      setQuantityValue(card.quantity || 1)
      setShowQuantityInput(true)
    } else if (mode === 'search') {
      // Regular click on search result: add 1 copy
      onAdd?.(card, 1)
    }
  }

  // Handle right click
  const handleContextMenu = (e) => {
    e.preventDefault()
    if (mode === 'deck' && card.quantity > 0) {
      onRemove?.(cardId)
    }
  }

  // Handle quantity input submit
  const handleQuantitySubmit = (e) => {
    e.preventDefault()
    const qty = Math.max(1, Math.min(maxQuantity, parseInt(quantityValue) || 1))
    if (mode === 'search') {
      onAdd?.(card, qty)
    } else {
      onSetQuantity?.(cardId, qty)
    }
    setShowQuantityInput(false)
  }

  // Drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true)
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: cardId,
      name: card.name,
      supertype: card.supertype,
      images: card.images || { small: card.imageSmall }
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  if (mode === 'search') {
    return (
      <div className="relative">
        <button
          ref={cardRef}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          draggable={draggable}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`
            relative group rounded-lg overflow-hidden border-2 transition-all
            ${isDragging ? 'opacity-50 border-primary-500' : 'border-transparent hover:border-primary-500'}
            cursor-pointer
          `}
          title={`${card.name}\n${language === 'es' ? 'Click: +1 | Ctrl+Click: cantidad | Arrastrar: añadir' : 'Click: +1 | Ctrl+Click: set qty | Drag: add'}`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={card.name}
              className="w-full h-auto"
              draggable={false}
            />
          ) : (
            <div className="aspect-[63/88] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs text-gray-500 text-center px-1">{card.name}</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white font-bold text-2xl">+</span>
          </div>

          {/* Drag indicator */}
          {draggable && (
            <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </div>
          )}
        </button>

        {/* Quantity input modal */}
        {showQuantityInput && (
          <div className="absolute inset-0 z-10 bg-black/80 rounded-lg flex items-center justify-center">
            <form onSubmit={handleQuantitySubmit} className="p-2">
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantityValue}
                onChange={(e) => setQuantityValue(e.target.value)}
                autoFocus
                onFocus={(e) => e.target.select()}
                onBlur={() => setShowQuantityInput(false)}
                className="w-16 px-2 py-1 text-center text-lg font-bold rounded border-2 border-primary-500 focus:outline-none"
              />
            </form>
          </div>
        )}
      </div>
    )
  }

  // Deck mode
  return (
    <div className="relative">
      <div
        ref={cardRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 cursor-pointer"
        title={`${card.name}\n${language === 'es' ? 'Click derecho: -1 | Ctrl+Click: cantidad' : 'Right-click: -1 | Ctrl+Click: set qty'}`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="w-full h-auto"
          />
        ) : (
          <div className="aspect-[63/88] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-xs text-gray-500 text-center px-1">{card.name}</span>
          </div>
        )}

        {/* Quantity badge */}
        <div className="absolute top-1 right-1 px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
          ×{card.quantity}
        </div>

        {/* Hover controls */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove?.(cardId) }}
            className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
            title={language === 'es' ? 'Quitar 1' : 'Remove 1'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd?.(card, 1) }}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            title={language === 'es' ? 'Añadir 1' : 'Add 1'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(cardId) }}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title={language === 'es' ? 'Eliminar' : 'Delete'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quantity input modal */}
      {showQuantityInput && (
        <div className="absolute inset-0 z-10 bg-black/80 rounded-lg flex items-center justify-center">
          <form onSubmit={handleQuantitySubmit} className="p-2">
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantityValue}
              onChange={(e) => setQuantityValue(e.target.value)}
              autoFocus
              onFocus={(e) => e.target.select()}
              onBlur={() => setShowQuantityInput(false)}
              className="w-16 px-2 py-1 text-center text-lg font-bold rounded border-2 border-primary-500 focus:outline-none"
            />
          </form>
        </div>
      )}
    </div>
  )
}

/**
 * DeckDropZone - Drop zone for cards
 */
export const DeckDropZone = ({ children, onDrop, className = '' }) => {
  const { language } = useLanguage()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const cardData = JSON.parse(e.dataTransfer.getData('application/json'))
      onDrop?.(cardData)
    } catch (err) {
      console.error('Drop error:', err)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        ${className}
        ${isDragOver ? 'ring-2 ring-primary-500 ring-offset-2 bg-primary-50 dark:bg-primary-900/20' : ''}
        transition-all
      `}
    >
      {children}

      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium shadow-lg">
            {language === 'es' ? 'Soltar para añadir' : 'Drop to add'}
          </div>
        </div>
      )}
    </div>
  )
}

export default DeckCardInteractive

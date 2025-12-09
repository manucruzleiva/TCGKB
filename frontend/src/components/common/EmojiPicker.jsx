import { useState, useRef, useEffect } from 'react'
import { EMOJIS } from '../../utils/constants'

const EmojiPicker = ({ onEmojiSelect, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-gray-800 text-xl"
        title="Agregar reacción"
      >
        😊
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50">
          <div className="flex gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl hover:scale-125 transition-transform"
                title={`Reaccionar con ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EmojiPicker

import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import Input from '../common/Input'

const CardSearch = ({ onSearch, loading, onCancel, initialValue = '' }) => {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const [isHovering, setIsHovering] = useState(false)

  // Update searchTerm when initialValue changes (from header search)
  useEffect(() => {
    if (initialValue && initialValue !== searchTerm) {
      setSearchTerm(initialValue)
      onSearch(initialValue)
    }
  }, [initialValue])

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  const handleChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSearch} className="mb-8">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            type="text"
            name="search"
            value={searchTerm}
            onChange={handleChange}
            placeholder={t('search.placeholder')}
            className="mb-0"
          />
        </div>
        <button
          type={loading && isHovering ? 'button' : 'submit'}
          disabled={loading && !isHovering}
          onClick={loading && isHovering ? handleCancel : undefined}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`px-8 min-w-[140px] transition-all duration-200 flex items-center justify-center gap-2 ${
            loading && isHovering
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'btn-primary'
          }`}
        >
          {loading ? (
            isHovering ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('search.cancel')}
              </>
            ) : (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t('search.loading')}
              </>
            )
          ) : (
            t('search.button')
          )}
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {searchTerm ? `${t('search.searching')}: "${searchTerm}"` : t('search.showingRecent')}
      </p>
    </form>
  )
}

export default CardSearch

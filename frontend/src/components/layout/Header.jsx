import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import Button from '../common/Button'
import LanguageSwitcher from '../common/LanguageSwitcher'
import ThemeSwitcher from '../common/ThemeSwitcher'
import { cardService } from '../../services/cardService'

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin, isDev, canAccessBugDashboard } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [headerSearchTerm, setHeaderSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [mostCommented, setMostCommented] = useState([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMainMenu, setShowMainMenu] = useState(false)
  const searchRef = useRef(null)
  const searchTimeoutRef = useRef(null)
  const userMenuRef = useRef(null)
  const mainMenuRef = useRef(null)

  // Load most commented cards on mount
  useEffect(() => {
    const loadMostCommented = async () => {
      try {
        const response = await cardService.getMostCommentedCards(10)
        if (response.success && response.data && response.data.cards) {
          setMostCommented(response.data.cards)
        }
      } catch (error) {
        console.error('Error loading most commented cards:', error)
      }
    }
    loadMostCommented()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (mainMenuRef.current && !mainMenuRef.current.contains(event.target)) {
        setShowMainMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (headerSearchTerm.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await cardService.searchCards(headerSearchTerm, 8)

        if (response.success && response.data && response.data.cards) {
          const cards = response.data.cards
          setSearchResults(cards)
          setShowDropdown(cards.length > 0)
        } else {
          setSearchResults([])
          setShowDropdown(false)
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
        setShowDropdown(false)
      } finally {
        setIsSearching(false)
      }
    }, 150)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [headerSearchTerm])

  // Show most commented when focused without search term
  const handleSearchFocus = () => {
    if (headerSearchTerm.trim().length === 0 && mostCommented.length > 0) {
      setSearchResults(mostCommented)
      setShowDropdown(true)
    }
  }

  const handleCardSelect = (cardId) => {
    setHeaderSearchTerm('')
    setShowDropdown(false)
    setSearchResults([])
    navigate(`/card/${cardId}`)
  }

  const handleHeaderSearch = (e) => {
    e.preventDefault()
    // If there's exactly one result, navigate to it
    if (searchResults.length === 1) {
      handleCardSelect(searchResults[0].id)
    } else if (searchResults.length > 0) {
      handleCardSelect(searchResults[0].id)
    }
  }

  // Clear header search when location changes
  useEffect(() => {
    setHeaderSearchTerm('')
    setShowDropdown(false)
    setSearchResults([])
    setShowUserMenu(false)
    setShowMainMenu(false)
  }, [location])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md transition-colors">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Hamburger Menu */}
          <div ref={mainMenuRef} className="relative shrink-0">
            <button
              onClick={() => setShowMainMenu(!showMainMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={language === 'es' ? 'Menú' : 'Menu'}
            >
              {/* Logo as menu invoker - switches based on theme */}
              <img
                src="/logo-dark.png"
                alt="TCG KB"
                className="h-8 hidden dark:block"
              />
              <img
                src="/logo-light.png"
                alt="TCG KB"
                className="h-8 dark:hidden"
              />
            </button>

            {/* Main Menu Dropdown */}
            {showMainMenu && (
              <div
                className="absolute left-0 mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[9999] py-1"
                style={{ top: '100%' }}
              >
                <Link
                  to="/"
                  onClick={() => setShowMainMenu(false)}
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  🏠 {language === 'es' ? 'Inicio' : 'Home'}
                </Link>
                <Link
                  to="/decks"
                  onClick={() => setShowMainMenu(false)}
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  🃏 {language === 'es' ? 'Mazos' : 'Decks'}
                </Link>
                <Link
                  to="/catalog"
                  onClick={() => setShowMainMenu(false)}
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  📚 {language === 'es' ? 'Catalogo' : 'Catalog'}
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <Link
                  to="/changelog"
                  onClick={() => setShowMainMenu(false)}
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  📋 {language === 'es' ? 'Changelog' : 'Changelog'}
                </Link>
                <Link
                  to="/roadmap"
                  onClick={() => setShowMainMenu(false)}
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  🗺️ {language === 'es' ? 'Roadmap' : 'Roadmap'}
                </Link>
                <Link
                  to="/relationship-map"
                  onClick={() => setShowMainMenu(false)}
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  🔗 {language === 'es' ? 'Mapa de Relaciones' : 'Relationship Map'}
                </Link>
              </div>
            )}
          </div>

          {/* Search Bar with Autocomplete */}
          <div ref={searchRef} className="flex-1 max-w-md hidden md:block" style={{ position: 'relative' }}>
            <form onSubmit={handleHeaderSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={headerSearchTerm}
                  onChange={(e) => setHeaderSearchTerm(e.target.value)}
                  onFocus={handleSearchFocus}
                  placeholder={t('search.placeholder')}
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-colors"
                  autoComplete="off"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
            </form>

            {/* Autocomplete Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.5rem',
                  zIndex: 99999
                }}
              >
                {searchResults.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleCardSelect(card.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    {card.images?.small && (
                      <img
                        src={card.images.small}
                        alt={card.name}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {card.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {card.set?.name} • {card.number}
                      </div>
                    </div>
                    {card.tcgSystem && (
                      <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                        {card.tcgSystem}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {showDropdown && searchResults.length === 0 && !isSearching && headerSearchTerm.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[9999] px-4 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {t('search.noResults') || 'No results found'}
                </p>
              </div>
            )}
          </div>

          <nav className="flex items-center gap-3 shrink-0">
            <ThemeSwitcher />
            <LanguageSwitcher />

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 transition-all shadow-sm"
                aria-label="User menu"
              >
                {isAuthenticated && user?.avatar ? (
                  <div className={`w-full h-full bg-gradient-to-br ${user?.avatarBackground || 'from-primary-400 to-primary-600'}`}>
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  </div>
                ) : isAuthenticated ? (
                  <div className={`w-full h-full bg-gradient-to-br ${user?.avatarBackground || 'from-primary-400 to-primary-600'} flex items-center justify-center`}>
                    <span className="text-sm font-bold text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[9999] py-1"
                  style={{ top: '100%' }}
                >
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br ${user?.avatarBackground || 'from-primary-400 to-primary-600'} flex-shrink-0 flex items-center justify-center`}>
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {user?.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        ⚙️ {language === 'es' ? 'Preferencias' : 'Settings'}
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/mod"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          👑 {language === 'es' ? 'Panel de Moderación' : 'Mod Dashboard'}
                        </Link>
                      )}
                      {canAccessBugDashboard && (
                        <Link
                          to="/dev"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          🛠️ {language === 'es' ? 'Dev Dashboard' : 'Dev Dashboard'}
                          {isDev && !isAdmin && (
                            <span className="ml-1 text-xs text-primary-500">(Dev)</span>
                          )}
                        </Link>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            logout()
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          🚪 {t('nav.logout')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('nav.login')}
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-primary-600 dark:text-primary-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('nav.register')}
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header

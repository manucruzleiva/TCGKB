import { createContext, useState, useContext, useEffect, useCallback } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  // Get theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    return 'light'
  })

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement

    // Remove old theme class
    root.classList.remove('light', 'dark')

    // Add new theme class
    root.classList.add(theme)

    // Save to localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  /**
   * Set specific theme
   * @param {string} newTheme - 'light' or 'dark'
   */
  const setThemeMode = useCallback((newTheme) => {
    if (['light', 'dark'].includes(newTheme)) {
      setTheme(newTheme)
    }
  }, [])

  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    isDark: theme === 'dark'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context
 * @returns {Object} Theme context value
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext

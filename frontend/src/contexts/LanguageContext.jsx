import { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { translations, defaultLanguage, getNestedValue } from '../i18n'

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  // Get language from localStorage or use default
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language')
    return saved || defaultLanguage
  })

  const [isMorphing, setIsMorphing] = useState(false)

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  /**
   * Get translation by key path
   * @param {string} key - Dot-separated translation key (e.g., 'nav.home')
   * @returns {string} Translated text
   */
  const t = (key) => {
    const currentTranslations = translations[language]
    return getNestedValue(currentTranslations, key)
  }

  /**
   * Switch to a different language with morph animation
   * @param {string} newLanguage - Language code (en, es)
   */
  const changeLanguage = useCallback((newLanguage) => {
    if (translations[newLanguage] && newLanguage !== language) {
      // Start morph animation
      setIsMorphing(true)

      // Add morphing class to body for global text animation
      document.body.classList.add('lang-morphing')

      // Change language after brief delay for effect
      setTimeout(() => {
        setLanguage(newLanguage)
      }, 150)

      // Remove animation class
      setTimeout(() => {
        setIsMorphing(false)
        document.body.classList.remove('lang-morphing')
      }, 400)
    }
  }, [language])

  const value = {
    language,
    changeLanguage,
    t,
    isMorphing
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

/**
 * Hook to access language context
 * @returns {Object} Language context value
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext

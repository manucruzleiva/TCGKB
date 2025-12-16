import { en } from './translations/en'
import { es } from './translations/es'

export const translations = {
  en,
  es
}

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
]

export const defaultLanguage = 'es' // Default to Spanish

/**
 * Get nested translation value by path
 * @param {Object} obj - Translation object
 * @param {string} path - Dot-separated path (e.g., 'nav.home')
 * @returns {string} Translation value or path if not found
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

export default translations

/**
 * Date formatting utilities
 * Supports multiple date formats and localization
 */

export const DATE_FORMATS = {
  'YYYY-MM-DD': 'yyyy-mm-dd',
  'DD/MM/YYYY': 'dd/mm/yyyy',
  'MM/DD/YYYY': 'mm/dd/yyyy',
  'DD-MM-YYYY': 'dd-mm-yyyy',
  'YYYY/MM/DD': 'yyyy/mm/dd'
}

/**
 * Format a date string according to the specified format
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} format - Format key from DATE_FORMATS
 * @returns {string} Formatted date string
 */
export function formatDate(dateInput, format = 'YYYY-MM-DD') {
  if (!dateInput) return ''

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

  if (isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`
    default:
      return `${year}-${month}-${day}`
  }
}

/**
 * Format a date with time
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} format - Format key from DATE_FORMATS
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(dateInput, format = 'YYYY-MM-DD') {
  if (!dateInput) return ''

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

  if (isNaN(date.getTime())) return ''

  const formattedDate = formatDate(date, format)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${formattedDate} ${hours}:${minutes}`
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string|Date} dateInput - Date string or Date object
 * @param {Object} translations - Translation object with time keys
 * @returns {string} Relative time string
 */
export function getRelativeTime(dateInput, translations = {}) {
  if (!dateInput) return ''

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

  if (isNaN(date.getTime())) return ''

  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) {
    return translations.now || 'Now'
  } else if (minutes < 60) {
    return `${minutes} ${translations.minutesAgo || 'minutes ago'}`
  } else if (hours < 24) {
    return `${hours} ${translations.hoursAgo || 'hours ago'}`
  } else if (days < 7) {
    return `${days} ${translations.daysAgo || 'days ago'}`
  } else if (weeks < 4) {
    return `${weeks} ${translations.weeksAgo || 'weeks ago'}`
  } else if (months < 12) {
    return `${months} ${translations.monthsAgo || 'months ago'}`
  } else {
    return `${years} ${translations.yearsAgo || 'years ago'}`
  }
}

export default {
  formatDate,
  formatDateTime,
  getRelativeTime,
  DATE_FORMATS
}

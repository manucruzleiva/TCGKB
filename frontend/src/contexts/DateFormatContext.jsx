import { createContext, useState, useContext, useEffect } from 'react'
import { formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil, getRelativeTime, DATE_FORMATS } from '../utils/dateFormat'
import { useLanguage } from './LanguageContext'

const DateFormatContext = createContext()

export const DateFormatProvider = ({ children }) => {
  const { t } = useLanguage()

  const [dateFormat, setDateFormat] = useState(() => {
    const saved = localStorage.getItem('dateFormat')
    return saved || 'YYYY-MM-DD'
  })

  useEffect(() => {
    localStorage.setItem('dateFormat', dateFormat)
  }, [dateFormat])

  /**
   * Format a date using user's preferred format
   */
  const formatDate = (date) => {
    return formatDateUtil(date, dateFormat)
  }

  /**
   * Format a date with time using user's preferred format
   */
  const formatDateTime = (date) => {
    return formatDateTimeUtil(date, dateFormat)
  }

  /**
   * Get relative time with translations
   */
  const timeAgo = (date) => {
    return getRelativeTime(date, {
      now: t('time.now'),
      minutesAgo: t('time.minutesAgo'),
      hoursAgo: t('time.hoursAgo'),
      daysAgo: t('time.daysAgo'),
      weeksAgo: t('time.weeksAgo'),
      monthsAgo: t('time.monthsAgo'),
      yearsAgo: t('time.yearsAgo')
    })
  }

  /**
   * Change date format preference
   */
  const changeDateFormat = (newFormat) => {
    if (DATE_FORMATS[newFormat]) {
      setDateFormat(newFormat)
    }
  }

  const value = {
    dateFormat,
    changeDateFormat,
    formatDate,
    formatDateTime,
    timeAgo,
    availableFormats: Object.keys(DATE_FORMATS)
  }

  return (
    <DateFormatContext.Provider value={value}>
      {children}
    </DateFormatContext.Provider>
  )
}

/**
 * Hook to access date format context
 */
export const useDateFormat = () => {
  const context = useContext(DateFormatContext)
  if (!context) {
    throw new Error('useDateFormat must be used within a DateFormatProvider')
  }
  return context
}

export default DateFormatContext

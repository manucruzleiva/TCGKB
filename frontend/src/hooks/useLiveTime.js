import { useState, useEffect } from 'react'

/**
 * Hook that provides auto-updating relative time
 * Updates more frequently for recent times, less frequently for older times
 * @param {Date|string} date - The date to track
 * @returns {number} - A tick counter that increments when time should be recalculated
 */
export const useLiveTime = (date) => {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!date) return

    const targetDate = new Date(date)
    const now = new Date()
    const diffMs = now - targetDate
    const diffMinutes = Math.floor(diffMs / 60000)

    // Calculate update interval based on how old the date is
    let interval
    if (diffMinutes < 1) {
      // Less than 1 minute: update every 10 seconds
      interval = 10000
    } else if (diffMinutes < 60) {
      // Less than 1 hour: update every 30 seconds
      interval = 30000
    } else if (diffMinutes < 1440) {
      // Less than 1 day: update every 5 minutes
      interval = 300000
    } else {
      // Older: update every hour
      interval = 3600000
    }

    const timer = setInterval(() => {
      setTick(t => t + 1)
    }, interval)

    return () => clearInterval(timer)
  }, [date, tick]) // Re-calculate interval when tick changes

  return tick
}

/**
 * Hook that returns auto-updating relative time string
 * @param {Date|string} date - The date to format
 * @param {function} timeAgoFn - The timeAgo function from DateFormatContext
 * @returns {string} - Formatted relative time string
 */
export const useLiveTimeAgo = (date, timeAgoFn) => {
  useLiveTime(date)
  return timeAgoFn(date)
}

export default useLiveTime

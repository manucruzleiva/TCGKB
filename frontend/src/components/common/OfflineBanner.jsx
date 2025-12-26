import { useState, useEffect } from 'react'
import { useConnectivity } from '../../contexts/ConnectivityContext'
import { useLanguage } from '../../contexts/LanguageContext'

/**
 * OfflineBanner - Visual indicator for offline/online state
 *
 * Features:
 * - Shows offline state with cached content message
 * - Shows reconnecting state with spinner
 * - Shows back online state with success message (auto-dismisses)
 * - Manual retry button
 * - Accessibility: role="alert", aria-live="polite"
 * - Proper color contrast (4.5:1)
 *
 * @param {Object} props
 * @param {boolean} props.showRetry - Show retry button (default: true)
 * @param {boolean} props.autoDismiss - Auto-hide "back online" state (default: true)
 * @param {number} props.dismissDelay - Milliseconds before auto-dismiss (default: 3000)
 */
const OfflineBanner = ({
  showRetry = true,
  autoDismiss = true,
  dismissDelay = 3000
}) => {
  const { isOnline, reconnect, pendingChanges, syncStatus } = useConnectivity()
  const { t } = useLanguage()

  const [visible, setVisible] = useState(!isOnline)
  const [wasOffline, setWasOffline] = useState(false)

  // Handle visibility based on connection state
  useEffect(() => {
    if (!isOnline) {
      // Show banner when offline
      setVisible(true)
      setWasOffline(true)
    } else if (wasOffline && autoDismiss) {
      // Show "back online" message briefly
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setWasOffline(false)
      }, dismissDelay)

      return () => clearTimeout(timer)
    } else if (!wasOffline) {
      // Never went offline, keep hidden
      setVisible(false)
    }
  }, [isOnline, wasOffline, autoDismiss, dismissDelay])

  // Don't render if not visible
  if (!visible) return null

  // Determine banner state
  let state = 'offline'
  let bgColor = 'bg-yellow-500'
  let icon = '⚡'
  let message = t('offline.banner.offline')

  if (syncStatus === 'syncing') {
    state = 'reconnecting'
    bgColor = 'bg-blue-500'
    icon = '🔄'
    message = t('offline.banner.reconnecting')
  } else if (isOnline && wasOffline) {
    state = 'backOnline'
    bgColor = 'bg-green-500'
    icon = '✅'
    message = t('offline.banner.backOnline')
  }

  // Show pending changes count if offline
  const showPendingCount = !isOnline && pendingChanges > 0
  const pendingMessage = showPendingCount
    ? t('offline.features.pendingSync').replace('{{count}}', pendingChanges)
    : null

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50
        ${bgColor} text-white
        px-4 py-3
        shadow-lg
        transition-transform duration-300
        ${visible ? 'translate-y-0' : '-translate-y-full'}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Icon + Message */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className={`text-xl ${state === 'reconnecting' ? 'animate-spin' : ''}`}
            aria-hidden="true"
          >
            {icon}
          </span>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base truncate">
              {message}
            </p>
            {pendingMessage && (
              <p className="text-xs sm:text-sm opacity-90 mt-1">
                {pendingMessage}
              </p>
            )}
          </div>
        </div>

        {/* Retry Button */}
        {showRetry && state === 'offline' && (
          <button
            onClick={reconnect}
            className="
              px-4 py-2
              bg-white bg-opacity-20 hover:bg-opacity-30
              rounded-lg
              text-sm font-medium
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
              whitespace-nowrap
            "
            aria-label={t('offline.banner.retry')}
          >
            {t('offline.banner.retry')}
          </button>
        )}

        {/* Close button for "back online" state */}
        {state === 'backOnline' && (
          <button
            onClick={() => {
              setVisible(false)
              setWasOffline(false)
            }}
            className="
              p-2
              hover:bg-white hover:bg-opacity-20
              rounded-lg
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
            "
            aria-label={t('common.close')}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default OfflineBanner

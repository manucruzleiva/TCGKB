import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

/**
 * InstallPrompt - Prompts users to install the PWA
 *
 * Display conditions:
 * 1. Browser supports PWA installation (beforeinstallprompt event)
 * 2. App is not already installed
 * 3. User has visited at least 2 pages OR spent 30+ seconds
 * 4. User hasn't dismissed the prompt in last 7 days
 *
 * Accessibility:
 * - Focus trap when visible
 * - Dismissible with Escape key
 * - Proper ARIA labels
 */
const InstallPrompt = () => {
  const { t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  // Track user activity for smart triggering
  useEffect(() => {
    // Check if user dismissed recently (within 7 days)
    const dismissedDate = localStorage.getItem('pwa-install-dismissed')
    if (dismissedDate) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismiss < 7) {
        console.log('[InstallPrompt] Dismissed recently, not showing')
        return
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('[InstallPrompt] beforeinstallprompt event fired')

      // Prevent the mini-infobar from appearing
      e.preventDefault()

      // Store the event for later use
      setDeferredPrompt(e)

      // Check if user meets activity threshold
      checkActivityThreshold()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Check if user has met activity threshold
  const checkActivityThreshold = () => {
    // Get page visit count
    const pageVisits = parseInt(localStorage.getItem('pwa-page-visits') || '0')
    const firstVisitTime = localStorage.getItem('pwa-first-visit')

    if (!firstVisitTime) {
      // First visit, record time
      localStorage.setItem('pwa-first-visit', Date.now().toString())
      localStorage.setItem('pwa-page-visits', '1')
      return
    }

    // Increment page visits
    const newVisits = pageVisits + 1
    localStorage.setItem('pwa-page-visits', newVisits.toString())

    // Check conditions
    const timeSpent = (Date.now() - parseInt(firstVisitTime)) / 1000 // seconds
    const meetsPageVisits = newVisits >= 2
    const meetsTimeSpent = timeSpent >= 30

    if (meetsPageVisits || meetsTimeSpent) {
      console.log('[InstallPrompt] Activity threshold met, showing prompt')
      setShowPrompt(true)
    }
  }

  // Handle install button click
  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    console.log('[InstallPrompt] User choice:', outcome)

    if (outcome === 'accepted') {
      console.log('[InstallPrompt] User accepted the install prompt')
    } else {
      console.log('[InstallPrompt] User dismissed the install prompt')
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  // Handle dismiss
  const handleDismiss = () => {
    console.log('[InstallPrompt] User dismissed prompt')

    // Record dismissal date
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())

    // Hide prompt
    setShowPrompt(false)
  }

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showPrompt) {
        handleDismiss()
      }
    }

    if (showPrompt) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showPrompt])

  // Don't render if conditions not met
  if (!showPrompt || !deferredPrompt) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Prompt Card */}
      <div
        className="
          fixed bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8
          max-w-sm
          bg-white dark:bg-gray-800
          rounded-lg shadow-2xl
          p-6
          z-50
          transform transition-transform
          border border-gray-200 dark:border-gray-700
        "
        role="dialog"
        aria-labelledby="install-prompt-title"
        aria-describedby="install-prompt-description"
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="
            absolute top-2 right-2
            p-2
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            rounded-lg
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
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

        {/* Icon */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0">
            <img
              src="/icons/icon-192.png"
              alt="TCGKB"
              className="w-16 h-16 rounded-xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="install-prompt-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {t('offline.install.title')}
            </h3>
            <p
              id="install-prompt-description"
              className="text-sm text-gray-600 dark:text-gray-400 mt-1"
            >
              {t('offline.install.description')}
            </p>
          </div>
        </div>

        {/* Benefits */}
        <ul className="space-y-2 mb-6">
          <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Acceso rápido desde tu pantalla de inicio</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Funciona sin conexión</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Experiencia de aplicación nativa</span>
          </li>
        </ul>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleInstall}
            className="
              flex-1
              px-4 py-3
              bg-blue-500 hover:bg-blue-600
              text-white font-medium
              rounded-lg
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            "
          >
            {t('offline.install.installButton')}
          </button>

          <button
            onClick={handleDismiss}
            className="
              px-4 py-3
              bg-gray-100 hover:bg-gray-200
              dark:bg-gray-700 dark:hover:bg-gray-600
              text-gray-700 dark:text-gray-300
              font-medium
              rounded-lg
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
            "
          >
            {t('offline.install.dismissButton')}
          </button>
        </div>
      </div>
    </>
  )
}

export default InstallPrompt

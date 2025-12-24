import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'

/**
 * UpdatePrompt - Notifies users when a new PWA version is available
 *
 * Features:
 * - Detects Service Worker updates
 * - Shows user-friendly update banner
 * - Allows manual update trigger
 * - Auto-reloads page after update
 */
const UpdatePrompt = () => {
  const { t } = useLanguage()
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Get existing registration or wait for new one
      navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) return

        setRegistration(reg)

        // Check if there's already a waiting worker
        if (reg.waiting) {
          setUpdateAvailable(true)
        }

        // Listen for new service worker installing
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing

          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            // When new SW is installed and there's an active controller
            // (meaning this isn't the first install)
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        })
      })

      // Listen for controller change (new SW took over)
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        console.log('[UpdatePrompt] New service worker activated, reloading page')
        window.location.reload()
      })
    }
  }, [])

  const handleUpdate = () => {
    if (!registration || !registration.waiting) {
      console.warn('[UpdatePrompt] No waiting service worker found')
      return
    }

    console.log('[UpdatePrompt] Triggering service worker update')

    // Send SKIP_WAITING message to the waiting service worker
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })

    // Hide the prompt immediately
    setUpdateAvailable(false)
  }

  const handleDismiss = () => {
    setUpdateAvailable(false)

    // Store dismissal timestamp
    localStorage.setItem('pwa-update-dismissed', Date.now().toString())
  }

  // Don't show if dismissed in last 24 hours
  useEffect(() => {
    const dismissedDate = localStorage.getItem('pwa-update-dismissed')
    if (dismissedDate) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60)
      if (hoursSinceDismiss < 24) {
        setUpdateAvailable(false)
      }
    }
  }, [])

  if (!updateAvailable) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-blue-600 text-white p-4 rounded-lg shadow-xl z-50 animate-slide-up"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">
          🔄
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            {t('pwa.update.title')}
          </h3>
          <p className="text-sm text-blue-100 mb-3">
            {t('pwa.update.description')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              aria-label={t('pwa.update.updateButton')}
            >
              {t('pwa.update.updateButton')}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-blue-100 hover:text-white transition-colors"
              aria-label={t('pwa.update.dismissButton')}
            >
              {t('pwa.update.dismissButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdatePrompt

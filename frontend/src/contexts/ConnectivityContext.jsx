import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react'

const ConnectivityContext = createContext()

export const ConnectivityProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const [lastOnline, setLastOnline] = useState(new Date())
  const [pendingChanges, setPendingChanges] = useState(0)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'error' | 'success'

  // Ref to prevent multiple sync operations
  const syncInProgress = useRef(false)

  // Handle online event
  const handleOnline = useCallback(() => {
    console.log('[Connectivity] Back online')
    setIsOnline(true)
    setLastOnline(new Date())

    // Auto-sync pending changes when connection is restored
    if (pendingChanges > 0 && !syncInProgress.current) {
      syncPendingChanges()
    }
  }, [pendingChanges])

  // Handle offline event
  const handleOffline = useCallback(() => {
    console.log('[Connectivity] Offline')
    setIsOnline(false)
    setWasOffline(true)
  }, [])

  // Set up online/offline event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Manual reconnection attempt
  const reconnect = useCallback(async () => {
    console.log('[Connectivity] Manual reconnection attempt')

    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch('/manifest.json', {
        method: 'HEAD',
        cache: 'no-cache'
      })

      if (response.ok) {
        // Successfully connected
        setIsOnline(true)
        setLastOnline(new Date())

        // Trigger sync if there are pending changes
        if (pendingChanges > 0 && !syncInProgress.current) {
          syncPendingChanges()
        }
      }
    } catch (error) {
      console.log('[Connectivity] Reconnection failed:', error.message)
      setIsOnline(false)
    }
  }, [pendingChanges])

  // Sync pending changes (to be implemented in Phase 3)
  const syncPendingChanges = useCallback(async () => {
    if (syncInProgress.current) {
      console.log('[Connectivity] Sync already in progress')
      return
    }

    syncInProgress.current = true
    setSyncStatus('syncing')
    console.log('[Connectivity] Syncing pending changes:', pendingChanges)

    try {
      // TODO Phase 3: Implement actual sync logic
      // For now, just simulate a sync
      await new Promise(resolve => setTimeout(resolve, 1000))

      setPendingChanges(0)
      setSyncStatus('success')

      // Reset status after showing success
      setTimeout(() => {
        setSyncStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('[Connectivity] Sync failed:', error)
      setSyncStatus('error')

      // Reset error status after a delay
      setTimeout(() => {
        setSyncStatus('idle')
      }, 5000)
    } finally {
      syncInProgress.current = false
    }
  }, [pendingChanges])

  // Add a pending change (to be called by offline operations)
  const addPendingChange = useCallback(() => {
    setPendingChanges(prev => prev + 1)
  }, [])

  // Clear all pending changes (for error recovery)
  const clearPendingChanges = useCallback(() => {
    setPendingChanges(0)
    setSyncStatus('idle')
  }, [])

  const value = {
    isOnline,
    wasOffline,
    lastOnline,
    reconnect,
    pendingChanges,
    syncStatus,
    addPendingChange,
    clearPendingChanges,
    syncPendingChanges
  }

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
    </ConnectivityContext.Provider>
  )
}

/**
 * Hook to access connectivity context
 * @returns {Object} Connectivity context value
 */
export const useConnectivity = () => {
  const context = useContext(ConnectivityContext)
  if (!context) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider')
  }
  return context
}

export default ConnectivityContext

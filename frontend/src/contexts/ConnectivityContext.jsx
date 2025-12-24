import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react'
import offlineDb from '../services/offlineDb'

const ConnectivityContext = createContext()

export const ConnectivityProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const [lastOnline, setLastOnline] = useState(new Date())
  const [pendingChanges, setPendingChanges] = useState(0)
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'error' | 'success'

  // Ref to prevent multiple sync operations
  const syncInProgress = useRef(false)

  // Initialize IndexedDB and load pending count
  useEffect(() => {
    const initializeDb = async () => {
      try {
        await offlineDb.init()
        console.log('[Connectivity] IndexedDB initialized')

        // Load pending actions count
        const pendingActions = await offlineDb.getPendingActions()
        setPendingChanges(pendingActions.length)
      } catch (error) {
        console.error('[Connectivity] Failed to initialize IndexedDB:', error)
      }
    }

    initializeDb()
  }, [])

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

  // Sync pending changes
  const syncPendingChanges = useCallback(async () => {
    if (syncInProgress.current) {
      console.log('[Connectivity] Sync already in progress')
      return
    }

    syncInProgress.current = true
    setSyncStatus('syncing')
    console.log('[Connectivity] Syncing pending changes:', pendingChanges)

    try {
      // Get all pending actions from IndexedDB
      const pendingActions = await offlineDb.getPendingActions()

      if (pendingActions.length === 0) {
        console.log('[Connectivity] No pending actions to sync')
        setPendingChanges(0)
        setSyncStatus('idle')
        syncInProgress.current = false
        return
      }

      console.log(`[Connectivity] Syncing ${pendingActions.length} pending actions`)

      // TODO Phase 3: Implement actual API sync
      // For now, just simulate a sync
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Clear pending actions after successful sync
      await offlineDb.clearPendingActions()
      setPendingChanges(0)
      setSyncStatus('success')

      console.log('[Connectivity] Sync completed successfully')

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
  const addPendingChange = useCallback(async (action) => {
    try {
      // Store action in IndexedDB
      await offlineDb.addPendingAction(action)

      // Update count
      const pendingActions = await offlineDb.getPendingActions()
      setPendingChanges(pendingActions.length)

      console.log('[Connectivity] Pending action added:', action.type)
    } catch (error) {
      console.error('[Connectivity] Failed to add pending action:', error)
    }
  }, [])

  // Clear all pending changes (for error recovery)
  const clearPendingChanges = useCallback(async () => {
    try {
      await offlineDb.clearPendingActions()
      setPendingChanges(0)
      setSyncStatus('idle')
      console.log('[Connectivity] All pending changes cleared')
    } catch (error) {
      console.error('[Connectivity] Failed to clear pending changes:', error)
    }
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

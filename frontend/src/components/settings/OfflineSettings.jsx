import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useConnectivity } from '../../contexts/ConnectivityContext'
import offlineDb from '../../services/offlineDb'

/**
 * OfflineSettings - PWA offline cache management
 *
 * Features:
 * - Display cache size and quota
 * - Show cached items count per store
 * - Clear cache buttons
 * - Manual cleanup options
 */
const OfflineSettings = () => {
  const { t } = useLanguage()
  const { pendingChanges, clearPendingChanges } = useConnectivity()

  const [cacheSize, setCacheSize] = useState(null)
  const [cacheCounts, setCacheCounts] = useState({
    cards: 0,
    decks: 0,
    comments: 0
  })
  const [loading, setLoading] = useState(true)

  // Load cache information
  useEffect(() => {
    loadCacheInfo()
  }, [])

  const loadCacheInfo = async () => {
    setLoading(true)

    try {
      // Get cache size estimate
      const size = await offlineDb.getCacheSize()
      setCacheSize(size)

      // Get item counts
      const [cards, decks, comments] = await Promise.all([
        offlineDb.getAll('cards'),
        offlineDb.getAll('decks'),
        offlineDb.getAll('comments')
      ])

      setCacheCounts({
        cards: cards.length,
        decks: decks.length,
        comments: comments.length
      })
    } catch (error) {
      console.error('[OfflineSettings] Failed to load cache info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCards = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar todas las cartas cacheadas?')) {
      return
    }

    try {
      await offlineDb.clear('cards')
      await loadCacheInfo()
    } catch (error) {
      console.error('[OfflineSettings] Failed to clear cards:', error)
    }
  }

  const handleClearDecks = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar todos los mazos cacheados?')) {
      return
    }

    try {
      await offlineDb.clear('decks')
      await loadCacheInfo()
    } catch (error) {
      console.error('[OfflineSettings] Failed to clear decks:', error)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar TODOS los datos offline? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await offlineDb.clearAllData()
      await clearPendingChanges()
      await loadCacheInfo()
    } catch (error) {
      console.error('[OfflineSettings] Failed to clear all data:', error)
    }
  }

  const handleCleanupOld = async () => {
    try {
      const deleted = await offlineDb.cleanupOldCards(500)
      alert(`Se eliminaron ${deleted} cartas antiguas`)
      await loadCacheInfo()
    } catch (error) {
      console.error('[OfflineSettings] Failed to cleanup old cards:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400">Cargando información de caché...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Almacenamiento Offline
        </h3>

        {/* Cache Size */}
        {cacheSize && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Espacio usado
              </span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {cacheSize.usage} MB / {cacheSize.quota} MB
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${cacheSize.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {cacheSize.percentage}% del espacio total
            </p>
          </div>
        )}

        {/* Cache Stats */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Cartas cacheadas</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cartas guardadas para acceso offline
              </p>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {cacheCounts.cards}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Mazos cacheados</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tus mazos guardados localmente
              </p>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {cacheCounts.decks}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Comentarios cacheados</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comentarios disponibles offline
              </p>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {cacheCounts.comments}
            </span>
          </div>

          {pendingChanges > 0 && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-400">
                  Cambios pendientes
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                  Esperando sincronización
                </p>
              </div>
              <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-400">
                {pendingChanges}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Acciones de limpieza
          </h4>

          <button
            onClick={handleCleanupOld}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Limpiar cartas antiguas (mantener 500 más recientes)
          </button>

          <button
            onClick={handleClearCards}
            className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Eliminar todas las cartas
          </button>

          <button
            onClick={handleClearDecks}
            className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Eliminar todos los mazos
          </button>

          <button
            onClick={handleClearAll}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Eliminar TODOS los datos offline
          </button>

          {pendingChanges > 0 && (
            <button
              onClick={clearPendingChanges}
              className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Limpiar acciones pendientes ({pendingChanges})
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">
          ℹ️ Información
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Las cartas se cachean automáticamente cuando las visitas</li>
          <li>• Los mazos se guardan localmente para edición offline</li>
          <li>• Limpiar caché libera espacio pero requiere reconexión para ver contenido</li>
          <li>• Los cambios pendientes se sincronizarán cuando vuelvas online</li>
        </ul>
      </div>
    </div>
  )
}

export default OfflineSettings

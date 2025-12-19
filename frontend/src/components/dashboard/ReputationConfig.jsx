import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../services/api'
import Button from '../common/Button'

// Action type labels and categories
const ACTION_TYPES = {
  positive: [
    { key: 'comment_created', icon: '💬', labelEn: 'Comment Created', labelEs: 'Comentario Creado' },
    { key: 'comment_received_reaction', icon: '👍', labelEn: 'Comment Received Reaction', labelEs: 'Reacción en Comentario' },
    { key: 'mention_used', icon: '@', labelEn: 'Mention Used', labelEs: 'Mención Usada' },
    { key: 'reaction_given', icon: '😀', labelEn: 'Reaction Given', labelEs: 'Reacción Dada' },
    { key: 'bug_reported', icon: '🐛', labelEn: 'Bug Reported', labelEs: 'Bug Reportado' },
    { key: 'bug_processed', icon: '✅', labelEn: 'Bug Processed', labelEs: 'Bug Procesado' },
    { key: 'deck_created', icon: '🎴', labelEn: 'Deck Created', labelEs: 'Deck Creado' },
    { key: 'deck_received_reaction', icon: '⭐', labelEn: 'Deck Received Reaction', labelEs: 'Reacción en Deck' }
  ],
  negative: [
    { key: 'bug_dismissed', icon: '❌', labelEn: 'Bug Dismissed', labelEs: 'Bug Desestimado' },
    { key: 'comment_moderated', icon: '🚫', labelEn: 'Comment Moderated', labelEs: 'Comentario Moderado' }
  ],
  reversal: [
    { key: 'comment_restored', icon: '↩️', labelEn: 'Comment Restored', labelEs: 'Comentario Restaurado' }
  ]
}

const ReputationConfig = () => {
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [config, setConfig] = useState(null)
  const [editedConfig, setEditedConfig] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchConfig()
    fetchHistory()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/reputation/config')
      if (response.data.success) {
        setConfig(response.data.data)
        setEditedConfig(JSON.parse(JSON.stringify(response.data.data)))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await api.get('/reputation/config/history?limit=10')
      if (response.data.success) {
        setHistory(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const handleRecalculate = async () => {
    if (!window.confirm(
      language === 'es'
        ? '¿Recalcular la reputación de todos los usuarios? Esto puede tomar unos segundos.'
        : 'Recalculate reputation for all users? This may take a few seconds.'
    )) return

    try {
      setRecalculating(true)
      setError(null)
      const response = await api.post('/reputation/recalculate')
      if (response.data.success) {
        setSuccess(
          language === 'es'
            ? `Recalculado para ${response.data.data.updated} usuarios en ${response.data.data.executionTimeMs}ms`
            : `Recalculated for ${response.data.data.updated} users in ${response.data.data.executionTimeMs}ms`
        )
        setTimeout(() => setSuccess(null), 5000)
        fetchHistory() // Refresh history
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to recalculate')
    } finally {
      setRecalculating(false)
    }
  }

  const handleWeightChange = (actionType, value) => {
    const newConfig = { ...editedConfig }
    newConfig.weights = { ...newConfig.weights, [actionType]: parseInt(value) || 0 }
    setEditedConfig(newConfig)
    setHasChanges(true)
  }

  const handleDecayChange = (actionType, value) => {
    const newConfig = { ...editedConfig }
    newConfig.decay = { ...newConfig.decay, [actionType]: parseInt(value) || 0 }
    setEditedConfig(newConfig)
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await api.put('/reputation/config', {
        weights: editedConfig.weights,
        decay: editedConfig.decay
      })

      if (response.data.success) {
        setConfig(response.data.data)
        setEditedConfig(JSON.parse(JSON.stringify(response.data.data)))
        setHasChanges(false)
        setSuccess(language === 'es' ? 'Configuración guardada' : 'Configuration saved')
        setTimeout(() => setSuccess(null), 3000)
        fetchHistory() // Refresh history
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save config')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setEditedConfig(JSON.parse(JSON.stringify(config)))
    setHasChanges(false)
  }

  const renderActionRow = (action, isNegative = false) => {
    const weight = editedConfig?.weights?.[action.key] ?? 0
    const decay = editedConfig?.decay?.[action.key] ?? 0
    const originalWeight = config?.weights?.[action.key] ?? 0
    const originalDecay = config?.decay?.[action.key] ?? 0
    const weightChanged = weight !== originalWeight
    const decayChanged = decay !== originalDecay

    return (
      <tr key={action.key} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{action.icon}</span>
            <span className="text-gray-900 dark:text-gray-100">
              {language === 'es' ? action.labelEs : action.labelEn}
            </span>
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={weight}
              onChange={(e) => handleWeightChange(action.key, e.target.value)}
              className={`w-20 px-2 py-1 border rounded text-center ${
                weightChanged
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              } text-gray-900 dark:text-gray-100`}
            />
            <span className={`text-sm ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
              {isNegative ? '' : '+'}{weight} pts
            </span>
            {weightChanged && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                ({language === 'es' ? 'era' : 'was'} {originalWeight})
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={decay}
              onChange={(e) => handleDecayChange(action.key, e.target.value)}
              className={`w-20 px-2 py-1 border rounded text-center ${
                decayChanged
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
              } text-gray-900 dark:text-gray-100`}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {decay === 0
                ? (language === 'es' ? 'Nunca expira' : 'Never expires')
                : `${decay} ${language === 'es' ? 'días' : 'days'}`}
            </span>
            {decayChanged && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                ({language === 'es' ? 'era' : 'was'} {originalDecay})
              </span>
            )}
          </div>
        </td>
      </tr>
    )
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>⚡</span>
            {language === 'es' ? 'Configuración de Reputación' : 'Reputation Configuration'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {language === 'es'
              ? 'Configura los puntos por cada acción y su tiempo de expiración'
              : 'Configure points per action and their expiration time'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRecalculate}
            disabled={recalculating || hasChanges}
            variant="secondary"
            className="text-sm"
            title={hasChanges ? (language === 'es' ? 'Guarda los cambios primero' : 'Save changes first') : ''}
          >
            {recalculating
              ? (language === 'es' ? 'Recalculando...' : 'Recalculating...')
              : (language === 'es' ? 'Recalcular Todo' : 'Recalculate All')}
          </Button>
          {hasChanges && (
            <Button onClick={handleReset} variant="secondary" className="text-sm">
              {language === 'es' ? 'Descartar' : 'Discard'}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            variant="primary"
            className="text-sm"
          >
            {saving
              ? (language === 'es' ? 'Guardando...' : 'Saving...')
              : (language === 'es' ? 'Guardar Cambios' : 'Save Changes')}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 text-sm">
          {success}
        </div>
      )}

      {/* Changes Warning */}
      {hasChanges && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm flex items-center gap-2">
          <span>⚠️</span>
          {language === 'es'
            ? 'Tienes cambios sin guardar. Los puntos de usuarios existentes NO se recalcularán automáticamente.'
            : 'You have unsaved changes. Existing user points will NOT be recalculated automatically.'}
        </div>
      )}

      {/* Positive Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
          <span>✨</span>
          {language === 'es' ? 'Acciones Positivas' : 'Positive Actions'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {language === 'es' ? 'Acción' : 'Action'}
                </th>
                <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {language === 'es' ? 'Puntos' : 'Points'}
                </th>
                <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {language === 'es' ? 'Expiración' : 'Expiration'}
                </th>
              </tr>
            </thead>
            <tbody>
              {ACTION_TYPES.positive.map(action => renderActionRow(action))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Negative Actions (Penalties) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
          <span>⚠️</span>
          {language === 'es' ? 'Penalizaciones' : 'Penalties'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {language === 'es' ? 'Acción' : 'Action'}
                </th>
                <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {language === 'es' ? 'Puntos' : 'Points'}
                </th>
                <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {language === 'es' ? 'Expiración' : 'Expiration'}
                </th>
              </tr>
            </thead>
            <tbody>
              {ACTION_TYPES.negative.map(action => renderActionRow(action, true))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reversal Actions */}
      <div>
        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
          <span>↩️</span>
          {language === 'es' ? 'Reversiones' : 'Reversals'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {language === 'es' ? 'Acción' : 'Action'}
                </th>
                <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {language === 'es' ? 'Puntos' : 'Points'}
                </th>
                <th className="text-left py-2 px-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                  {language === 'es' ? 'Expiración' : 'Expiration'}
                </th>
              </tr>
            </thead>
            <tbody>
              {ACTION_TYPES.reversal.map(action => renderActionRow(action))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier Thresholds Info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {language === 'es' ? 'Niveles de Reputación' : 'Reputation Tiers'}
        </h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-gray-600 dark:text-gray-400">Newcomer: 0+</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
            <span className="text-gray-600 dark:text-gray-400">Contributor: 50+</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400"></span>
            <span className="text-gray-600 dark:text-gray-400">Trusted: 200+</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-400"></span>
            <span className="text-gray-600 dark:text-gray-400">Expert: 500+</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-gray-600 dark:text-gray-400">Legend: 1000+</span>
          </div>
        </div>
      </div>

      {/* Config Change History */}
      <div className="mt-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <span>{showHistory ? '▼' : '▶'}</span>
          <h4 className="font-semibold">
            {language === 'es' ? 'Historial de Cambios' : 'Change History'}
            {history.length > 0 && ` (${history.length})`}
          </h4>
        </button>

        {showHistory && history.length > 0 && (
          <div className="mt-3 space-y-2">
            {history.map((entry, index) => (
              <div
                key={entry._id || index}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      entry.changeType === 'full_recalculation'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : entry.changeType === 'weights_updated'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    }`}>
                      {entry.changeType === 'full_recalculation'
                        ? (language === 'es' ? 'Recálculo' : 'Recalculation')
                        : entry.changeType === 'weights_updated'
                        ? (language === 'es' ? 'Pesos' : 'Weights')
                        : (language === 'es' ? 'Decay' : 'Decay')}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {language === 'es' ? 'por' : 'by'} {entry.changedBy?.username || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{entry.summary}</p>
                {entry.recalculationStats?.usersAffected > 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    {entry.recalculationStats.usersAffected} {language === 'es' ? 'usuarios' : 'users'} |{' '}
                    {entry.recalculationStats.executionTimeMs}ms
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {showHistory && history.length === 0 && (
          <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm italic">
            {language === 'es' ? 'No hay historial de cambios' : 'No change history'}
          </p>
        )}
      </div>
    </div>
  )
}

export default ReputationConfig

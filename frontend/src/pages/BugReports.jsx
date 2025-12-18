import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

const STATUS_COLORS = {
  new: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', chart: '#3b82f6' },
  reviewing: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', chart: '#eab308' },
  in_progress: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200', chart: '#8b5cf6' },
  resolved: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', chart: '#22c55e' },
  wont_fix: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', chart: '#6b7280' },
  not_enough_data: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200', chart: '#f97316' }
}

const STATUS_LABELS = {
  new: { es: 'Nuevo', en: 'New' },
  reviewing: { es: 'Revisando', en: 'Reviewing' },
  in_progress: { es: 'En Progreso', en: 'In Progress' },
  resolved: { es: 'Resuelto', en: 'Resolved' },
  wont_fix: { es: 'No se arreglará', en: "Won't Fix" },
  not_enough_data: { es: 'Faltan datos', en: 'Not Enough Data' }
}

const DevDashboard = () => {
  const { user, isAuthenticated, canAccessBugDashboard, isAdmin } = useAuth()
  const { language } = useLanguage()
  const { timeAgo } = useDateFormat()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [bugReports, setBugReports] = useState([])
  const [bugCounts, setBugCounts] = useState({})
  const [timeSeries, setTimeSeries] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [selectedBug, setSelectedBug] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [assignees, setAssignees] = useState([])
  const [assigningBug, setAssigningBug] = useState(null)

  // Health check state
  const [healthStatus, setHealthStatus] = useState({
    api: { status: 'checking', message: '' },
    database: { status: 'checking', message: '' }
  })
  const [endpointsHealth, setEndpointsHealth] = useState(null)
  const [checkingEndpoints, setCheckingEndpoints] = useState(false)

  // Cache management state
  const [cacheStats, setCacheStats] = useState(null)
  const [syncingRiftbound, setSyncingRiftbound] = useState(false)
  const [syncingPokemon, setSyncingPokemon] = useState(false)
  const [verifyingCache, setVerifyingCache] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [verifyResult, setVerifyResult] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // Allow both admin and dev users
    if (user && !canAccessBugDashboard) {
      navigate('/')
      return
    }
  }, [isAuthenticated, user, canAccessBugDashboard, navigate])

  useEffect(() => {
    if (isAuthenticated && canAccessBugDashboard) {
      fetchBugReports()
    }
  }, [statusFilter, assigneeFilter, sortOrder, isAuthenticated, canAccessBugDashboard])

  // Real-time polling - refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !canAccessBugDashboard) return

    const pollInterval = setInterval(() => {
      // Silent fetch without setting loading state
      const silentFetch = async () => {
        try {
          const response = await api.get(`/bugs?status=${statusFilter}`)
          if (response.data.success) {
            setBugReports(response.data.data.bugReports)
            setBugCounts(response.data.data.counts || {})
            setTimeSeries(response.data.data.timeSeries || [])
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }
      silentFetch()
    }, 30000) // 30 seconds

    return () => clearInterval(pollInterval)
  }, [statusFilter, isAuthenticated, canAccessBugDashboard])

  // Health check on mount
  useEffect(() => {
    if (isAuthenticated && canAccessBugDashboard) {
      checkHealth()
      fetchCacheStats()
    }
  }, [isAuthenticated, canAccessBugDashboard])

  const checkHealth = async () => {
    try {
      const response = await api.get('/health')
      setHealthStatus(prev => ({
        ...prev,
        api: {
          status: response.data.status === 'ok' ? 'healthy' : 'degraded',
          message: response.data.status === 'ok' ? 'API operational' : 'API issues detected'
        },
        database: {
          status: response.data.database?.connected ? 'healthy' : 'error',
          message: response.data.database?.connected ? 'Database connected' : 'Database not connected'
        }
      }))
    } catch (error) {
      setHealthStatus(prev => ({
        ...prev,
        api: { status: 'error', message: error.message || 'API unreachable' },
        database: { status: 'unknown', message: 'Could not verify' }
      }))
    }
  }

  const checkEndpointsHealth = async () => {
    setCheckingEndpoints(true)
    try {
      const response = await api.get('/health/endpoints')
      setEndpointsHealth(response.data)
    } catch (error) {
      console.error('Error checking endpoints health:', error)
      setEndpointsHealth({ status: 'error', message: error.message })
    } finally {
      setCheckingEndpoints(false)
    }
  }

  const fetchCacheStats = async () => {
    try {
      const response = await api.get('/mod/cache/stats')
      if (response.data.success) {
        setCacheStats(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error)
    }
  }

  const syncRiftboundCards = async () => {
    try {
      setSyncingRiftbound(true)
      setSyncResult(null)
      const response = await api.post('/mod/cache/sync/riftbound')
      if (response.data.success) {
        setSyncResult({
          success: true,
          type: 'riftbound',
          message: response.data.message,
          data: response.data.data
        })
        // Refresh cache stats
        fetchCacheStats()
      }
    } catch (error) {
      setSyncResult({
        success: false,
        type: 'riftbound',
        message: error.response?.data?.message || error.message
      })
    } finally {
      setSyncingRiftbound(false)
    }
  }

  const syncPokemonCards = async () => {
    try {
      setSyncingPokemon(true)
      setSyncResult(null)
      const response = await api.post('/mod/cache/sync/pokemon')
      if (response.data.success) {
        setSyncResult({
          success: true,
          type: 'pokemon',
          message: response.data.message,
          data: response.data.data
        })
        // Refresh cache stats
        fetchCacheStats()
      }
    } catch (error) {
      setSyncResult({
        success: false,
        type: 'pokemon',
        message: error.response?.data?.message || error.message
      })
    } finally {
      setSyncingPokemon(false)
    }
  }

  const verifyCacheIntegrity = async () => {
    try {
      setVerifyingCache(true)
      setVerifyResult(null)
      const response = await api.get('/mod/cache/verify')
      if (response.data.success) {
        setVerifyResult(response.data.data)
      }
    } catch (error) {
      setVerifyResult({
        error: true,
        message: error.response?.data?.message || error.message
      })
    } finally {
      setVerifyingCache(false)
    }
  }

  // Fetch assignees for admin users
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchAssignees()
    }
  }, [isAuthenticated, isAdmin])

  const fetchAssignees = async () => {
    try {
      const response = await api.get('/bugs/assignees')
      if (response.data.success) {
        setAssignees(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching assignees:', error)
    }
  }

  const fetchBugReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ status: statusFilter, sort: sortOrder })
      if (assigneeFilter) params.append('assignedTo', assigneeFilter)
      const response = await api.get(`/bugs?${params.toString()}`)
      if (response.data.success) {
        setBugReports(response.data.data.bugReports)
        setBugCounts(response.data.data.counts || {})
        setTimeSeries(response.data.data.timeSeries || [])
      }
    } catch (error) {
      console.error('Error fetching bug reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (bugId, newStatus) => {
    try {
      setUpdating(bugId)
      const response = await api.put(`/bugs/${bugId}`, { status: newStatus })
      if (response.data.success) {
        setBugReports(prev =>
          prev.map(b => b._id === bugId ? { ...b, status: newStatus } : b)
        )
        // Update counts
        fetchBugReports()
      }
    } catch (error) {
      console.error('Error updating bug status:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleAssignmentChange = async (bugId, assigneeId) => {
    try {
      setAssigningBug(bugId)
      const response = await api.put(`/bugs/${bugId}`, {
        assignedTo: assigneeId || null
      })
      if (response.data.success) {
        setBugReports(prev =>
          prev.map(b => b._id === bugId ? {
            ...b,
            assignedTo: response.data.data.assignedTo
          } : b)
        )
      }
    } catch (error) {
      console.error('Error assigning bug:', error)
    } finally {
      setAssigningBug(null)
    }
  }

  // Prepare chart data
  const chartData = Object.entries(bugCounts)
    .filter(([status]) => status !== 'total' && status !== 'open' && status !== 'closed')
    .map(([status, count]) => ({
      name: STATUS_LABELS[status]?.[language] || status,
      value: count,
      color: STATUS_COLORS[status]?.chart || '#6b7280'
    }))
    .filter(d => d.value > 0)

  if (loading && bugReports.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            to="/mod"
            className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-2 mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {language === 'es' ? 'Volver al Dashboard' : 'Back to Dashboard'}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            🛠️ {language === 'es' ? 'Dev Dashboard' : 'Dev Dashboard'}
          </h1>
        </div>
      </div>

      {/* System Health Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {language === 'es' ? 'Estado del Sistema' : 'System Health'}
          </h2>
          <button
            onClick={checkHealth}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            🔄 {language === 'es' ? 'Actualizar' : 'Refresh'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Status */}
          <div className={`p-4 rounded-lg ${
            healthStatus.api.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' :
            healthStatus.api.status === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
            'bg-yellow-100 dark:bg-yellow-900/30'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                healthStatus.api.status === 'healthy' ? 'bg-green-500' :
                healthStatus.api.status === 'error' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              }`}></span>
              <span className="font-medium text-gray-900 dark:text-gray-100">API</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {healthStatus.api.message || (language === 'es' ? 'Verificando...' : 'Checking...')}
            </p>
          </div>
          {/* Database Status */}
          <div className={`p-4 rounded-lg ${
            healthStatus.database.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' :
            healthStatus.database.status === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
            'bg-yellow-100 dark:bg-yellow-900/30'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                healthStatus.database.status === 'healthy' ? 'bg-green-500' :
                healthStatus.database.status === 'error' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              }`}></span>
              <span className="font-medium text-gray-900 dark:text-gray-100">Database</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {healthStatus.database.message || (language === 'es' ? 'Verificando...' : 'Checking...')}
            </p>
          </div>
        </div>

        {/* Endpoints Health Check */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'es' ? 'Estado de Endpoints' : 'Endpoints Status'}
            </h3>
            <button
              onClick={checkEndpointsHealth}
              disabled={checkingEndpoints}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {checkingEndpoints ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {language === 'es' ? 'Verificando...' : 'Checking...'}
                </>
              ) : (
                <>
                  🔍 {language === 'es' ? 'Verificar Endpoints' : 'Check Endpoints'}
                </>
              )}
            </button>
          </div>

          {endpointsHealth ? (
            <div className="space-y-2">
              {/* Overall Status */}
              <div className={`p-3 rounded-lg text-sm ${
                endpointsHealth.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                endpointsHealth.status === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}>
                {endpointsHealth.healthy}/{endpointsHealth.total} endpoints {language === 'es' ? 'saludables' : 'healthy'}
              </div>

              {/* Individual Endpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {endpointsHealth.endpoints?.map((endpoint, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded text-xs flex items-center justify-between ${
                      endpoint.status === 'healthy'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <span className="font-medium truncate">{endpoint.name}</span>
                    <span className="flex items-center gap-1">
                      {endpoint.status === 'healthy' ? '✓' : '✗'}
                      <span className="text-gray-500 dark:text-gray-400">{endpoint.latency}ms</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              {language === 'es'
                ? 'Haz clic en "Verificar Endpoints" para comprobar el estado'
                : 'Click "Check Endpoints" to verify status'}
            </p>
          )}
        </div>
      </div>

      {/* Cache Management Section - Admin Only */}
      {isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              🗄️ {language === 'es' ? 'Cache de Cartas' : 'Card Cache'}
            </h2>
            <button
              onClick={fetchCacheStats}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              🔄 {language === 'es' ? 'Actualizar' : 'Refresh'}
            </button>
          </div>

          {/* Cache Stats Grid */}
          {cacheStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Pokemon Cache */}
              <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚡</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Pokémon TCG</span>
                </div>
                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                  {cacheStats.pokemon?.count?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {language === 'es' ? 'cartas en cache' : 'cached cards'}
                </p>
                {cacheStats.pokemon?.lastSync && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {language === 'es' ? 'Último sync:' : 'Last sync:'} {new Date(cacheStats.pokemon.lastSync).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Riftbound Cache */}
              <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎮</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Riftbound</span>
                </div>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {cacheStats.riftbound?.count?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {language === 'es' ? 'cartas en cache' : 'cached cards'}
                </p>
                {cacheStats.riftbound?.lastSync && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {language === 'es' ? 'Último sync:' : 'Last sync:'} {new Date(cacheStats.riftbound.lastSync).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Total Cache */}
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📊</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {cacheStats.total?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {language === 'es' ? 'cartas totales' : 'total cards'}
                </p>
              </div>
            </div>
          )}

          {/* Sync Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {language === 'es' ? 'Sincronización Manual' : 'Manual Sync'}
            </h3>
            <div className="flex flex-wrap gap-3">
              {/* Pokemon Sync Button */}
              <button
                onClick={syncPokemonCards}
                disabled={syncingPokemon || syncingRiftbound}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                  ${syncingPokemon || syncingRiftbound
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
              >
                {syncingPokemon ? (
                  <>
                    <Spinner size="sm" />
                    {language === 'es' ? 'Sincronizando...' : 'Syncing...'}
                  </>
                ) : (
                  <>
                    ⚡ {language === 'es' ? 'Sync Pokémon' : 'Sync Pokémon'}
                  </>
                )}
              </button>

              {/* Riftbound Sync Button */}
              <button
                onClick={syncRiftboundCards}
                disabled={syncingRiftbound || syncingPokemon}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                  ${syncingRiftbound || syncingPokemon
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
              >
                {syncingRiftbound ? (
                  <>
                    <Spinner size="sm" />
                    {language === 'es' ? 'Sincronizando...' : 'Syncing...'}
                  </>
                ) : (
                  <>
                    🎮 {language === 'es' ? 'Sync Riftbound' : 'Sync Riftbound'}
                  </>
                )}
              </button>

              {/* Verify Cache Button */}
              <button
                onClick={verifyCacheIntegrity}
                disabled={verifyingCache || syncingPokemon || syncingRiftbound}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                  ${verifyingCache || syncingPokemon || syncingRiftbound
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {verifyingCache ? (
                  <>
                    <Spinner size="sm" />
                    {language === 'es' ? 'Verificando...' : 'Verifying...'}
                  </>
                ) : (
                  <>
                    🔍 {language === 'es' ? 'Verificar Cache' : 'Verify Cache'}
                  </>
                )}
              </button>
            </div>

            {/* Sync Result */}
            {syncResult && (
              <div className={`mt-3 p-3 rounded-lg ${
                syncResult.success
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}>
                <p className="text-sm font-medium">
                  {syncResult.success ? '✅' : '❌'} {syncResult.message}
                </p>
                {syncResult.data && syncResult.type === 'riftbound' && (
                  <p className="text-xs mt-1">
                    {language === 'es'
                      ? `Sincronizadas: ${syncResult.data.synced} | Errores: ${syncResult.data.errors} | Total Riftbound: ${syncResult.data.totalRiftbound}`
                      : `Synced: ${syncResult.data.synced} | Errors: ${syncResult.data.errors} | Total Riftbound: ${syncResult.data.totalRiftbound}`
                    }
                  </p>
                )}
                {syncResult.data && syncResult.type === 'pokemon' && (
                  <p className="text-xs mt-1">
                    {language === 'es'
                      ? `Sincronizadas: ${syncResult.data.synced} | Sets: ${syncResult.data.setsProcessed} | Errores: ${syncResult.data.errors} | Total Pokemon: ${syncResult.data.totalPokemon}`
                      : `Synced: ${syncResult.data.synced} | Sets: ${syncResult.data.setsProcessed} | Errors: ${syncResult.data.errors} | Total Pokemon: ${syncResult.data.totalPokemon}`
                    }
                  </p>
                )}
              </div>
            )}

            {/* Verify Result */}
            {verifyResult && !verifyResult.error && (
              <div className="mt-3 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                <p className="text-sm font-medium mb-2">
                  🔍 {language === 'es' ? 'Resultado de Verificación' : 'Verification Result'}
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium">Pokémon TCG</p>
                    <p>{language === 'es' ? 'En cache' : 'Cached'}: {verifyResult.pokemon?.cached || 0}</p>
                    <p>{language === 'es' ? 'En fuente' : 'Source'}: {verifyResult.pokemon?.source || 0}</p>
                    <p className={verifyResult.pokemon?.missing > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                      {language === 'es' ? 'Faltantes' : 'Missing'}: {verifyResult.pokemon?.missing || 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Riftbound</p>
                    <p>{language === 'es' ? 'En cache' : 'Cached'}: {verifyResult.riftbound?.cached || 0}</p>
                    <p>{language === 'es' ? 'En fuente' : 'Source'}: {verifyResult.riftbound?.source || 0}</p>
                    <p className={verifyResult.riftbound?.missing > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                      {language === 'es' ? 'Faltantes' : 'Missing'}: {verifyResult.riftbound?.missing || 0}
                    </p>
                  </div>
                </div>
                {verifyResult.lastCheck && (
                  <p className="text-xs mt-2 opacity-70">
                    {language === 'es' ? 'Última verificación:' : 'Last check:'} {new Date(verifyResult.lastCheck).toLocaleString()}
                  </p>
                )}
              </div>
            )}
            {verifyResult?.error && (
              <div className="mt-3 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                <p className="text-sm font-medium">❌ {verifyResult.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bug Reports Section */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        🐛 {language === 'es' ? 'Bug Reports' : 'Bug Reports'}
      </h2>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {bugCounts.total || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'es' ? 'Total' : 'Total'}
          </div>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/50 rounded-lg shadow-md p-5">
          <div className="text-3xl font-bold text-orange-800 dark:text-orange-200">
            {bugCounts.open || 0}
          </div>
          <div className="text-sm text-orange-700 dark:text-orange-300">
            {language === 'es' ? 'Abiertos' : 'Open'}
          </div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/50 rounded-lg shadow-md p-5">
          <div className="text-3xl font-bold text-green-800 dark:text-green-200">
            {bugCounts.closed || 0}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            {language === 'es' ? 'Cerrados' : 'Closed'}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {bugCounts.total ? Math.round((bugCounts.closed / bugCounts.total) * 100) : 0}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'es' ? 'Resueltos' : 'Resolved'}
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      {timeSeries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            {language === 'es' ? 'Bugs en los últimos 30 días' : 'Bugs over last 30 days'}
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getDate()}/${date.getMonth() + 1}`
                }}
              />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
                labelFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                name={language === 'es' ? 'Creados' : 'Created'}
              />
              <Line
                type="monotone"
                dataKey="resolved"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2 }}
                name={language === 'es' ? 'Resueltos' : 'Resolved'}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart and Filter Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            {language === 'es' ? 'Por Estado' : 'By Status'}
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500">
              {language === 'es' ? 'Sin datos' : 'No data'}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-600 dark:text-gray-400">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
            {language === 'es' ? 'Filtrar por Estado' : 'Filter by Status'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {language === 'es' ? 'Todos' : 'All'} ({bugCounts.total || 0})
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'open'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900'
              }`}
            >
              {language === 'es' ? 'Abiertos' : 'Open'} ({bugCounts.open || 0})
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'closed'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
              }`}
            >
              {language === 'es' ? 'Cerrados' : 'Closed'} ({bugCounts.closed || 0})
            </button>
            {Object.entries(STATUS_LABELS).map(([status, labels]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? `${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].text} ring-2 ring-offset-2 ring-primary-500`
                    : `${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].text} hover:opacity-80`
                }`}
              >
                {labels[language]} ({bugCounts[status] || 0})
              </button>
            ))}
          </div>

          {/* Additional Filters Row */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Assignee Filter */}
            {isAdmin && assignees.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'es' ? 'Asignado a:' : 'Assigned to:'}
                </label>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{language === 'es' ? 'Todos' : 'All'}</option>
                  <option value="unassigned">{language === 'es' ? 'Sin asignar' : 'Unassigned'}</option>
                  {assignees.map((assignee) => (
                    <option key={assignee._id} value={assignee._id}>
                      {assignee.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'es' ? 'Ordenar:' : 'Sort:'}
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="newest">{language === 'es' ? 'Más recientes' : 'Newest'}</option>
                <option value="oldest">{language === 'es' ? 'Más antiguos' : 'Oldest'}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bug Reports List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {language === 'es' ? 'Reportes' : 'Reports'} ({bugReports.length})
          </h2>
        </div>

        {bugReports.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {language === 'es' ? 'No hay reportes de bugs' : 'No bug reports'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {bugReports.map((bug) => (
              <div
                key={bug._id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedBug === bug._id ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header Row with Title, Status, and Assignment */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {bug.title}
                      </h3>
                      {/* Quick Status Selector */}
                      {isAdmin ? (
                        <select
                          value={bug.status}
                          onChange={(e) => handleStatusChange(bug._id, e.target.value)}
                          disabled={updating === bug._id}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[bug.status].bg} ${STATUS_COLORS[bug.status].text}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([status, labels]) => (
                            <option key={status} value={status}>
                              {labels[language]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[bug.status].bg} ${STATUS_COLORS[bug.status].text}`}>
                          {STATUS_LABELS[bug.status][language]}
                        </span>
                      )}
                      {/* Quick Assignment Selector */}
                      {isAdmin && assignees.length > 0 ? (
                        <select
                          value={bug.assignedTo?._id || ''}
                          onChange={(e) => handleAssignmentChange(bug._id, e.target.value)}
                          disabled={assigningBug === bug._id}
                          className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 border-0 cursor-pointer"
                        >
                          <option value="">{language === 'es' ? '🎯 Sin asignar' : '🎯 Unassigned'}</option>
                          {assignees.map((assignee) => (
                            <option key={assignee._id} value={assignee._id}>
                              🎯 {assignee.username}
                            </option>
                          ))}
                        </select>
                      ) : bug.assignedTo ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                          🎯 {bug.assignedTo.username}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          {language === 'es' ? 'Sin asignar' : 'Unassigned'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {bug.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>👤 {bug.userId?.username || 'Anonymous'}</span>
                      <span>🕐 {timeAgo(bug.createdAt)}</span>
                      {bug.pageUrl && (
                        <a
                          href={bug.pageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 hover:underline truncate max-w-[200px]"
                        >
                          📍 {bug.pageUrl.replace(/^https?:\/\/[^/]+/, '')}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBug(selectedBug === bug._id ? null : bug._id)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title={language === 'es' ? 'Ver detalles' : 'View details'}
                    >
                      <svg className={`w-5 h-5 transition-transform ${selectedBug === bug._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedBug === bug._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    {bug.screenshot && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'es' ? 'Captura de pantalla:' : 'Screenshot:'}
                        </p>
                        <img
                          src={bug.screenshot}
                          alt="Bug screenshot"
                          className="max-h-64 rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    )}

                    {/* Context Info */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'es' ? 'Contexto:' : 'Context:'}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span>{bug.theme === 'dark' ? '🌙' : '☀️'}</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {bug.theme === 'dark' ? 'Dark' : 'Light'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🌐</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {bug.language === 'es' ? 'Español' : 'English'}
                          </span>
                        </div>
                        {bug.screenSize && (
                          <div className="flex items-center gap-2">
                            <span>📐</span>
                            <span className="text-gray-600 dark:text-gray-400">{bug.screenSize}</span>
                          </div>
                        )}
                        {bug.pageUrl && (
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span className="text-gray-600 dark:text-gray-400 truncate">
                              {bug.pageUrl.replace(/^https?:\/\/[^/]+/, '')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {bug.userAgent && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {language === 'es' ? 'Navegador:' : 'Browser:'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                          {bug.userAgent}
                        </p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DevDashboard

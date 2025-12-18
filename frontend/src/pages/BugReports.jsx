import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

const STATE_COLORS = {
  open: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', chart: '#22c55e' },
  closed: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200', chart: '#8b5cf6' }
}

const DevDashboard = () => {
  const { user, isAuthenticated, canAccessBugDashboard, isAdmin } = useAuth()
  const { language } = useLanguage()
  const { timeAgo } = useDateFormat()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState([])
  const [counts, setCounts] = useState({ total: 0, open: 0, closed: 0 })
  const [timeSeries, setTimeSeries] = useState([])
  const [stateFilter, setStateFilter] = useState('all')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [githubConfigured, setGithubConfigured] = useState(true)
  const [repoInfo, setRepoInfo] = useState(null)

  // Health check state
  const [healthStatus, setHealthStatus] = useState({
    database: { status: 'checking', message: '' },
    environments: []
  })
  const [endpointsHealth, setEndpointsHealth] = useState(null)
  const [checkingEndpoints, setCheckingEndpoints] = useState(false)
  const [sourcesHealth, setSourcesHealth] = useState(null)
  const [checkingSources, setCheckingSources] = useState(false)

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
    if (user && !canAccessBugDashboard) {
      navigate('/')
      return
    }
  }, [isAuthenticated, user, canAccessBugDashboard, navigate])

  useEffect(() => {
    if (isAuthenticated && canAccessBugDashboard) {
      checkGitHubConfig()
      fetchIssues()
      fetchIssueStats()
    }
  }, [stateFilter, isAuthenticated, canAccessBugDashboard])

  // Health check on mount
  useEffect(() => {
    if (isAuthenticated && canAccessBugDashboard) {
      checkHealth()
      fetchEndpoints()
      fetchCacheStats()
    }
  }, [isAuthenticated, canAccessBugDashboard])

  const checkGitHubConfig = async () => {
    try {
      const response = await api.get('/github/config')
      setGithubConfigured(response.data?.data?.configured || false)
      setRepoInfo(response.data?.data?.repository || null)
    } catch (error) {
      console.error('Error checking GitHub config:', error)
      setGithubConfigured(false)
    }
  }

  const checkHealth = async () => {
    try {
      const response = await api.get('/health')
      setHealthStatus({
        database: {
          status: response.data.database?.connected ? 'healthy' : 'error',
          message: response.data.database?.message || (response.data.database?.connected ? 'Database connected' : 'Database not connected')
        },
        environments: response.data.environments || []
      })
    } catch (error) {
      setHealthStatus(prev => ({
        ...prev,
        database: { status: 'error', message: error.message || 'Could not verify' },
        environments: []
      }))
    }
  }

  // Fetch endpoints list on mount (without health check)
  const fetchEndpoints = async () => {
    try {
      const response = await api.get('/health/endpoints')
      setEndpointsHealth(response.data)
    } catch (error) {
      console.error('Error fetching endpoints:', error)
    }
  }

  // Check endpoints health (runs actual health checks)
  const checkEndpointsHealth = async () => {
    setCheckingEndpoints(true)
    try {
      const response = await api.get('/health/endpoints?check=true')
      setEndpointsHealth(response.data)
    } catch (error) {
      console.error('Error checking endpoints health:', error)
      setEndpointsHealth(prev => ({ ...prev, healthCheck: { status: 'error', message: error.message } }))
    } finally {
      setCheckingEndpoints(false)
    }
  }

  const checkSourcesHealth = async () => {
    setCheckingSources(true)
    try {
      const response = await api.get('/health/sources')
      setSourcesHealth(response.data)
    } catch (error) {
      console.error('Error checking sources health:', error)
      setSourcesHealth({ status: 'error', message: error.message })
    } finally {
      setCheckingSources(false)
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

  const syncPokemonCards = async (allSets = false) => {
    try {
      setSyncingPokemon(true)
      setSyncResult(null)
      const url = allSets ? '/mod/cache/sync/pokemon?allSets=true' : '/mod/cache/sync/pokemon'
      const response = await api.post(url, {}, { timeout: 600000 })
      if (response.data.success) {
        setSyncResult({
          success: true,
          type: 'pokemon',
          message: response.data.message,
          data: response.data.data
        })
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

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const state = stateFilter === 'all' ? 'all' : stateFilter
      const response = await api.get(`/github/issues?state=${state}&per_page=50`)
      if (response.data.success) {
        setIssues(response.data.data.issues || [])
        setCounts(response.data.data.counts || { total: 0, open: 0, closed: 0 })
      }
    } catch (error) {
      console.error('Error fetching GitHub issues:', error)
      setIssues([])
    } finally {
      setLoading(false)
    }
  }

  const fetchIssueStats = async () => {
    try {
      const response = await api.get('/github/stats')
      if (response.data.success) {
        setCounts(response.data.data.counts || { total: 0, open: 0, closed: 0 })
        setTimeSeries(response.data.data.timeSeries || [])
        if (response.data.data.repository) {
          setRepoInfo(response.data.data.repository)
        }
      }
    } catch (error) {
      console.error('Error fetching GitHub stats:', error)
    }
  }

  const handleCloseIssue = async (issueNumber) => {
    try {
      await api.patch(`/github/issues/${issueNumber}`, { state: 'closed' })
      fetchIssues()
      fetchIssueStats()
    } catch (error) {
      console.error('Error closing issue:', error)
    }
  }

  const handleReopenIssue = async (issueNumber) => {
    try {
      await api.patch(`/github/issues/${issueNumber}`, { state: 'open' })
      fetchIssues()
      fetchIssueStats()
    } catch (error) {
      console.error('Error reopening issue:', error)
    }
  }

  // Prepare chart data
  const chartData = [
    { name: language === 'es' ? 'Abiertos' : 'Open', value: counts.open, color: STATE_COLORS.open.chart },
    { name: language === 'es' ? 'Cerrados' : 'Closed', value: counts.closed, color: STATE_COLORS.closed.chart }
  ].filter(d => d.value > 0)

  if (loading && issues.length === 0) {
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
        {repoInfo && (
          <a
            href={repoInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            {language === 'es' ? 'Ver en GitHub' : 'View on GitHub'}
          </a>
        )}
      </div>

      {/* GitHub Not Configured Warning */}
      {!githubConfigured && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                {language === 'es' ? 'GitHub no configurado' : 'GitHub not configured'}
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {language === 'es'
                  ? 'Configura GITHUB_TOKEN, GITHUB_OWNER y GITHUB_REPO en las variables de entorno del backend.'
                  : 'Configure GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO in backend environment variables.'}
              </p>
            </div>
          </div>
        </div>
      )}

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

        {/* Environments Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              <span className="font-medium text-gray-900 dark:text-gray-100">🗄️ Database</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {healthStatus.database.message || (language === 'es' ? 'Verificando...' : 'Checking...')}
            </p>
          </div>
          {/* Production Environment */}
          {healthStatus.environments?.map((env, idx) => (
            <div key={idx} className={`p-4 rounded-lg ${
              env.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30' :
              env.status === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-yellow-100 dark:bg-yellow-900/30'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  env.status === 'healthy' ? 'bg-green-500' :
                  env.status === 'error' ? 'bg-red-500' :
                  'bg-yellow-500 animate-pulse'
                }`}></span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {env.name === 'Production' ? '🚀' : '🧪'} {env.name}
                </span>
              </div>
              <a
                href={env.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline block mt-1"
              >
                {env.url}
              </a>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${
                  env.status === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {env.message}
                </span>
                {env.latency && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{env.latency}ms</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Data Sources Health Check */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'es' ? 'Fuentes de Datos Externas' : 'External Data Sources'}
            </h3>
            <button
              onClick={checkSourcesHealth}
              disabled={checkingSources}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {checkingSources ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {language === 'es' ? 'Verificando...' : 'Checking...'}
                </>
              ) : (
                <>
                  🔍 {language === 'es' ? 'Verificar Fuentes' : 'Check Sources'}
                </>
              )}
            </button>
          </div>

          {sourcesHealth ? (
            <div className="space-y-2">
              <div className={`p-3 rounded-lg text-sm ${
                sourcesHealth.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                sourcesHealth.status === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}>
                {sourcesHealth.healthy}/{sourcesHealth.total} {language === 'es' ? 'fuentes saludables' : 'sources healthy'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {sourcesHealth.sources?.map((source, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      source.status === 'healthy'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          source.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        <span className={`font-medium text-sm ${
                          source.status === 'healthy' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                        }`}>{source.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {source.latency}ms
                      </span>
                    </div>
                    {source.url && (
                      <a
                        href={source.docsUrl || source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline block mt-1 truncate"
                        title={source.url}
                      >
                        {source.url}
                      </a>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {source.type === 'database' ? '🗄️' : '🌐'} {source.type}
                      </span>
                      <span className={`text-xs ${
                        source.status === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {source.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              {language === 'es'
                ? 'Haz clic en "Verificar Fuentes" para comprobar conectividad'
                : 'Click "Check Sources" to verify connectivity'}
            </p>
          )}
        </div>

        {/* API Endpoints - Honeycomb View */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {language === 'es' ? 'Endpoints API' : 'API Endpoints'} ({endpointsHealth?.total || 0})
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
                  🔍 {language === 'es' ? 'Verificar Salud' : 'Check Health'}
                </>
              )}
            </button>
          </div>

          {/* Health Check Result */}
          {endpointsHealth?.healthCheck && (
            <div className={`p-3 rounded-lg text-sm mb-3 ${
              endpointsHealth.healthCheck.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
              endpointsHealth.healthCheck.status === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}>
              {endpointsHealth.healthCheck.healthy}/{endpointsHealth.healthCheck.checked} {language === 'es' ? 'categorías saludables' : 'categories healthy'}
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(endpointsHealth.healthCheck.results || {}).map(([name, result]) => (
                  <span key={name} className={`px-2 py-1 rounded text-xs ${
                    result.status === 'healthy' ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'
                  }`}>
                    {result.status === 'healthy' ? '✓' : '✗'} {name} ({result.latency}ms)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Honeycomb Endpoints Grid */}
          {endpointsHealth?.categories ? (
            <div className="space-y-3">
              {Object.entries(endpointsHealth.categories).map(([category, endpoints]) => (
                <div key={category}>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                      {category}
                    </span>
                    <span className="text-gray-400">({endpoints.length})</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                    {endpoints.map((endpoint, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded text-xs ${
                          endpoint.protected
                            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        }`}
                        title={`${endpoint.method} ${endpoint.path}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`px-1 py-0.5 rounded text-[10px] font-mono ${
                            endpoint.method === 'GET' ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' :
                            endpoint.method === 'POST' ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' :
                            endpoint.method === 'PUT' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                            endpoint.method === 'PATCH' ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200' :
                            'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                          }`}>
                            {endpoint.method}
                          </span>
                          {endpoint.protected && <span title="Protected">🔒</span>}
                        </div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 truncate mt-1" title={endpoint.name}>
                          {endpoint.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              {language === 'es' ? 'Cargando endpoints...' : 'Loading endpoints...'}
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

          {cacheStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {language === 'es' ? 'Sincronización Manual' : 'Manual Sync'}
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => syncPokemonCards(false)}
                  disabled={syncingPokemon || syncingRiftbound}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                    ${syncingPokemon || syncingRiftbound
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  title={language === 'es' ? 'Solo cartas Standard (Scarlet & Violet)' : 'Standard cards only (Scarlet & Violet)'}
                >
                  {syncingPokemon ? (
                    <>
                      <Spinner size="sm" />
                      {language === 'es' ? 'Sincronizando...' : 'Syncing...'}
                    </>
                  ) : (
                    <>
                      ⚡ {language === 'es' ? 'Sync Standard' : 'Sync Standard'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => syncPokemonCards(true)}
                  disabled={syncingPokemon || syncingRiftbound}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                    ${syncingPokemon || syncingRiftbound
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  title={language === 'es' ? 'TODAS las cartas de Pokemon (puede tardar mucho)' : 'ALL Pokemon cards (may take a long time)'}
                >
                  {syncingPokemon ? (
                    <>
                      <Spinner size="sm" />
                      {language === 'es' ? 'Sincronizando...' : 'Syncing...'}
                    </>
                  ) : (
                    <>
                      🌐 {language === 'es' ? 'Sync TODO' : 'Sync ALL'}
                    </>
                  )}
                </button>
              </div>

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
                      ? `Modo: ${syncResult.data.mode === 'all' ? 'TODOS' : 'Standard'} | Sincronizadas: ${syncResult.data.synced} | Sets: ${syncResult.data.setsProcessed} | Omitidas: ${syncResult.data.skipped || 0} | Errores: ${syncResult.data.errors} | Total Pokemon: ${syncResult.data.totalPokemon}`
                      : `Mode: ${syncResult.data.mode === 'all' ? 'ALL' : 'Standard'} | Synced: ${syncResult.data.synced} | Sets: ${syncResult.data.setsProcessed} | Skipped: ${syncResult.data.skipped || 0} | Errors: ${syncResult.data.errors} | Total Pokemon: ${syncResult.data.totalPokemon}`
                    }
                  </p>
                )}
              </div>
            )}

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

      {/* GitHub Issues Section */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        {language === 'es' ? 'GitHub Issues' : 'GitHub Issues'}
      </h2>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {counts.total || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'es' ? 'Total' : 'Total'}
          </div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/50 rounded-lg shadow-md p-5">
          <div className="text-3xl font-bold text-green-800 dark:text-green-200">
            {counts.open || 0}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            {language === 'es' ? 'Abiertos' : 'Open'}
          </div>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/50 rounded-lg shadow-md p-5">
          <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">
            {counts.closed || 0}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">
            {language === 'es' ? 'Cerrados' : 'Closed'}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {counts.total ? Math.round((counts.closed / counts.total) * 100) : 0}%
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
            {language === 'es' ? 'Issues en los últimos 30 días' : 'Issues over last 30 days'}
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
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2 }}
                name={language === 'es' ? 'Creados' : 'Created'}
              />
              <Line
                type="monotone"
                dataKey="closed"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                name={language === 'es' ? 'Cerrados' : 'Closed'}
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
            {language === 'es' ? 'Por Estado' : 'By State'}
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
            {language === 'es' ? 'Filtrar por Estado' : 'Filter by State'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStateFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stateFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {language === 'es' ? 'Todos' : 'All'} ({counts.total || 0})
            </button>
            <button
              onClick={() => setStateFilter('open')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stateFilter === 'open'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
              }`}
            >
              {language === 'es' ? 'Abiertos' : 'Open'} ({counts.open || 0})
            </button>
            <button
              onClick={() => setStateFilter('closed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stateFilter === 'closed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900'
              }`}
            >
              {language === 'es' ? 'Cerrados' : 'Closed'} ({counts.closed || 0})
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { fetchIssues(); fetchIssueStats() }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              🔄 {language === 'es' ? 'Actualizar Issues' : 'Refresh Issues'}
            </button>
          </div>
        </div>
      </div>

      {/* GitHub Issues List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {language === 'es' ? 'Issues' : 'Issues'} ({issues.length})
          </h2>
        </div>

        {issues.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {githubConfigured
              ? (language === 'es' ? 'No hay issues de GitHub' : 'No GitHub issues')
              : (language === 'es' ? 'GitHub no configurado' : 'GitHub not configured')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedIssue === issue.id ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        #{issue.number}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {issue.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATE_COLORS[issue.state].bg} ${STATE_COLORS[issue.state].text}`}>
                        {issue.state === 'open'
                          ? (language === 'es' ? 'Abierto' : 'Open')
                          : (language === 'es' ? 'Cerrado' : 'Closed')}
                      </span>
                      {/* Labels */}
                      {issue.labels?.map((label) => (
                        <span
                          key={label.name}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `#${label.color}20`,
                            color: `#${label.color}`,
                            border: `1px solid #${label.color}40`
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        {issue.user?.avatar_url && (
                          <img
                            src={issue.user.avatar_url}
                            alt={issue.user.login}
                            className="w-4 h-4 rounded-full"
                          />
                        )}
                        {issue.user?.login || 'Unknown'}
                      </span>
                      <span>🕐 {timeAgo(issue.created_at)}</span>
                      {issue.comments > 0 && (
                        <span>💬 {issue.comments}</span>
                      )}
                      {issue.assignees?.length > 0 && (
                        <span className="flex items-center gap-1">
                          🎯 {issue.assignees.map(a => a.login).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-2">
                    {/* Open on GitHub */}
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title={language === 'es' ? 'Ver en GitHub' : 'View on GitHub'}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>

                    {/* Close/Reopen Button - Admin only */}
                    {isAdmin && (
                      <button
                        onClick={() => issue.state === 'open'
                          ? handleCloseIssue(issue.number)
                          : handleReopenIssue(issue.number)
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          issue.state === 'open'
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900'
                            : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                        }`}
                      >
                        {issue.state === 'open'
                          ? (language === 'es' ? 'Cerrar' : 'Close')
                          : (language === 'es' ? 'Reabrir' : 'Reopen')}
                      </button>
                    )}

                    {/* Expand Button */}
                    <button
                      onClick={() => setSelectedIssue(selectedIssue === issue.id ? null : issue.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title={language === 'es' ? 'Ver detalles' : 'View details'}
                    >
                      <svg className={`w-5 h-5 transition-transform ${selectedIssue === issue.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedIssue === issue.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    {issue.body && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {language === 'es' ? 'Descripción:' : 'Description:'}
                        </p>
                        <div className="prose prose-sm dark:prose-invert max-w-none p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400 font-sans">
                            {issue.body}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {language === 'es' ? 'Creado:' : 'Created:'} {new Date(issue.created_at).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                      </span>
                      <span>
                        {language === 'es' ? 'Actualizado:' : 'Updated:'} {new Date(issue.updated_at).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                      </span>
                      {issue.closed_at && (
                        <span>
                          {language === 'es' ? 'Cerrado:' : 'Closed:'} {new Date(issue.closed_at).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                        </span>
                      )}
                    </div>
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

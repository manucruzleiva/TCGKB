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
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
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

  // Roadmap integration state
  const [showRoadmapModal, setShowRoadmapModal] = useState(false)
  const [roadmapSections, setRoadmapSections] = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapIssue, setRoadmapIssue] = useState(null)
  const [roadmapForm, setRoadmapForm] = useState({
    priority: '2',
    section: '',
    title: '',
    description: ''
  })

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

  const syncPokemonCards = async (allSets = false, offset = 0) => {
    try {
      setSyncingPokemon(true)
      if (offset === 0) setSyncResult(null) // Only clear on first batch
      const params = new URLSearchParams()
      if (allSets) params.append('allSets', 'true')
      params.append('limit', '5') // 5 sets per batch to avoid timeout
      params.append('offset', offset.toString())
      const url = `/mod/cache/sync/pokemon?${params.toString()}`
      const response = await api.post(url, {}, { timeout: 120000 }) // 2 min timeout
      if (response.data.success) {
        setSyncResult({
          success: true,
          type: 'pokemon',
          message: response.data.message,
          data: response.data.data,
          allSets // Remember the mode for continue button
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

  // Roadmap functions
  const fetchRoadmapSections = async () => {
    try {
      const response = await api.get('/stats/roadmap/sections')
      if (response.data.success) {
        setRoadmapSections(response.data.data.priorities)
      }
    } catch (error) {
      console.error('Error fetching roadmap sections:', error)
    }
  }

  const openRoadmapModal = (issue) => {
    setRoadmapIssue(issue)
    setRoadmapForm({
      priority: '2',
      section: '',
      title: issue.title,
      description: `From GitHub Issue #${issue.number}: ${issue.html_url}`
    })
    if (!roadmapSections) {
      fetchRoadmapSections()
    }
    setShowRoadmapModal(true)
  }

  const closeRoadmapModal = () => {
    setShowRoadmapModal(false)
    setRoadmapIssue(null)
    setRoadmapForm({
      priority: '2',
      section: '',
      title: '',
      description: ''
    })
  }

  const addToRoadmap = async (e) => {
    e.preventDefault()
    if (!roadmapForm.title.trim() || !roadmapForm.section) return

    try {
      setRoadmapLoading(true)
      const response = await api.post('/stats/roadmap', {
        priority: parseInt(roadmapForm.priority),
        section: roadmapForm.section,
        title: roadmapForm.title.trim(),
        description: roadmapForm.description.trim() || undefined
      })

      if (response.data.success) {
        closeRoadmapModal()
        // Show success feedback
        alert(language === 'es' ? 'Item agregado al roadmap' : 'Item added to roadmap')
      }
    } catch (error) {
      console.error('Error adding to roadmap:', error)
      alert(error.response?.data?.message || (language === 'es' ? 'Error al agregar al roadmap' : 'Error adding to roadmap'))
    } finally {
      setRoadmapLoading(false)
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

  // Calculate SLA metrics from issues
  const calculateSLAMetrics = () => {
    if (!issues || issues.length === 0) {
      return {
        avgTimeToAssign: null,
        avgTimeToClose: null,
        avgTotalResolution: null,
        closedWithinSLA: 0,
        totalClosed: 0,
        openOverdue: 0,
        openOk: 0
      }
    }

    const closedIssues = issues.filter(i => i.state === 'closed' && i.closed_at)
    const openIssues = issues.filter(i => i.state === 'open')

    // Calculate average times
    let totalTimeToAssign = 0
    let assignedCount = 0
    let totalTimeToCloseAfterAssign = 0
    let closedAfterAssignCount = 0
    let totalResolutionTime = 0
    let resolutionCount = 0

    // SLA thresholds (in milliseconds)
    const SLA_ASSIGN_THRESHOLD = 24 * 60 * 60 * 1000 // 24 hours to assign
    const SLA_CLOSE_THRESHOLD = 7 * 24 * 60 * 60 * 1000 // 7 days to close
    let closedWithinSLA = 0
    let openOverdue = 0
    const now = new Date()

    closedIssues.forEach(issue => {
      const created = new Date(issue.created_at)
      const closed = new Date(issue.closed_at)
      const resolutionTime = closed - created

      totalResolutionTime += resolutionTime
      resolutionCount++

      // Check if closed within SLA (7 days)
      if (resolutionTime <= SLA_CLOSE_THRESHOLD) {
        closedWithinSLA++
      }
    })

    openIssues.forEach(issue => {
      const created = new Date(issue.created_at)
      const age = now - created
      if (age > SLA_CLOSE_THRESHOLD) {
        openOverdue++
      }
    })

    return {
      avgTimeToAssign: assignedCount > 0 ? totalTimeToAssign / assignedCount : null,
      avgTimeToCloseAfterAssign: closedAfterAssignCount > 0 ? totalTimeToCloseAfterAssign / closedAfterAssignCount : null,
      avgTotalResolution: resolutionCount > 0 ? totalResolutionTime / resolutionCount : null,
      closedWithinSLA,
      totalClosed: closedIssues.length,
      openOverdue,
      openOk: openIssues.length - openOverdue,
      slaAssignThreshold: SLA_ASSIGN_THRESHOLD,
      slaCloseThreshold: SLA_CLOSE_THRESHOLD
    }
  }

  const slaMetrics = calculateSLAMetrics()

  // Format duration for display
  const formatDuration = (ms) => {
    if (!ms) return '-'
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24

    if (days > 0) {
      return language === 'es'
        ? `${days}d ${remainingHours}h`
        : `${days}d ${remainingHours}h`
    }
    return language === 'es' ? `${hours}h` : `${hours}h`
  }

  // Calculate individual issue SLA status
  const getIssueSLAStatus = (issue) => {
    const created = new Date(issue.created_at)
    const now = new Date()
    const SLA_THRESHOLD = 7 * 24 * 60 * 60 * 1000 // 7 days

    if (issue.state === 'closed' && issue.closed_at) {
      const closed = new Date(issue.closed_at)
      const resolutionTime = closed - created
      const withinSLA = resolutionTime <= SLA_THRESHOLD
      return {
        status: withinSLA ? 'met' : 'breached',
        duration: resolutionTime,
        label: withinSLA
          ? (language === 'es' ? 'SLA cumplido' : 'SLA met')
          : (language === 'es' ? 'SLA incumplido' : 'SLA breached')
      }
    } else {
      const age = now - created
      const percentUsed = (age / SLA_THRESHOLD) * 100
      if (percentUsed >= 100) {
        return {
          status: 'overdue',
          duration: age,
          percentUsed: 100,
          label: language === 'es' ? 'Vencido' : 'Overdue'
        }
      } else if (percentUsed >= 75) {
        return {
          status: 'warning',
          duration: age,
          percentUsed,
          label: language === 'es' ? 'Por vencer' : 'Due soon'
        }
      }
      return {
        status: 'ok',
        duration: age,
        percentUsed,
        label: language === 'es' ? 'En tiempo' : 'On track'
      }
    }
  }

  // Prepare chart data
  const chartData = [
    { name: language === 'es' ? 'Abiertos' : 'Open', value: counts.open, color: STATE_COLORS.open.chart },
    { name: language === 'es' ? 'Cerrados' : 'Closed', value: counts.closed, color: STATE_COLORS.closed.chart }
  ].filter(d => d.value > 0)

  // Filter and sort issues
  const filteredAndSortedIssues = issues
    .filter(issue => {
      // Assignee filter
      if (assigneeFilter === 'unassigned') {
        return !issue.assignees || issue.assignees.length === 0
      }
      if (assigneeFilter !== 'all') {
        return issue.assignees?.some(a => a.login === assigneeFilter)
      }
      return true
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'updated':
          return new Date(b.updated_at) - new Date(a.updated_at)
        case 'comments':
          return (b.comments || 0) - (a.comments || 0)
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })

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
                  <div className="mt-1">
                    <p className="text-xs">
                      {language === 'es'
                        ? `Modo: ${syncResult.data.mode === 'all' ? 'TODOS' : 'Standard'} | Sincronizadas: ${syncResult.data.synced} | Sets: ${syncResult.data.setsProcessed} | Omitidas: ${syncResult.data.skipped || 0} | Errores: ${syncResult.data.errors} | Total Pokemon: ${syncResult.data.totalPokemon}`
                        : `Mode: ${syncResult.data.mode === 'all' ? 'ALL' : 'Standard'} | Synced: ${syncResult.data.synced} | Sets: ${syncResult.data.setsProcessed} | Skipped: ${syncResult.data.skipped || 0} | Errors: ${syncResult.data.errors} | Total Pokemon: ${syncResult.data.totalPokemon}`
                      }
                    </p>
                    {syncResult.data.pagination && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.round(((syncResult.data.pagination.offset + syncResult.data.setsProcessed) / syncResult.data.pagination.totalSets) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs">
                            {syncResult.data.pagination.offset + syncResult.data.setsProcessed}/{syncResult.data.pagination.totalSets} sets
                          </span>
                        </div>
                        {syncResult.data.pagination.hasMore && (
                          <button
                            onClick={() => syncPokemonCards(syncResult.allSets, syncResult.data.pagination.nextOffset)}
                            disabled={syncingPokemon}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {syncingPokemon ? (
                              <>⏳ {language === 'es' ? 'Sincronizando...' : 'Syncing...'}</>
                            ) : (
                              <>▶️ {language === 'es' ? `Continuar (${syncResult.data.pagination.setsRemaining} sets restantes)` : `Continue (${syncResult.data.pagination.setsRemaining} sets remaining)`}</>
                            )}
                          </button>
                        )}
                        {!syncResult.data.pagination.hasMore && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            ✅ {language === 'es' ? 'Sincronización completa!' : 'Sync complete!'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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

      {/* SLA Metrics Section */}
      {issues.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            ⏱️ {language === 'es' ? 'Métricas SLA' : 'SLA Metrics'}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              ({language === 'es' ? 'Objetivo: 7 días' : 'Target: 7 days'})
            </span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Average Resolution Time */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {formatDuration(slaMetrics.avgTotalResolution)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {language === 'es' ? 'Tiempo promedio de resolución' : 'Avg resolution time'}
              </div>
            </div>

            {/* SLA Compliance Rate */}
            <div className={`p-4 rounded-lg border ${
              slaMetrics.totalClosed > 0 && (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.8
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : slaMetrics.totalClosed > 0 && (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.5
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className={`text-2xl font-bold ${
                slaMetrics.totalClosed > 0 && (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.8
                  ? 'text-green-800 dark:text-green-200'
                  : slaMetrics.totalClosed > 0 && (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.5
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : 'text-red-800 dark:text-red-200'
              }`}>
                {slaMetrics.totalClosed > 0
                  ? `${Math.round((slaMetrics.closedWithinSLA / slaMetrics.totalClosed) * 100)}%`
                  : '-'}
              </div>
              <div className={`text-xs ${
                slaMetrics.totalClosed > 0 && (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.8
                  ? 'text-green-600 dark:text-green-400'
                  : slaMetrics.totalClosed > 0 && (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.5
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {language === 'es' ? 'Cumplimiento SLA' : 'SLA compliance'}
                <span className="block text-gray-500 dark:text-gray-400">
                  ({slaMetrics.closedWithinSLA}/{slaMetrics.totalClosed} {language === 'es' ? 'en tiempo' : 'on time'})
                </span>
              </div>
            </div>

            {/* Open Issues Status */}
            <div className={`p-4 rounded-lg border ${
              slaMetrics.openOverdue > 0
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  slaMetrics.openOverdue > 0
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-green-800 dark:text-green-200'
                }`}>
                  {slaMetrics.openOk}
                </span>
                {slaMetrics.openOverdue > 0 && (
                  <span className="text-sm text-red-600 dark:text-red-400">
                    +{slaMetrics.openOverdue} ⚠️
                  </span>
                )}
              </div>
              <div className={`text-xs ${
                slaMetrics.openOverdue > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {language === 'es' ? 'Issues abiertos en tiempo' : 'Open issues on track'}
                {slaMetrics.openOverdue > 0 && (
                  <span className="block text-red-500 dark:text-red-400">
                    {slaMetrics.openOverdue} {language === 'es' ? 'vencidos' : 'overdue'}
                  </span>
                )}
              </div>
            </div>

            {/* SLA Health Score */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl ${
                  slaMetrics.openOverdue === 0 && (slaMetrics.totalClosed === 0 || (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.8)
                    ? ''
                    : slaMetrics.openOverdue <= 2 && (slaMetrics.totalClosed === 0 || (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.5)
                      ? ''
                      : ''
                }`}>
                  {slaMetrics.openOverdue === 0 && (slaMetrics.totalClosed === 0 || (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.8)
                    ? '🟢'
                    : slaMetrics.openOverdue <= 2 && (slaMetrics.totalClosed === 0 || (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.5)
                      ? '🟡'
                      : '🔴'}
                </span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {slaMetrics.openOverdue === 0 && (slaMetrics.totalClosed === 0 || (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.8)
                    ? (language === 'es' ? 'Saludable' : 'Healthy')
                    : slaMetrics.openOverdue <= 2 && (slaMetrics.totalClosed === 0 || (slaMetrics.closedWithinSLA / slaMetrics.totalClosed) >= 0.5)
                      ? (language === 'es' ? 'Atención' : 'Attention')
                      : (language === 'es' ? 'Crítico' : 'Critical')}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'es' ? 'Estado general SLA' : 'Overall SLA health'}
              </div>
            </div>
          </div>

          {/* SLA Progress Bar */}
          {slaMetrics.totalClosed > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>{language === 'es' ? 'Distribución de cumplimiento' : 'Compliance distribution'}</span>
                <span>{slaMetrics.closedWithinSLA} / {slaMetrics.totalClosed}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${(slaMetrics.closedWithinSLA / slaMetrics.totalClosed) * 100}%` }}
                  title={language === 'es' ? 'Dentro de SLA' : 'Within SLA'}
                />
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${((slaMetrics.totalClosed - slaMetrics.closedWithinSLA) / slaMetrics.totalClosed) * 100}%` }}
                  title={language === 'es' ? 'Fuera de SLA' : 'Outside SLA'}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {language === 'es' ? 'En tiempo' : 'On time'} ({slaMetrics.closedWithinSLA})
                </span>
                <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  {language === 'es' ? 'Tarde' : 'Late'} ({slaMetrics.totalClosed - slaMetrics.closedWithinSLA})
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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
            {language === 'es' ? 'Filtros y Ordenamiento' : 'Filters & Sorting'}
          </h2>

          {/* State Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {language === 'es' ? 'Estado' : 'State'}
            </label>
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
          </div>

          {/* Assignee Filter & Sort Order Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {language === 'es' ? 'Asignatario' : 'Assignee'}
              </label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">{language === 'es' ? 'Todos' : 'All'}</option>
                <option value="unassigned">{language === 'es' ? 'Sin asignar' : 'Unassigned'}</option>
                {/* Dynamic assignees from issues */}
                {[...new Set(issues.flatMap(i => i.assignees?.map(a => a.login) || []))].map(login => (
                  <option key={login} value={login}>{login}</option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {language === 'es' ? 'Ordenar por' : 'Sort by'}
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="newest">{language === 'es' ? 'Más reciente' : 'Newest'}</option>
                <option value="oldest">{language === 'es' ? 'Más antiguo' : 'Oldest'}</option>
                <option value="updated">{language === 'es' ? 'Actualizado recientemente' : 'Recently updated'}</option>
                <option value="comments">{language === 'es' ? 'Más comentarios' : 'Most comments'}</option>
              </select>
            </div>
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
            {language === 'es' ? 'Issues' : 'Issues'} ({filteredAndSortedIssues.length}
            {filteredAndSortedIssues.length !== issues.length && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> / {issues.length}</span>
            )})
          </h2>
        </div>

        {filteredAndSortedIssues.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {githubConfigured
              ? (issues.length === 0
                  ? (language === 'es' ? 'No hay issues de GitHub' : 'No GitHub issues')
                  : (language === 'es' ? 'No hay issues que coincidan con los filtros' : 'No issues match the filters'))
              : (language === 'es' ? 'GitHub no configurado' : 'GitHub not configured')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedIssues.map((issue) => (
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
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
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
                      {/* SLA Status Indicator */}
                      {(() => {
                        const sla = getIssueSLAStatus(issue)
                        return (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            sla.status === 'met' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                            sla.status === 'breached' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                            sla.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                            sla.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                            'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          }`}>
                            {sla.status === 'met' ? '✓' : sla.status === 'breached' || sla.status === 'overdue' ? '⚠' : sla.status === 'warning' ? '⏰' : '◎'} {sla.label}
                          </span>
                        )
                      })()}
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

                    {/* SLA Lifecycle */}
                    {(() => {
                      const sla = getIssueSLAStatus(issue)
                      const created = new Date(issue.created_at)
                      const now = new Date()
                      const SLA_THRESHOLD = 7 * 24 * 60 * 60 * 1000 // 7 days

                      return (
                        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            ⏱️ {language === 'es' ? 'Ciclo de Vida SLA' : 'SLA Lifecycle'}
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              sla.status === 'met' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                              sla.status === 'breached' || sla.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                              sla.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                              'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                            }`}>
                              {sla.label}
                            </span>
                          </p>

                          {/* Timeline */}
                          <div className="relative">
                            {/* Progress bar background */}
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              {issue.state === 'closed' && issue.closed_at ? (
                                <div
                                  className={`h-full ${sla.status === 'met' ? 'bg-green-500' : 'bg-red-500'} transition-all`}
                                  style={{ width: '100%' }}
                                />
                              ) : (
                                <div
                                  className={`h-full transition-all ${
                                    sla.percentUsed >= 100 ? 'bg-red-500' :
                                    sla.percentUsed >= 75 ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(sla.percentUsed || 0, 100)}%` }}
                                />
                              )}
                            </div>

                            {/* Timeline labels */}
                            <div className="flex justify-between mt-2 text-xs">
                              <div className="flex flex-col items-start">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {language === 'es' ? 'Creado' : 'Created'}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {new Date(issue.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                                </span>
                              </div>

                              <div className="flex flex-col items-center">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {language === 'es' ? 'Duración' : 'Duration'}
                                </span>
                                <span className={`font-medium ${
                                  sla.status === 'met' || sla.status === 'ok' ? 'text-green-600 dark:text-green-400' :
                                  sla.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {formatDuration(sla.duration)}
                                </span>
                              </div>

                              <div className="flex flex-col items-end">
                                {issue.state === 'closed' && issue.closed_at ? (
                                  <>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {language === 'es' ? 'Cerrado' : 'Closed'}
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      {new Date(issue.closed_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {language === 'es' ? 'Objetivo SLA' : 'SLA Target'}
                                    </span>
                                    <span className={`${
                                      sla.percentUsed >= 100 ? 'text-red-600 dark:text-red-400' :
                                      sla.percentUsed >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                                      'text-gray-500 dark:text-gray-400'
                                    }`}>
                                      {new Date(created.getTime() + SLA_THRESHOLD).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

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

                    {/* Add to Roadmap button */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => openRoadmapModal(issue)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-lg transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        {language === 'es' ? 'Agregar al Roadmap' : 'Add to Roadmap'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add to Roadmap Modal */}
      {showRoadmapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {language === 'es' ? 'Agregar al Roadmap' : 'Add to Roadmap'}
                </h3>
                <button
                  onClick={closeRoadmapModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {roadmapIssue && (
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'es' ? 'Desde Issue:' : 'From Issue:'}
                  </p>
                  <a
                    href={roadmapIssue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                  >
                    #{roadmapIssue.number}: {roadmapIssue.title}
                  </a>
                </div>
              )}

              <form onSubmit={addToRoadmap}>
                {/* Priority */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'es' ? 'Prioridad' : 'Priority'}
                  </label>
                  <select
                    value={roadmapForm.priority}
                    onChange={(e) => {
                      setRoadmapForm({ ...roadmapForm, priority: e.target.value, section: '' })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="1">{language === 'es' ? 'Prioridad 1 - Alta' : 'Priority 1 - High'}</option>
                    <option value="2">{language === 'es' ? 'Prioridad 2 - Media' : 'Priority 2 - Medium'}</option>
                    <option value="3">{language === 'es' ? 'Prioridad 3 - Baja' : 'Priority 3 - Low'}</option>
                  </select>
                </div>

                {/* Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'es' ? 'Sección' : 'Section'}
                  </label>
                  <select
                    value={roadmapForm.section}
                    onChange={(e) => setRoadmapForm({ ...roadmapForm, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">{language === 'es' ? 'Seleccionar sección...' : 'Select section...'}</option>
                    {roadmapSections && roadmapSections[roadmapForm.priority]?.sections?.map((section) => (
                      <option key={section.key} value={section.key}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'es' ? 'Título' : 'Title'}
                  </label>
                  <input
                    type="text"
                    value={roadmapForm.title}
                    onChange={(e) => setRoadmapForm({ ...roadmapForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={language === 'es' ? 'Título del item' : 'Item title'}
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'es' ? 'Descripción (opcional)' : 'Description (optional)'}
                  </label>
                  <textarea
                    value={roadmapForm.description}
                    onChange={(e) => setRoadmapForm({ ...roadmapForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={3}
                    placeholder={language === 'es' ? 'Descripción adicional...' : 'Additional description...'}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={closeRoadmapModal}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={roadmapLoading || !roadmapForm.title.trim() || !roadmapForm.section}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {roadmapLoading && (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {language === 'es' ? 'Agregar' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DevDashboard

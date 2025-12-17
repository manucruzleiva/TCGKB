import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
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
  wont_fix: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', chart: '#6b7280' }
}

const STATUS_LABELS = {
  new: { es: 'Nuevo', en: 'New' },
  reviewing: { es: 'Revisando', en: 'Reviewing' },
  in_progress: { es: 'En Progreso', en: 'In Progress' },
  resolved: { es: 'Resuelto', en: 'Resolved' },
  wont_fix: { es: 'No se arreglará', en: "Won't Fix" }
}

const BugReports = () => {
  const { user, isAuthenticated } = useAuth()
  const { language } = useLanguage()
  const { timeAgo } = useDateFormat()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [bugReports, setBugReports] = useState([])
  const [bugCounts, setBugCounts] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBug, setSelectedBug] = useState(null)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (user && user.role !== 'admin') {
      navigate('/')
      return
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchBugReports()
    }
  }, [statusFilter, isAuthenticated, user])

  const fetchBugReports = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/bugs?status=${statusFilter}`)
      if (response.data.success) {
        setBugReports(response.data.data.bugReports)
        setBugCounts(response.data.data.counts || {})
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

  const handleDelete = async (bugId) => {
    if (!window.confirm(language === 'es' ? '¿Eliminar este reporte?' : 'Delete this report?')) {
      return
    }
    try {
      await api.delete(`/bugs/${bugId}`)
      setBugReports(prev => prev.filter(b => b._id !== bugId))
      setSelectedBug(null)
      fetchBugReports()
    } catch (error) {
      console.error('Error deleting bug:', error)
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
            🐛 {language === 'es' ? 'Bug Reports' : 'Bug Reports'}
          </h1>
        </div>
      </div>

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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {bug.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[bug.status].bg} ${STATUS_COLORS[bug.status].text}`}>
                        {STATUS_LABELS[bug.status][language]}
                      </span>
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

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'es' ? 'Cambiar estado:' : 'Change status:'}
                      </span>
                      {Object.entries(STATUS_LABELS).map(([status, labels]) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(bug._id, status)}
                          disabled={updating === bug._id || bug.status === status}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                            bug.status === status
                              ? `${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].text} ring-2 ring-primary-500`
                              : `${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].text} hover:opacity-80`
                          }`}
                        >
                          {updating === bug._id ? '...' : labels[language]}
                        </button>
                      ))}
                      <button
                        onClick={() => handleDelete(bug._id)}
                        className="px-3 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 transition-colors ml-auto"
                      >
                        🗑️ {language === 'es' ? 'Eliminar' : 'Delete'}
                      </button>
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

export default BugReports

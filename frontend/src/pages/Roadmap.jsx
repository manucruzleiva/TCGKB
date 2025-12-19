import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

// Status styles
const statusStyles = {
  'In Progress': {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    icon: '🚀'
  },
  'Planned': {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    icon: '📋'
  },
  'Backlog': {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-700 dark:text-gray-400',
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    icon: '💭'
  },
  'Done': {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    icon: '✅'
  }
}

// Label colors from GitHub
const getLabelStyle = (color) => {
  return {
    backgroundColor: `#${color}20`,
    color: `#${color}`,
    borderColor: `#${color}40`
  }
}

const Roadmap = () => {
  const { language } = useLanguage()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    fetchRoadmap()
  }, [])

  const fetchRoadmap = async () => {
    try {
      setLoading(true)
      const response = await api.get('/github/project')
      if (response.data.success) {
        setRoadmap(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching roadmap:', err)
      setError(language === 'es' ? 'Error al cargar el roadmap' : 'Error loading roadmap')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const statusOrder = ['In Progress', 'Planned', 'Backlog']
  if (showCompleted) statusOrder.push('Done')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm mb-4 inline-block"
        >
          ← {language === 'es' ? 'Volver al inicio' : 'Back to home'}
        </Link>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Roadmap
          </h1>
          <a
            href="https://github.com/users/manucruzleiva/projects/2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            {language === 'es' ? 'Ver en GitHub' : 'View on GitHub'}
          </a>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'es'
            ? 'Funcionalidades planificadas y progreso del desarrollo'
            : 'Planned features and development progress'}
        </p>
      </div>

      {error ? (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      ) : roadmap ? (
        <>
          {/* Overall Progress */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {language === 'es' ? 'Progreso General' : 'Overall Progress'}
              </h2>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {roadmap.stats.progress}%
              </span>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
                style={{ width: `${roadmap.stats.progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                {roadmap.stats.completed} {language === 'es' ? 'completados' : 'completed'}
              </span>
              <span>
                {roadmap.stats.total - roadmap.stats.completed} {language === 'es' ? 'pendientes' : 'pending'}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {roadmap.stats.inProgress}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'es' ? 'En progreso' : 'In Progress'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {roadmap.stats.planned}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'es' ? 'Planificado' : 'Planned'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {roadmap.stats.backlog}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Backlog
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {roadmap.stats.completed}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'es' ? 'Completado' : 'Done'}
                </div>
              </div>
            </div>
          </div>

          {/* Toggle completed */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2"
            >
              <span className={`w-4 h-4 rounded border ${showCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-400'} flex items-center justify-center`}>
                {showCompleted && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {language === 'es' ? 'Mostrar completados' : 'Show completed'}
            </button>
          </div>

          {/* Status Sections */}
          <div className="space-y-6">
            {statusOrder.map(status => {
              const items = roadmap.byStatus[status.toLowerCase().replace(' ', '')] ||
                           roadmap.byStatus[status === 'In Progress' ? 'inProgress' : status.toLowerCase()]
              if (!items || items.length === 0) return null

              const style = statusStyles[status] || statusStyles['Backlog']

              return (
                <div key={status} className={`card ${style.bg} border-2 ${style.border}`}>
                  {/* Status Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{style.icon}</span>
                      <div>
                        <h2 className={`text-xl font-bold ${style.text}`}>
                          {status}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {item.issueNumber && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  #{item.issueNumber}
                                </span>
                              )}
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {item.title}
                              </h3>
                            </div>

                            {/* Labels */}
                            {item.labels && item.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.labels.map((label, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs rounded-full border"
                                    style={getLabelStyle(label.color)}
                                  >
                                    {label.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Description preview */}
                            {item.body && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                {item.body.split('\n')[0].substring(0, 150)}
                                {item.body.length > 150 && '...'}
                              </p>
                            )}
                          </div>

                          {/* Link to GitHub */}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                              title={language === 'es' ? 'Ver en GitHub' : 'View on GitHub'}
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              {language === 'es'
                ? 'El roadmap se actualiza automáticamente desde '
                : 'The roadmap is automatically updated from '}
              <a
                href="https://github.com/users/manucruzleiva/projects/2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                GitHub Project
              </a>
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default Roadmap

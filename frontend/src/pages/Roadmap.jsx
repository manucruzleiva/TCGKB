import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

// Priority colors and icons
const priorityStyles = {
  1: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    progress: 'bg-red-500',
    icon: '🔥'
  },
  2: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    progress: 'bg-yellow-500',
    icon: '⚡'
  },
  3: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    progress: 'bg-blue-500',
    icon: '🛠️'
  }
}

const Roadmap = () => {
  const { language } = useLanguage()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})

  useEffect(() => {
    fetchRoadmap()
  }, [])

  const fetchRoadmap = async () => {
    try {
      setLoading(true)
      const response = await api.get('/stats/roadmap')
      if (response.data.success) {
        setRoadmap(response.data.data)
        // Expand all sections by default
        const expanded = {}
        response.data.data.priorities.forEach((p, pIdx) => {
          p.sections.forEach((s, sIdx) => {
            expanded[`${pIdx}-${sIdx}`] = true
          })
        })
        setExpandedSections(expanded)
      }
    } catch (err) {
      console.error('Error fetching roadmap:', err)
      setError(language === 'es' ? 'Error al cargar el roadmap' : 'Error loading roadmap')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (key) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

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
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Roadmap
          </h1>
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
                {roadmap.stats.pending} {language === 'es' ? 'pendientes' : 'pending'}
              </span>
            </div>
          </div>

          {/* Priorities */}
          <div className="space-y-6">
            {roadmap.priorities.map((priority, pIdx) => {
              const style = priorityStyles[priority.level] || priorityStyles[3]
              return (
                <div key={pIdx} className={`card ${style.bg} ${style.border} border-2`}>
                  {/* Priority Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{style.icon}</span>
                      <div>
                        <h2 className={`text-xl font-bold ${style.text}`}>
                          {language === 'es' ? 'Prioridad' : 'Priority'} {priority.level}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {priority.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${style.badge}`}>
                        {priority.progress}%
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {priority.completedCount}/{priority.totalCount}
                      </p>
                    </div>
                  </div>

                  {/* Priority Progress Bar */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full ${style.progress} transition-all duration-500`}
                      style={{ width: `${priority.progress}%` }}
                    />
                  </div>

                  {/* Sections */}
                  <div className="space-y-3">
                    {priority.sections.map((section, sIdx) => {
                      const sectionKey = `${pIdx}-${sIdx}`
                      const isExpanded = expandedSections[sectionKey]
                      return (
                        <div
                          key={sIdx}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                          {/* Section Header */}
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {section.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${style.progress} transition-all duration-300`}
                                  style={{ width: `${section.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400 w-16 text-right">
                                {section.completedCount}/{section.totalCount}
                              </span>
                            </div>
                          </button>

                          {/* Section Items */}
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-2">
                              {section.items.map((item, iIdx) => (
                                <div
                                  key={iIdx}
                                  className={`flex items-start gap-3 p-2 rounded ${
                                    item.completed
                                      ? 'bg-green-50 dark:bg-green-900/20'
                                      : 'bg-gray-50 dark:bg-gray-800/50'
                                  }`}
                                >
                                  <span className={`mt-0.5 ${item.completed ? 'text-green-500' : 'text-gray-400'}`}>
                                    {item.completed ? (
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                      </svg>
                                    )}
                                  </span>
                                  <span className={`text-sm ${
                                    item.completed
                                      ? 'text-green-700 dark:text-green-400 line-through'
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {item.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              {language === 'es'
                ? 'El roadmap se actualiza automáticamente desde el archivo '
                : 'The roadmap is automatically updated from the '}
              <a
                href="https://github.com/manucruzleiva/TCGKB/blob/main/TODO.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                TODO.md
              </a>
              {language === 'es' ? ' en GitHub' : ' on GitHub'}
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default Roadmap

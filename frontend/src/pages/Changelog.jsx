import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

// Detect branch based on hostname
const detectBranch = () => {
  const hostname = window.location.hostname
  if (hostname.startsWith('staging.')) {
    return 'stage'
  }
  // Default to main for production and localhost
  return 'main'
}

// Commit type detection based on message prefix
const getCommitType = (message) => {
  const lowerMsg = message.toLowerCase()
  if (lowerMsg.startsWith('feat:') || lowerMsg.startsWith('feature:') || lowerMsg.includes('add ') || lowerMsg.includes('new ')) {
    return 'Added'
  }
  if (lowerMsg.startsWith('fix:') || lowerMsg.startsWith('bugfix:') || lowerMsg.includes('fix ')) {
    return 'Fixed'
  }
  if (lowerMsg.startsWith('refactor:') || lowerMsg.startsWith('chore:') || lowerMsg.includes('update ') || lowerMsg.includes('improve')) {
    return 'Changed'
  }
  if (lowerMsg.startsWith('remove:') || lowerMsg.startsWith('delete:') || lowerMsg.includes('remove ')) {
    return 'Removed'
  }
  if (lowerMsg.startsWith('security:') || lowerMsg.includes('security') || lowerMsg.includes('vulnerability')) {
    return 'Security'
  }
  if (lowerMsg.startsWith('docs:') || lowerMsg.includes('documentation')) {
    return 'Docs'
  }
  return 'Changed'
}

const typeColors = {
  Added: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
  Changed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  Fixed: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
  Removed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
  Security: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700',
  Docs: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700'
}

const typeIcons = {
  Added: '✨',
  Changed: '🔄',
  Fixed: '🐛',
  Removed: '🗑️',
  Security: '🔒',
  Docs: '📝'
}

const branchLabels = {
  main: { en: 'Production', es: 'Producción' },
  stage: { en: 'Staging', es: 'Staging' }
}

const Changelog = () => {
  const { language } = useLanguage()
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleDates, setVisibleDates] = useState([])
  const [currentBranch, setCurrentBranch] = useState('main')

  useEffect(() => {
    const branch = detectBranch()
    setCurrentBranch(branch)
    fetchCommits(branch)
  }, [])

  const fetchCommits = async (branch) => {
    try {
      setLoading(true)
      const response = await api.get(`/stats/commits?branch=${branch}`)
      if (response.data.success) {
        setCommits(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching commits:', err)
      setError(language === 'es' ? 'Error al cargar los commits' : 'Error loading commits')
    } finally {
      setLoading(false)
    }
  }

  // Animate dates appearing one by one
  useEffect(() => {
    if (commits.length === 0) return

    const timer = setInterval(() => {
      setVisibleDates(prev => {
        if (prev.length >= commits.length) {
          clearInterval(timer)
          return prev
        }
        return [...prev, commits[prev.length].date]
      })
    }, 150)

    return () => clearInterval(timer)
  }, [commits])

  // Get first line of commit message (title)
  const getCommitTitle = (message) => {
    return message.split('\n')[0].replace(/^(feat|fix|chore|refactor|docs|style|test|ci|build)(\(.+\))?:\s*/i, '')
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
            Changelog
          </h1>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            currentBranch === 'main'
              ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
              : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
          }`}>
            {branchLabels[currentBranch][language === 'es' ? 'es' : 'en']}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'es'
            ? 'Historial de cambios y actualizaciones en tiempo real'
            : 'Real-time changes and updates history'}
        </p>
      </div>

      {error ? (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      ) : commits.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {language === 'es' ? 'No hay commits disponibles' : 'No commits available'}
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Dates */}
            <div className="space-y-8">
              {commits.map((dayGroup, idx) => {
                const isVisible = visibleDates.includes(dayGroup.date)

                return (
                  <div
                    key={dayGroup.date}
                    className={`relative pl-12 transition-all duration-500 ${
                      isVisible
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-4'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2 w-5 h-5 rounded-full border-4 transition-all duration-300 ${
                        idx === 0
                          ? 'bg-primary-500 border-primary-200 dark:border-primary-800 scale-110'
                          : 'bg-gray-400 dark:bg-gray-500 border-gray-200 dark:border-gray-700'
                      }`}
                    />

                    {/* Date card */}
                    <div className="card">
                      {/* Date header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-lg font-bold ${
                              idx === 0
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {new Date(dayGroup.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full animate-pulse">
                              {language === 'es' ? 'Más reciente' : 'Latest'}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {dayGroup.commits.length} {dayGroup.commits.length === 1
                            ? (language === 'es' ? 'commit' : 'commit')
                            : (language === 'es' ? 'commits' : 'commits')}
                        </span>
                      </div>

                      {/* Commits */}
                      <div className="space-y-3">
                        {dayGroup.commits.map((commit, cIdx) => {
                          const commitType = getCommitType(commit.message)
                          return (
                            <div
                              key={commit.sha}
                              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg transition-all duration-300"
                              style={{
                                transitionDelay: isVisible ? `${cIdx * 50}ms` : '0ms'
                              }}
                            >
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${
                                  typeColors[commitType]
                                }`}
                              >
                                <span>{typeIcons[commitType]}</span>
                                <span>{commitType}</span>
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-700 dark:text-gray-300 text-sm">
                                  {getCommitTitle(commit.message)}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <a
                                    href={commit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-primary-600 dark:text-primary-400 hover:underline"
                                  >
                                    {commit.sha}
                                  </a>
                                  <span>•</span>
                                  <span>{commit.author}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              {language === 'es'
                ? 'Los commits se obtienen automáticamente del repositorio de '
                : 'Commits are automatically fetched from the '}
              <a
                href="https://github.com/manucruzleiva/TCGKB"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                GitHub
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default Changelog

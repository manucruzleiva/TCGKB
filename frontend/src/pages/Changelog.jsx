import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

// Commit type configuration
const COMMIT_TYPES = {
  feat: {
    label: { en: 'New Feature', es: 'Nueva Funcionalidad' },
    icon: '✨',
    color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
  },
  fix: {
    label: { en: 'Bug Fix', es: 'Corrección' },
    icon: '🐛',
    color: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
  },
  refactor: {
    label: { en: 'Refactor', es: 'Refactorización' },
    icon: '♻️',
    color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  },
  perf: {
    label: { en: 'Performance', es: 'Rendimiento' },
    icon: '⚡',
    color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
  },
  docs: {
    label: { en: 'Documentation', es: 'Documentación' },
    icon: '📚',
    color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
  },
  chore: {
    label: { en: 'Maintenance', es: 'Mantenimiento' },
    icon: '🔧',
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  },
  other: {
    label: { en: 'Other', es: 'Otro' },
    icon: '📝',
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
  }
}

const CommitCard = ({ commit, language, timeAgo }) => {
  const typeConfig = COMMIT_TYPES[commit.type] || COMMIT_TYPES.other

  return (
    <div className={`p-4 rounded-lg border ${typeConfig.color} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{typeConfig.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {commit.message}
          </p>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
            {commit.scope && (
              <span className="px-2 py-0.5 rounded bg-white/50 dark:bg-black/20 text-xs font-medium">
                {commit.scope}
              </span>
            )}
            <span className="flex items-center gap-1">
              {commit.author.avatar_url ? (
                <img
                  src={commit.author.avatar_url}
                  alt={commit.author.name}
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <span className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                  {commit.author.name.charAt(0)}
                </span>
              )}
              {commit.author.login || commit.author.name}
            </span>
            <span>{timeAgo(commit.author.date)}</span>
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline font-mono"
            >
              {commit.shortSha}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const CommitSection = ({ title, icon, commits, language, emptyMessage, accentColor, timeAgo }) => {
  if (commits.length === 0) {
    return (
      <div className={`border-l-4 ${accentColor} pl-4 py-2`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 italic">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={`border-l-4 ${accentColor} pl-4`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
        <span>{icon}</span> {title}
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          ({commits.length})
        </span>
      </h3>
      <div className="space-y-3">
        {commits.map((commit) => (
          <CommitCard key={commit.sha} commit={commit} language={language} timeAgo={timeAgo} />
        ))}
      </div>
    </div>
  )
}

const Changelog = () => {
  const { language } = useLanguage()
  const { timeAgo } = useDateFormat()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [changelog, setChangelog] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetchChangelog()
  }, [])

  const fetchChangelog = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/github/changelog')
      if (response.data.success) {
        setChangelog(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching changelog:', err)
      setError(language === 'es'
        ? 'Error al cargar el changelog'
        : 'Error loading changelog')
    } finally {
      setLoading(false)
    }
  }

  const filterCommits = (commits) => {
    if (activeFilter === 'all') return commits
    return commits.filter(c => c.type === activeFilter)
  }

  const getFilterCounts = (commits) => {
    const counts = { all: commits.length }
    commits.forEach(c => {
      counts[c.type] = (counts[c.type] || 0) + 1
    })
    return counts
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  const pendingCommits = changelog?.pending?.commits || []
  const releasedCommits = changelog?.released?.commits || []
  const allCommits = [...pendingCommits, ...releasedCommits]
  const filterCounts = getFilterCounts(allCommits)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm mb-4 inline-block"
        >
          {language === 'es' ? 'Volver al inicio' : 'Back to home'}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <span>📋</span>
          Changelog
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {language === 'es'
            ? 'Historial de cambios y actualizaciones del proyecto'
            : 'Project change history and updates'}
        </p>
        {changelog?.repository && (
          <a
            href={changelog.repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            {changelog.repository.owner}/{changelog.repository.repo}
          </a>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {language === 'es' ? 'Todos' : 'All'} ({filterCounts.all || 0})
        </button>
        {Object.entries(COMMIT_TYPES).map(([type, config]) => {
          const count = filterCounts[type] || 0
          if (count === 0 && type !== 'feat' && type !== 'fix') return null
          return (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                activeFilter === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{config.icon}</span>
              {config.label[language]} ({count})
            </button>
          )
        })}
      </div>

      {/* Pending (Staging) Section */}
      <div className="mb-10">
        <CommitSection
          title={language === 'es' ? 'Próximamente' : 'Coming Soon'}
          icon="🚀"
          commits={filterCommits(pendingCommits)}
          language={language}
          timeAgo={timeAgo}
          emptyMessage={language === 'es'
            ? 'No hay cambios pendientes de deploy'
            : 'No pending changes to deploy'}
          accentColor="border-amber-500"
        />
        {filterCommits(pendingCommits).length > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 ml-5 flex items-center gap-2">
            <span className="animate-pulse">●</span>
            {language === 'es'
              ? 'Estos cambios están en staging y serán desplegados pronto'
              : 'These changes are in staging and will be deployed soon'}
          </p>
        )}
      </div>

      {/* Released (Production) Section */}
      <div>
        <CommitSection
          title={language === 'es' ? 'Lanzados' : 'Released'}
          icon="✅"
          commits={filterCommits(releasedCommits)}
          language={language}
          timeAgo={timeAgo}
          emptyMessage={language === 'es'
            ? 'No hay cambios recientes'
            : 'No recent changes'}
          accentColor="border-green-500"
        />
      </div>

      {/* Stats Footer */}
      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="text-amber-500">🚀</span>
            <span>{pendingCommits.length} {language === 'es' ? 'pendientes' : 'pending'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✅</span>
            <span>{releasedCommits.length} {language === 'es' ? 'lanzados' : 'released'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span>{filterCounts.feat || 0} features</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🐛</span>
            <span>{filterCounts.fix || 0} fixes</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Changelog

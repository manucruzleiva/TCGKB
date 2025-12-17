import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

// Parsed changelog data - this would ideally be generated from CHANGELOG.md
const changelogData = [
  {
    version: '1.5.0',
    date: '2024-12-17',
    sections: [
      {
        type: 'Added',
        items: [
          'Theme Transition Animation: Smooth sunrise/sunset fade effect when switching themes',
          'Language Morph Animation: Text morphing effect when changing languages',
          'Changelog Page: New changelog section with animated display',
          'Card Rotation Indicators: Yellow badge on cards about to rotate from Standard',
          'Rotation Tooltips: Hover to see rotation date and days remaining'
        ]
      },
      {
        type: 'Changed',
        items: [
          'Improved card mention chip rendering with regex-based parsing',
          'Updated rotation configuration for upcoming G mark rotation',
          'Enhanced comment display for ability mentions'
        ]
      },
      {
        type: 'Fixed',
        items: [
          'Fixed bracket display issue in comment mentions',
          'Fixed ability type detection for card mention chips',
          'Improved pattern matching for card mentions'
        ]
      }
    ]
  },
  {
    version: '1.4.0',
    date: '2024-12-16',
    sections: [
      {
        type: 'Added',
        items: [
          'Card Mention System: Type @ to mention cards in comments',
          'Ability Selection: Type . after card to choose attacks or abilities',
          'Card Mention Tooltips: Hover to see card image and details',
          'Alternate Arts Carousel: Navigate through different arts/reprints',
          'Alternate Arts Detection: Auto-detect reprints by matching data'
        ]
      },
      {
        type: 'Changed',
        items: [
          'Card mentions display as interactive chips',
          'Improved autocomplete with attacks and abilities',
          'Enhanced chip styling with gradients'
        ]
      }
    ]
  },
  {
    version: '1.3.0',
    date: '2024-12-15',
    sections: [
      {
        type: 'Added',
        items: [
          'Moderation Dashboard: Admin panel for managing content',
          'Comment Moderation: Moderate/restore comments with reasons',
          'User Management: View and manage user accounts',
          'Activity Analytics: Charts showing platform activity',
          'Comment Reactions: React to comments with emojis'
        ]
      }
    ]
  },
  {
    version: '1.2.0',
    date: '2024-12-14',
    sections: [
      {
        type: 'Added',
        items: [
          'Dark Mode: Full dark theme with system preference detection',
          'Language Support: English and Spanish translations',
          'Date Format Settings: Customizable date display',
          'User Settings Page: Centralized settings management'
        ]
      }
    ]
  },
  {
    version: '1.1.0',
    date: '2024-12-13',
    sections: [
      {
        type: 'Added',
        items: [
          'Comment System: Leave comments on cards',
          'Nested Replies: Threaded comment discussions',
          'User Authentication: Register and login',
          'Card Reactions: React to cards with emojis'
        ]
      }
    ]
  },
  {
    version: '1.0.0',
    date: '2024-12-12',
    sections: [
      {
        type: 'Added',
        items: [
          'Card Search: Search Pokemon TCG cards by name',
          'Card Details: View detailed card information',
          'Infinite Scroll: Load more cards seamlessly',
          'Card Images: High-quality images from Pokemon TCG API',
          'Responsive Design: Works on all devices'
        ]
      }
    ]
  }
]

const typeColors = {
  Added: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
  Changed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  Fixed: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
  Removed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
  Security: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700'
}

const typeIcons = {
  Added: '✨',
  Changed: '🔄',
  Fixed: '🐛',
  Removed: '🗑️',
  Security: '🔒'
}

const Changelog = () => {
  const { t } = useLanguage()
  const [visibleVersions, setVisibleVersions] = useState([])

  // Animate versions appearing one by one
  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleVersions(prev => {
        if (prev.length >= changelogData.length) {
          clearInterval(timer)
          return prev
        }
        return [...prev, changelogData[prev.length].version]
      })
    }, 150)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm mb-4 inline-block"
        >
          ← Volver al inicio
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Changelog
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Historial de cambios y actualizaciones del proyecto
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* Versions */}
        <div className="space-y-8">
          {changelogData.map((release, idx) => {
            const isVisible = visibleVersions.includes(release.version)

            return (
              <div
                key={release.version}
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

                {/* Version card */}
                <div className="card">
                  {/* Version header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xl font-bold ${
                          idx === 0
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        v{release.version}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full animate-pulse">
                          Última versión
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(release.date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Sections */}
                  <div className="space-y-4">
                    {release.sections.map((section, sIdx) => (
                      <div
                        key={section.type}
                        className={`transition-all duration-300`}
                        style={{
                          transitionDelay: isVisible ? `${sIdx * 100}ms` : '0ms'
                        }}
                      >
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium mb-2 border ${
                            typeColors[section.type]
                          }`}
                        >
                          <span>{typeIcons[section.type]}</span>
                          <span>{section.type}</span>
                        </div>

                        <ul className="space-y-1.5 ml-4">
                          {section.items.map((item, iIdx) => (
                            <li
                              key={iIdx}
                              className="text-gray-600 dark:text-gray-300 text-sm flex items-start gap-2"
                            >
                              <span className="text-gray-400 dark:text-gray-500 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
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
          Este changelog sigue el formato de{' '}
          <a
            href="https://keepachangelog.com/es-ES/1.0.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Keep a Changelog
          </a>
        </p>
      </div>
    </div>
  )
}

export default Changelog

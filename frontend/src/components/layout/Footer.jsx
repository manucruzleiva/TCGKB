import { useLanguage } from '../../contexts/LanguageContext'

const GITHUB_SPONSORS_URL = 'https://github.com/sponsors/manucruzleiva'

const Footer = () => {
  const { t, language } = useLanguage()

  // Injected at build time by Vite
  const commitHash = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev'
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null

  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>&copy; {currentYear} TCGKB</span>
            <a
              href="https://github.com/manucruzleiva/TCGKB"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <a
              href={GITHUB_SPONSORS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-600 dark:hover:text-pink-400 flex items-center gap-1 text-pink-500 dark:text-pink-400"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              {t('support.footerLink')}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 dark:text-gray-500">
              {language === 'es' ? 'Versión' : 'Version'}:
            </span>
            <a
              href={`https://github.com/manucruzleiva/TCGKB/commit/${commitHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title={buildTime ? `${language === 'es' ? 'Construido' : 'Built'}: ${new Date(buildTime).toLocaleString()}` : ''}
            >
              {commitHash}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

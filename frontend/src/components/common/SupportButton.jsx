import { useLanguage } from '../../contexts/LanguageContext'

const GITHUB_SPONSORS_URL = 'https://github.com/sponsors/manucruzleiva'

const SupportButton = () => {
  const { t } = useLanguage()

  const handleClick = () => {
    window.open(GITHUB_SPONSORS_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-[41] w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 flex items-center justify-center text-white group"
      title={t('support.buttonTooltip')}
      aria-label={t('support.buttonTooltip')}
    >
      <svg
        className="w-6 h-6 group-hover:scale-110 transition-transform"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </button>
  )
}

export default SupportButton

import { useLanguage } from '../../contexts/LanguageContext'
import { languages } from '../../i18n'

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage()

  const currentLanguage = languages.find(lang => lang.code === language)
  const nextLanguage = languages.find(lang => lang.code !== language)

  const toggleLanguage = () => {
    if (nextLanguage) {
      changeLanguage(nextLanguage.code)
    }
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all shadow-sm"
      aria-label={`Switch to ${nextLanguage?.name}`}
      title={`Switch to ${nextLanguage?.name}`}
    >
      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
        {currentLanguage?.code.toUpperCase()}
      </span>
    </button>
  )
}

export default LanguageSwitcher

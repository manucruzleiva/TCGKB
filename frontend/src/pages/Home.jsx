import { useLanguage } from '../contexts/LanguageContext'
import KPIDashboard from '../components/dashboard/KPIDashboard'

const Home = () => {
  const { t } = useLanguage()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">{t('pages.home.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('pages.home.subtitle')}
        </p>
      </div>

      <KPIDashboard />
    </div>
  )
}

export default Home

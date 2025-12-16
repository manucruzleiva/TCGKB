import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import CardSearch from '../components/cards/CardSearch'
import CardGrid from '../components/cards/CardGrid'

const Home = () => {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [cancelSearch, setCancelSearch] = useState(null)

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleLoadingChange = (loading) => {
    setIsSearching(loading)
  }

  const handleCancelAvailable = (cancelFn) => {
    setCancelSearch(() => cancelFn)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">{t('pages.home.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('pages.home.subtitle')}
        </p>
      </div>

      <CardSearch
        onSearch={handleSearch}
        loading={isSearching}
        onCancel={cancelSearch}
      />

      <CardGrid
        searchTerm={searchTerm}
        onLoadingChange={handleLoadingChange}
        onCancelAvailable={handleCancelAvailable}
      />
    </div>
  )
}

export default Home

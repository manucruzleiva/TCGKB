import { useLanguage } from '../contexts/LanguageContext'

const GITHUB_SPONSORS_URL = 'https://github.com/sponsors/manucruzleiva'
const GITHUB_SPONSORS_ONE_TIME_URL = 'https://github.com/sponsors/manucruzleiva?frequency=one-time'

const Support = () => {
  const { t } = useLanguage()

  const handleSponsorClick = () => {
    window.open(GITHUB_SPONSORS_URL, '_blank', 'noopener,noreferrer')
  }

  const handleOneTimeClick = () => {
    window.open(GITHUB_SPONSORS_ONE_TIME_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 mb-6">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('support.pageTitle')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {t('support.pageSubtitle')}
        </p>
      </div>

      {/* Why Support Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('support.whySupport.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-2xl">🖥️</span>
            <span className="text-gray-700 dark:text-gray-300">{t('support.whySupport.reason1')}</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-2xl">✨</span>
            <span className="text-gray-700 dark:text-gray-300">{t('support.whySupport.reason2')}</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-2xl">📊</span>
            <span className="text-gray-700 dark:text-gray-300">{t('support.whySupport.reason3')}</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-2xl">🚫</span>
            <span className="text-gray-700 dark:text-gray-300">{t('support.whySupport.reason4')}</span>
          </div>
        </div>
      </div>

      {/* Monthly Costs Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('support.costs.title')}
        </h2>
        <div className="space-y-4">
          <CostItem label={t('support.costs.hosting')} amount={20} max={45} />
          <CostItem label={t('support.costs.database')} amount={15} max={45} />
          <CostItem label={t('support.costs.apis')} amount={5} max={45} />
          <CostItem label={t('support.costs.domain')} amount={5} max={45} />
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('support.costs.total')}
              </span>
              <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                ~$45/mes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {t('support.tiers.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Supporter Tier */}
          <TierCard
            name={t('support.tiers.supporter.name')}
            price={t('support.tiers.supporter.price')}
            benefits={[
              t('support.tiers.supporter.benefit1'),
              t('support.tiers.supporter.benefit2')
            ]}
            onClick={handleSponsorClick}
            ctaText={t('support.footerLink')}
          />

          {/* Champion Tier - Featured */}
          <TierCard
            name={t('support.tiers.champion.name')}
            price={t('support.tiers.champion.price')}
            benefits={[
              t('support.tiers.champion.benefit1'),
              t('support.tiers.champion.benefit2'),
              t('support.tiers.champion.benefit3')
            ]}
            onClick={handleSponsorClick}
            ctaText={t('support.footerLink')}
            featured
          />

          {/* Hero Tier */}
          <TierCard
            name={t('support.tiers.hero.name')}
            price={t('support.tiers.hero.price')}
            benefits={[
              t('support.tiers.hero.benefit1'),
              t('support.tiers.hero.benefit2'),
              t('support.tiers.hero.benefit3')
            ]}
            onClick={handleSponsorClick}
            ctaText={t('support.footerLink')}
          />
        </div>
      </div>

      {/* Main CTA */}
      <div className="text-center mb-8">
        <button
          onClick={handleSponsorClick}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          {t('support.cta.primary')}
        </button>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          <button
            onClick={handleOneTimeClick}
            className="hover:text-pink-600 dark:hover:text-pink-400 underline underline-offset-2"
          >
            {t('support.cta.oneTime')}
          </button>
        </p>
      </div>

      {/* Thanks Section */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('support.thanks.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('support.thanks.description')}
        </p>
        <div className="mt-6 flex justify-center">
          <div className="flex -space-x-2">
            {/* Placeholder avatars - will be replaced with real supporters in Phase 2 */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-sm font-bold">?</div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-sm font-bold">?</div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-sm font-bold">?</div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-sm font-bold">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Cost Item Component
const CostItem = ({ label, amount, max }) => {
  const percentage = (amount / max) * 100

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-700 dark:text-gray-300 w-48 shrink-0">{label}</span>
      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-gray-900 dark:text-white font-semibold w-16 text-right">${amount}</span>
    </div>
  )
}

// Tier Card Component
const TierCard = ({ name, price, benefits, onClick, ctaText, featured = false }) => {
  return (
    <div
      className={`relative rounded-xl p-6 ${
        featured
          ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-xl scale-105'
          : 'bg-white dark:bg-gray-800 shadow-lg'
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
            Popular
          </span>
        </div>
      )}
      <h3 className={`text-xl font-bold mb-2 ${featured ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
        {name}
      </h3>
      <p className={`text-3xl font-bold mb-4 ${featured ? 'text-white' : 'text-pink-600 dark:text-pink-400'}`}>
        {price}
      </p>
      <ul className="space-y-2 mb-6">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center gap-2">
            <svg
              className={`w-5 h-5 shrink-0 ${featured ? 'text-white' : 'text-green-500'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className={featured ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}>
              {benefit}
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
          featured
            ? 'bg-white text-pink-600 hover:bg-gray-100'
            : 'bg-pink-600 text-white hover:bg-pink-700'
        }`}
      >
        {ctaText}
      </button>
    </div>
  )
}

export default Support

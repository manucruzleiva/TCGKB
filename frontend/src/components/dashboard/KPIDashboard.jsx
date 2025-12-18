import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../services/api'

const KPIDashboard = () => {
  const { t, language } = useLanguage()
  const [stats, setStats] = useState({
    totalCards: 0,
    totalComments: 0,
    totalReactions: 0,
    totalUsers: 0
  })
  const [detailedStats, setDetailedStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState(null)
  const [hoverCard, setHoverCard] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [basicResponse, detailedResponse] = await Promise.all([
          api.get('/stats'),
          api.get('/stats/detailed')
        ])

        if (basicResponse.data.success) {
          setStats(basicResponse.data.data)
        }

        if (detailedResponse.data.success) {
          setDetailedStats(detailedResponse.data.data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
        setStats({
          totalCards: 0,
          totalComments: 0,
          totalReactions: 0,
          totalUsers: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const toggleCard = (cardType) => {
    setExpandedCard(expandedCard === cardType ? null : cardType)
  }

  const renderDetailedContent = (cardType) => {
    if (!detailedStats) return null

    if (cardType === 'comments') {
      return (
        <div className="mt-4 pt-4 border-t border-purple-300 dark:border-purple-700">
          <h4 className="font-semibold text-sm mb-3 text-purple-900 dark:text-purple-100">
            {language === 'es' ? 'Distribución de Comentarios' : 'Comment Distribution'}
          </h4>

          <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
            {Object.entries(detailedStats.commentDistribution).length > 0 ? (
              Object.entries(detailedStats.commentDistribution)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([commentCount, cardCount]) => (
                  <div key={commentCount} className="flex justify-between items-center">
                    <span className="text-purple-800 dark:text-purple-200">
                      {commentCount} {language === 'es' ? 'comentario(s)' : 'comment(s)'}
                    </span>
                    <span className="font-semibold text-purple-900 dark:text-purple-100">
                      {cardCount} {language === 'es' ? 'cartas' : 'cards'}
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-purple-700 dark:text-purple-300 text-xs italic">
                {language === 'es' ? 'Sin comentarios aún' : 'No comments yet'}
              </p>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
            <div className="flex justify-between text-xs">
              <span className="text-purple-700 dark:text-purple-300">
                {language === 'es' ? 'Cartas con comentarios:' : 'Cards with comments:'}
              </span>
              <span className="font-semibold text-purple-900 dark:text-purple-100">
                {detailedStats.commentStats?.cardsWithComments || 0}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-purple-700 dark:text-purple-300">
                {language === 'es' ? 'Cartas sin comentarios:' : 'Cards without comments:'}
              </span>
              <span className="font-semibold text-purple-900 dark:text-purple-100">
                {detailedStats.commentStats?.cardsWithoutComments || 0}
              </span>
            </div>
          </div>
        </div>
      )
    }

    if (cardType === 'reactions') {
      return (
        <div className="mt-4 pt-4 border-t border-pink-300 dark:border-pink-700">
          <h4 className="font-semibold text-sm mb-3 text-pink-900 dark:text-pink-100">
            {language === 'es' ? 'Desglose de Reacciones' : 'Reaction Breakdown'}
          </h4>

          <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
            {Object.entries(detailedStats.reactionBreakdown).length > 0 ? (
              Object.entries(detailedStats.reactionBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([emoji, count]) => (
                  <div key={emoji} className="flex justify-between items-center">
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-semibold text-pink-900 dark:text-pink-100">
                      {count} {language === 'es' ? 'reacciones' : 'reactions'}
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-pink-700 dark:text-pink-300 text-xs italic">
                {language === 'es' ? 'Sin reacciones aún' : 'No reactions yet'}
              </p>
            )}
          </div>
        </div>
      )
    }

    if (cardType === 'users') {
      const userCats = detailedStats.userCategories
      return (
        <div className="mt-4 pt-4 border-t border-indigo-300 dark:border-indigo-700">
          <h4 className="font-semibold text-sm mb-3 text-indigo-900 dark:text-indigo-100">
            {language === 'es' ? 'Categorías de Usuarios' : 'User Categories'}
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>🟢</span>
                <span className="text-indigo-800 dark:text-indigo-200">
                  {language === 'es' ? 'Usuarios Activos' : 'Active Users'}
                </span>
              </div>
              <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                {userCats?.active || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>⚪</span>
                <span className="text-indigo-800 dark:text-indigo-200">
                  {language === 'es' ? 'Usuarios Inactivos' : 'Inactive Users'}
                </span>
              </div>
              <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                {userCats?.inactive || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>👑</span>
                <span className="text-indigo-800 dark:text-indigo-200">
                  {language === 'es' ? 'Moderadores' : 'Moderators'}
                </span>
              </div>
              <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                {userCats?.admins || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>💻</span>
                <span className="text-indigo-800 dark:text-indigo-200">
                  {language === 'es' ? 'Desarrolladores' : 'Developers'}
                </span>
              </div>
              <span className="font-semibold text-indigo-900 dark:text-indigo-100">
                {userCats?.devs || 0}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
            {language === 'es'
              ? '* Activos: actividad en los últimos 30 días'
              : '* Active: activity in the last 30 days'}
          </div>
        </div>
      )
    }

    return null
  }

  const tcgSystems = [
    {
      name: 'Pokemon TCG',
      status: 'completed',
      icon: '⚡',
      color: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700',
      textColor: 'text-green-800 dark:text-green-200'
    },
    {
      name: 'Rifbound',
      status: 'in-progress',
      icon: '🎴',
      color: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700',
      textColor: 'text-yellow-800 dark:text-yellow-200'
    }
  ]

  const kpiCards = [
    {
      type: 'cards',
      label: language === 'es' ? 'Total de Cartas' : 'Total Cards',
      value: stats.totalCards,
      icon: '🃏',
      color: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-800 dark:text-blue-200',
      hasDetails: false
    },
    {
      type: 'comments',
      label: language === 'es' ? 'Comentarios' : 'Comments',
      value: stats.totalComments,
      icon: '💬',
      color: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-800 dark:text-purple-200',
      hasDetails: true
    },
    {
      type: 'reactions',
      label: language === 'es' ? 'Reacciones' : 'Reactions',
      value: stats.totalReactions,
      icon: '😀',
      color: 'bg-pink-100 dark:bg-pink-900',
      textColor: 'text-pink-800 dark:text-pink-200',
      hasDetails: true
    },
    {
      type: 'users',
      label: language === 'es' ? 'Usuarios' : 'Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-indigo-100 dark:bg-indigo-900',
      textColor: 'text-indigo-800 dark:text-indigo-200',
      hasDetails: true
    }
  ]

  if (loading) {
    return (
      <div className="mb-8">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      {/* TCG Systems Status */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          {language === 'es' ? 'Sistemas TCG' : 'TCG Systems'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tcgSystems.map((tcg) => (
            <div
              key={tcg.name}
              className={`${tcg.color} border-2 rounded-lg p-4 transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tcg.icon}</span>
                  <div>
                    <h3 className={`font-semibold ${tcg.textColor}`}>{tcg.name}</h3>
                    <p className={`text-sm ${tcg.textColor}`}>
                      {tcg.status === 'completed'
                        ? (language === 'es' ? '✅ Completado' : '✅ Completed')
                        : (language === 'es' ? '🚧 En progreso' : '🚧 In Progress')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards with Expandable Details */}
      <div>
        <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          {language === 'es' ? 'Estadísticas del MVP' : 'MVP Statistics'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {language === 'es'
            ? '💡 Haz clic para ver detalles permanentemente, o pasa el cursor para vista previa'
            : '💡 Click to toggle details, or hover for preview'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.type}
              className={`${kpi.color} rounded-lg p-5 transition-all duration-200 ${
                kpi.hasDetails ? 'cursor-pointer hover:shadow-lg' : ''
              } ${expandedCard === kpi.type || hoverCard === kpi.type ? 'shadow-xl' : 'hover:shadow-md hover:scale-105'}`}
              onClick={() => kpi.hasDetails && toggleCard(kpi.type)}
              onMouseEnter={() => kpi.hasDetails && !expandedCard && setHoverCard(kpi.type)}
              onMouseLeave={() => setHoverCard(null)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{kpi.icon}</span>
                <span className={`text-3xl font-bold ${kpi.textColor}`}>
                  {kpi.value.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${kpi.textColor}`}>
                  {kpi.label}
                </p>
                {kpi.hasDetails && (
                  <button
                    className={`text-xs ${kpi.textColor} opacity-70 hover:opacity-100 transition-opacity`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCard(kpi.type)
                    }}
                  >
                    {expandedCard === kpi.type ? '▲' : '▼'}
                  </button>
                )}
              </div>

              {/* Show details when expanded or hovered */}
              {kpi.hasDetails && (expandedCard === kpi.type || hoverCard === kpi.type) && (
                <div className="animate-fadeIn">
                  {renderDetailedContent(kpi.type)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default KPIDashboard

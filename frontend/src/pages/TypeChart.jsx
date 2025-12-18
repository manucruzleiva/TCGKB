import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

// Pokemon TCG Type data with weaknesses and resistances
const TYPE_DATA = {
  Fire: {
    emoji: '🔥',
    color: 'bg-red-500',
    lightColor: 'bg-red-100 dark:bg-red-900/50',
    textColor: 'text-red-700 dark:text-red-300',
    weakTo: ['Water'],
    resistantTo: []
  },
  Water: {
    emoji: '💧',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100 dark:bg-blue-900/50',
    textColor: 'text-blue-700 dark:text-blue-300',
    weakTo: ['Lightning'],
    resistantTo: []
  },
  Grass: {
    emoji: '🌿',
    color: 'bg-green-500',
    lightColor: 'bg-green-100 dark:bg-green-900/50',
    textColor: 'text-green-700 dark:text-green-300',
    weakTo: ['Fire'],
    resistantTo: ['Water']
  },
  Lightning: {
    emoji: '⚡',
    color: 'bg-yellow-400',
    lightColor: 'bg-yellow-100 dark:bg-yellow-900/50',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    weakTo: ['Fighting'],
    resistantTo: ['Metal']
  },
  Psychic: {
    emoji: '🔮',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-100 dark:bg-purple-900/50',
    textColor: 'text-purple-700 dark:text-purple-300',
    weakTo: ['Darkness'],
    resistantTo: ['Fighting']
  },
  Fighting: {
    emoji: '👊',
    color: 'bg-orange-600',
    lightColor: 'bg-orange-100 dark:bg-orange-900/50',
    textColor: 'text-orange-700 dark:text-orange-300',
    weakTo: ['Psychic'],
    resistantTo: []
  },
  Darkness: {
    emoji: '🌙',
    color: 'bg-gray-800',
    lightColor: 'bg-gray-200 dark:bg-gray-700',
    textColor: 'text-gray-800 dark:text-gray-200',
    weakTo: ['Fighting'],
    resistantTo: ['Psychic']
  },
  Metal: {
    emoji: '⚙️',
    color: 'bg-gray-400',
    lightColor: 'bg-gray-100 dark:bg-gray-600',
    textColor: 'text-gray-700 dark:text-gray-200',
    weakTo: ['Fire'],
    resistantTo: ['Grass', 'Psychic']
  },
  Dragon: {
    emoji: '🐉',
    color: 'bg-indigo-600',
    lightColor: 'bg-indigo-100 dark:bg-indigo-900/50',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    weakTo: ['Dragon'],
    resistantTo: []
  },
  Colorless: {
    emoji: '⭐',
    color: 'bg-gray-300',
    lightColor: 'bg-gray-50 dark:bg-gray-700',
    textColor: 'text-gray-600 dark:text-gray-300',
    weakTo: ['Fighting'],
    resistantTo: []
  }
}

const TYPES = Object.keys(TYPE_DATA)

const TypeChart = () => {
  const { language } = useLanguage()
  const [selectedType, setSelectedType] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'

  const t = {
    title: { es: 'Tabla de Tipos', en: 'Type Chart' },
    subtitle: { es: 'Debilidades y Resistencias en Pokemon TCG', en: 'Weaknesses and Resistances in Pokemon TCG' },
    weakTo: { es: 'Débil contra', en: 'Weak to' },
    resistantTo: { es: 'Resistente a', en: 'Resistant to' },
    none: { es: 'Ninguno', en: 'None' },
    selectType: { es: 'Selecciona un tipo para ver detalles', en: 'Select a type to see details' },
    strongAgainst: { es: 'Fuerte contra', en: 'Strong against' },
    resistedBy: { es: 'Resistido por', en: 'Resisted by' },
    gridView: { es: 'Vista Cuadrícula', en: 'Grid View' },
    tableView: { es: 'Vista Tabla', en: 'Table View' },
    attacker: { es: 'Atacante', en: 'Attacker' },
    defender: { es: 'Defensor', en: 'Defender' },
    superEffective: { es: 'Super Efectivo (×2)', en: 'Super Effective (×2)' },
    notVeryEffective: { es: 'Poco Efectivo (×0.5)', en: 'Not Very Effective (×0.5)' },
    normal: { es: 'Normal (×1)', en: 'Normal (×1)' }
  }

  // Calculate what types this type is strong against
  const getStrongAgainst = (typeName) => {
    return TYPES.filter(t => TYPE_DATA[t].weakTo.includes(typeName))
  }

  // Calculate what types resist this type
  const getResistedBy = (typeName) => {
    return TYPES.filter(t => TYPE_DATA[t].resistantTo.includes(typeName))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t.title[language]}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.subtitle[language]}
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'grid'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {t.gridView[language]}
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'table'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {t.tableView[language]}
        </button>
      </div>

      {viewMode === 'grid' ? (
        <>
          {/* Type Selection Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-8">
            {TYPES.map(typeName => {
              const type = TYPE_DATA[typeName]
              const isSelected = selectedType === typeName
              return (
                <button
                  key={typeName}
                  onClick={() => setSelectedType(isSelected ? null : typeName)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                    isSelected
                      ? `${type.color} text-white shadow-lg scale-105`
                      : `${type.lightColor} ${type.textColor} hover:scale-105`
                  }`}
                >
                  <span className="text-2xl">{type.emoji}</span>
                  <span className="text-xs font-medium">{typeName}</span>
                </button>
              )
            })}
          </div>

          {/* Selected Type Details */}
          {selectedType ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 ${TYPE_DATA[selectedType].color} rounded-full flex items-center justify-center text-3xl`}>
                  {TYPE_DATA[selectedType].emoji}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedType}</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'es' ? 'Tipo Pokemon TCG' : 'Pokemon TCG Type'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Weaknesses (Takes 2x damage from) */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    {t.weakTo[language]}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_DATA[selectedType].weakTo.length > 0 ? (
                      TYPE_DATA[selectedType].weakTo.map(weakType => (
                        <span
                          key={weakType}
                          className={`px-3 py-1.5 rounded-full ${TYPE_DATA[weakType].lightColor} ${TYPE_DATA[weakType].textColor} text-sm font-medium flex items-center gap-1`}
                        >
                          <span>{TYPE_DATA[weakType].emoji}</span>
                          {weakType}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">{t.none[language]}</span>
                    )}
                  </div>
                </div>

                {/* Resistances (Takes 0.5x damage from) */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">🛡️</span>
                    {t.resistantTo[language]}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_DATA[selectedType].resistantTo.length > 0 ? (
                      TYPE_DATA[selectedType].resistantTo.map(resistType => (
                        <span
                          key={resistType}
                          className={`px-3 py-1.5 rounded-full ${TYPE_DATA[resistType].lightColor} ${TYPE_DATA[resistType].textColor} text-sm font-medium flex items-center gap-1`}
                        >
                          <span>{TYPE_DATA[resistType].emoji}</span>
                          {resistType}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">{t.none[language]}</span>
                    )}
                  </div>
                </div>

                {/* Strong Against (Deals 2x to) */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">⚔️</span>
                    {t.strongAgainst[language]}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getStrongAgainst(selectedType).length > 0 ? (
                      getStrongAgainst(selectedType).map(strongType => (
                        <span
                          key={strongType}
                          className={`px-3 py-1.5 rounded-full ${TYPE_DATA[strongType].lightColor} ${TYPE_DATA[strongType].textColor} text-sm font-medium flex items-center gap-1`}
                        >
                          <span>{TYPE_DATA[strongType].emoji}</span>
                          {strongType}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">{t.none[language]}</span>
                    )}
                  </div>
                </div>

                {/* Resisted By (Deals 0.5x to) */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">🔰</span>
                    {t.resistedBy[language]}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {getResistedBy(selectedType).length > 0 ? (
                      getResistedBy(selectedType).map(resistedType => (
                        <span
                          key={resistedType}
                          className={`px-3 py-1.5 rounded-full ${TYPE_DATA[resistedType].lightColor} ${TYPE_DATA[resistedType].textColor} text-sm font-medium flex items-center gap-1`}
                        >
                          <span>{TYPE_DATA[resistedType].emoji}</span>
                          {resistedType}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">{t.none[language]}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">{t.selectType[language]}</p>
            </div>
          )}
        </>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-4 h-4 rounded bg-red-500"></span>
              <span className="text-gray-700 dark:text-gray-300">{t.superEffective[language]}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-4 h-4 rounded bg-green-500"></span>
              <span className="text-gray-700 dark:text-gray-300">{t.notVeryEffective[language]}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-600"></span>
              <span className="text-gray-700 dark:text-gray-300">{t.normal[language]}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-gray-100 dark:bg-gray-700 p-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {t.attacker[language]} →<br/>{t.defender[language]} ↓
                  </th>
                  {TYPES.map(typeName => (
                    <th key={typeName} className="p-2 text-center bg-gray-100 dark:bg-gray-700">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">{TYPE_DATA[typeName].emoji}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">{typeName.slice(0, 3)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TYPES.map(defenderType => (
                  <tr key={defenderType} className="border-t border-gray-200 dark:border-gray-600">
                    <td className="sticky left-0 bg-white dark:bg-gray-800 p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{TYPE_DATA[defenderType].emoji}</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{defenderType}</span>
                      </div>
                    </td>
                    {TYPES.map(attackerType => {
                      const isWeak = TYPE_DATA[defenderType].weakTo.includes(attackerType)
                      const isResistant = TYPE_DATA[defenderType].resistantTo.includes(attackerType)

                      let cellClass = 'bg-gray-50 dark:bg-gray-800'
                      let cellContent = ''

                      if (isWeak) {
                        cellClass = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold'
                        cellContent = '×2'
                      } else if (isResistant) {
                        cellClass = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold'
                        cellContent = '×½'
                      }

                      return (
                        <td key={attackerType} className={`p-2 text-center text-xs ${cellClass}`}>
                          {cellContent}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          {language === 'es' ? 'Sobre las debilidades en Pokemon TCG' : 'About weaknesses in Pokemon TCG'}
        </h3>
        <p className="text-blue-700 dark:text-blue-400 text-sm">
          {language === 'es'
            ? 'En el Pokemon TCG, la mayoría de los Pokemon tienen una debilidad que duplica (×2) el daño recibido de ese tipo. Algunos Pokemon también tienen resistencias que reducen el daño. Las resistencias modernas típicamente reducen -30 puntos de daño.'
            : 'In the Pokemon TCG, most Pokemon have a weakness that doubles (×2) damage taken from that type. Some Pokemon also have resistances that reduce damage. Modern resistances typically reduce -30 damage points.'}
        </p>
      </div>
    </div>
  )
}

export default TypeChart

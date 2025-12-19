import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { deckService } from '../../services/deckService'
import Spinner from '../common/Spinner'
import DeckValidationIndicator from './DeckValidationIndicator'

/**
 * DeckImportModal - Modal for importing decks with auto-detection
 */
const DeckImportModal = ({ isOpen, onClose, onImport }) => {
  const { t, language } = useLanguage()

  const [deckText, setDeckText] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)

  // Debounced parse effect
  useEffect(() => {
    if (!deckText.trim()) {
      setParseResult(null)
      setParseError(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setParsing(true)
        setParseError(null)
        const response = await deckService.parseDeck(deckText)

        if (response.success) {
          setParseResult(response.data)
        } else {
          setParseError(response.message || t('deckImport.parseError'))
          setParseResult(null)
        }
      } catch (error) {
        setParseError(error.response?.data?.message || t('deckImport.parseError'))
        setParseResult(null)
      } finally {
        setParsing(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [deckText, t])

  const handleImport = async () => {
    if (!parseResult || parseResult.cards.length === 0) return

    try {
      setImporting(true)
      onImport({
        cards: parseResult.cards,
        tcg: parseResult.tcg,
        format: parseResult.format,
        breakdown: parseResult.breakdown,
        stats: parseResult.stats
      })
      handleClose()
    } catch (error) {
      setParseError(t('deckImport.importError'))
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setDeckText('')
    setParseResult(null)
    setParseError(null)
    onClose()
  }

  const tcgLabels = { pokemon: 'Pokemon', riftbound: 'Riftbound' }

  const formatLabels = {
    standard: { es: 'Estándar', en: 'Standard' },
    expanded: { es: 'Expandido', en: 'Expanded' },
    glc: { es: 'GLC', en: 'GLC' },
    constructed: { es: 'Constructed', en: 'Constructed' }
  }

  const inputFormatLabels = {
    'pokemon-tcg-live': 'Pokemon TCG Live',
    'pokemon-tcg-pocket': 'Pokemon TCG Pocket',
    'riftbound': 'Riftbound',
    'generic': language === 'es' ? 'Genérico' : 'Generic'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t('deckImport.title')}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('deckImport.instructions')}</p>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={deckText}
              onChange={(e) => setDeckText(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm resize-none"
              placeholder={t('deckImport.placeholder')}
            />
            {parsing && <div className="absolute right-3 top-3"><Spinner size="sm" /></div>}
          </div>

          {/* Error */}
          {parseError && (
            <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {parseError}
            </div>
          )}

          {/* Preview */}
          {parseResult && (
            <div className="space-y-4">
              {/* Detection badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {tcgLabels[parseResult.tcg] || parseResult.tcg}
                </span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium">
                  {formatLabels[parseResult.format]?.[language] || parseResult.format}
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                  {inputFormatLabels[parseResult.inputFormat] || parseResult.inputFormat}
                </span>
                {parseResult.formatConfidence && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({parseResult.formatConfidence}% {t('deckImport.confidence')})
                  </span>
                )}
              </div>

              {/* Stats preview */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t('deckImport.preview')}: {parseResult.stats.totalCards} {t('deckImport.cards')}
                </h3>

                {/* Pokemon breakdown */}
                {parseResult.tcg === 'pokemon' && parseResult.breakdown && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('deckImport.pokemon')}: {parseResult.breakdown.pokemon || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-500"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('deckImport.trainer')}: {parseResult.breakdown.trainer || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('deckImport.energy')}: {parseResult.breakdown.energy || 0}
                      </span>
                    </div>
                    {parseResult.breakdown.unknown > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-400"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('deckImport.unknown')}: {parseResult.breakdown.unknown}
                        </span>
                      </div>
                    )}

                    {/* Visual bar */}
                    {parseResult.stats.totalCards > 0 && (
                      <div className="mt-2 h-3 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-600">
                        {parseResult.breakdown.pokemon > 0 && (
                          <div className="bg-blue-500" style={{ width: `${(parseResult.breakdown.pokemon / parseResult.stats.totalCards) * 100}%` }} />
                        )}
                        {parseResult.breakdown.trainer > 0 && (
                          <div className="bg-purple-500" style={{ width: `${(parseResult.breakdown.trainer / parseResult.stats.totalCards) * 100}%` }} />
                        )}
                        {parseResult.breakdown.energy > 0 && (
                          <div className="bg-yellow-500" style={{ width: `${(parseResult.breakdown.energy / parseResult.stats.totalCards) * 100}%` }} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Riftbound breakdown */}
                {parseResult.tcg === 'riftbound' && parseResult.breakdown && (
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div>Main Deck: {parseResult.breakdown.mainDeck || 0}</div>
                    <div>Legend: {parseResult.breakdown.legend || 0}</div>
                    <div>Battlefield: {parseResult.breakdown.battlefield || 0}</div>
                    <div>Rune: {parseResult.breakdown.rune || 0}</div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {parseResult.stats.uniqueCards} {t('deckImport.uniqueCards')}
                  </span>
                </div>
              </div>

              {/* Validation status */}
              {parseResult.validation && (
                <DeckValidationIndicator
                  validation={parseResult.validation}
                  format={parseResult.format}
                />
              )}

              {/* Parse warnings */}
              {parseResult.errors?.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    {t('deckImport.parseWarnings')}
                  </h4>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                    {parseResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>• {err.line}: {err.error}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>... +{parseResult.errors.length - 5} {t('deckImport.more')}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={importing}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={!parseResult || parseResult.cards.length === 0 || importing || parsing}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {importing && <Spinner size="sm" />}
            {importing ? t('deckImport.importing') : t('deckImport.importButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeckImportModal

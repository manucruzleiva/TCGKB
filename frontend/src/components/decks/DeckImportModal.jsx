import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { deckService } from '../../services/deckService'
import Spinner from '../common/Spinner'
import DeckValidationIndicator from './DeckValidationIndicator'
import DeckAutoTags from './DeckAutoTags'

/**
 * DeckImportModal - Modal for importing decks with auto-detection
 *
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Called when modal is closed
 * - onImport: function - Called with parsed data (for replace mode in DeckBuilder)
 * - mode: 'import' | 'create' - 'import' replaces current deck, 'create' creates new deck
 * - onCreateDeck: function - Called with {name, cards, tcg, format} (for create mode in DeckList)
 */
const DeckImportModal = ({ isOpen, onClose, onImport, mode = 'import', onCreateDeck }) => {
  const { t, language } = useLanguage()

  const [deckText, setDeckText] = useState('')
  const [deckName, setDeckName] = useState('') // For create mode
  const [parseResult, setParseResult] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [showReprintGroups, setShowReprintGroups] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState(null) // null = auto-detect

  // Debounced parse effect - re-parses when deck text or selected format changes
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
        const response = await deckService.parseDeck(deckText, selectedFormat)

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
  }, [deckText, selectedFormat, t])

  // Handle format change
  const handleFormatChange = (newFormat) => {
    setSelectedFormat(newFormat === 'auto' ? null : newFormat)
  }

  const handleImport = async () => {
    if (!parseResult || !parseResult.cards || parseResult.cards.length === 0) return

    try {
      setImporting(true)

      if (mode === 'create' && onCreateDeck) {
        // Create mode: call onCreateDeck with name and parsed data
        const name = deckName.trim() || (language === 'es' ? 'Mazo sin título' : 'Untitled Deck')
        await onCreateDeck({
          name,
          cards: parseResult.cards,
          tcg: parseResult.tcg,
          format: parseResult.format,
          importString: deckText // Also pass raw string for backend storage
        })
      } else if (onImport) {
        // Import mode: call onImport with parsed data (replaces current deck)
        onImport({
          cards: parseResult.cards,
          tcg: parseResult.tcg,
          format: parseResult.format,
          breakdown: parseResult.breakdown,
          stats: parseResult.stats
        })
      }
      handleClose()
    } catch (error) {
      setParseError(error.message || t('deckImport.importError'))
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setDeckText('')
    setDeckName('')
    setParseResult(null)
    setParseError(null)
    setSelectedFormat(null)
    onClose()
  }

  // Available formats based on TCG
  const getAvailableFormats = (tcg) => {
    if (tcg === 'riftbound') {
      return [{ value: 'constructed', label: 'Constructed' }]
    }
    return [
      { value: 'standard', label: language === 'es' ? 'Estándar' : 'Standard' },
      { value: 'expanded', label: language === 'es' ? 'Expandido' : 'Expanded' },
      { value: 'glc', label: 'GLC' }
    ]
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

          {/* Deck Name - only in create mode */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === 'es' ? 'Nombre del mazo' : 'Deck Name'}
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder={language === 'es' ? 'Ej: Mi Charizard ex' : 'E.g.: My Charizard ex'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

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
              {/* Detection badges with format selector */}
              <div className="flex flex-wrap items-center gap-2">
                {/* TCG Badge with confidence */}
                <div className="flex items-center gap-1.5">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    {tcgLabels[parseResult.tcg] || parseResult.tcg}
                  </span>
                  {parseResult.tcgConfidence && (
                    <span className="text-xs text-gray-500 dark:text-gray-400" title={parseResult.tcgReasons?.join(', ')}>
                      {parseResult.tcgConfidence}%
                    </span>
                  )}
                </div>

                {/* Format Selector */}
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedFormat || 'auto'}
                    onChange={(e) => handleFormatChange(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium border-0 cursor-pointer focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="auto">
                      {parseResult.format
                        ? `${formatLabels[parseResult.format]?.[language] || parseResult.format} (${t('deckImport.autoDetected')})`
                        : t('deckImport.autoDetect')
                      }
                    </option>
                    {getAvailableFormats(parseResult.tcg).map(fmt => (
                      <option key={fmt.value} value={fmt.value}>
                        {fmt.label}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-2 w-4 h-4 text-purple-600 dark:text-purple-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Format confidence */}
                {parseResult.formatConfidence && (
                  <span className="text-xs text-gray-500 dark:text-gray-400" title={parseResult.formatReason}>
                    {parseResult.formatConfidence}%
                  </span>
                )}

                {/* Input format badge */}
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                  {inputFormatLabels[parseResult.inputFormat] || parseResult.inputFormat}
                </span>

                {/* Input validation badge */}
                {parseResult?.inputValidation && typeof parseResult.inputValidation.isValid !== 'undefined' && (
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    parseResult.inputValidation.isValid === true
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                  }`} title={parseResult.inputValidation.isValid === true ? 'Input format valid' : `${parseResult.inputValidation.errors?.length || 0} validation errors`}>
                    {parseResult.inputValidation.isValid === true ? '✓ Valid Input' : `⚠ ${parseResult.inputValidation.errors?.length || 0} errors`}
                  </span>
                )}
              </div>

              {/* TCG Detection Reasons (NEW) */}
              {parseResult.tcgReasons && parseResult.tcgReasons.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    {language === 'es' ? 'Detección de TCG' : 'TCG Detection'}
                  </h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    {parseResult.tcgReasons.map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                  {parseResult.formatReason && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      <strong>{language === 'es' ? 'Formato:' : 'Format:'}</strong> {parseResult.formatReason}
                    </p>
                  )}
                </div>
              )}

              {/* Input Validation Errors (NEW) */}
              {parseResult?.inputValidation && parseResult.inputValidation.isValid === false && parseResult.inputValidation.errors?.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    {language === 'es' ? 'Errores de formato de entrada' : 'Input Format Errors'}
                  </h4>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                    {parseResult.inputValidation.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx} className="font-mono">
                        {err.line ? `"${err.line}": ${err.error}` : err.error}
                      </li>
                    ))}
                    {parseResult.inputValidation.errors.length > 5 && (
                      <li>... +{parseResult.inputValidation.errors.length - 5} {t('deckImport.more')}</li>
                    )}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800 text-xs text-yellow-600 dark:text-yellow-400">
                    {language === 'es'
                      ? `${parseResult.inputValidation.stats?.validLines || 0}/${parseResult.inputValidation.stats?.totalLines || 0} líneas válidas`
                      : `${parseResult.inputValidation.stats?.validLines || 0}/${parseResult.inputValidation.stats?.totalLines || 0} valid lines`
                    }
                  </div>
                </div>
              )}

              {/* Auto-generated tags */}
              {parseResult.cards?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('deckAutoTags.title')}:</span>
                  <DeckAutoTags
                    cards={parseResult.cards}
                    tcg={parseResult.tcg}
                    format={parseResult.format}
                  />
                </div>
              )}

              {/* Stats preview */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t('deckImport.preview')}: {parseResult?.stats?.totalCards || 0} {t('deckImport.cards')}
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
                    {(parseResult?.stats?.totalCards || 0) > 0 && (
                      <div className="mt-2 h-3 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-600">
                        {(parseResult?.breakdown?.pokemon || 0) > 0 && (
                          <div className="bg-blue-500" style={{ width: `${((parseResult?.breakdown?.pokemon || 0) / (parseResult?.stats?.totalCards || 1)) * 100}%` }} />
                        )}
                        {(parseResult?.breakdown?.trainer || 0) > 0 && (
                          <div className="bg-purple-500" style={{ width: `${((parseResult?.breakdown?.trainer || 0) / (parseResult?.stats?.totalCards || 1)) * 100}%` }} />
                        )}
                        {(parseResult?.breakdown?.energy || 0) > 0 && (
                          <div className="bg-yellow-500" style={{ width: `${((parseResult?.breakdown?.energy || 0) / (parseResult?.stats?.totalCards || 1)) * 100}%` }} />
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

              {/* Reprint Groups - Copy limit validation with set breakdown */}
              {parseResult.reprintGroups && parseResult.reprintGroups.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowReprintGroups(!showReprintGroups)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('deckImport.reprintGroups')}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({parseResult.stats?.uniqueNames || parseResult.reprintGroups.length} {t('deckImport.uniqueCards')})
                      </span>
                      {parseResult.stats?.groupsExceedingLimit > 0 && (
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                          {parseResult.stats.groupsExceedingLimit} {t('deckImport.exceedLimit')}
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${showReprintGroups ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showReprintGroups && (
                    <div className="px-4 pb-4 space-y-2 max-h-60 overflow-y-auto">
                      {parseResult.reprintGroups.map((group, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded border ${
                            group.status === 'exceeded'
                              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600'
                              : group.status === 'at_limit'
                              ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
                              : 'border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {group.displayName}
                            </span>
                            <span className={`text-sm font-bold ${
                              group.status === 'exceeded'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : group.status === 'at_limit'
                                ? 'text-green-600 dark:text-green-400'
                                : group.status === 'unlimited'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {group.isBasicEnergy ? (
                                <span title={t('deckImport.unlimitedCopies')}>{group.totalQuantity} ∞</span>
                              ) : (
                                <>
                                  {group.totalQuantity}/{group.limit}
                                  {group.status === 'exceeded' && ' ⚠️'}
                                  {group.status === 'at_limit' && ' ✓'}
                                </>
                              )}
                            </span>
                          </div>

                          {/* Show set breakdown if multiple cards in group */}
                          {group.cards.length > 1 && (
                            <div className="mt-1 pl-3 space-y-0.5">
                              {group.cards.map((card, cardIdx) => (
                                <div key={cardIdx} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <span className="text-gray-400">├─</span>
                                  {card.setCode && card.number ? (
                                    <span>{card.setCode} {card.number}</span>
                                  ) : (
                                    <span className="italic">{card.name}</span>
                                  )}
                                  <span className="text-gray-400">×{card.quantity}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
            disabled={!parseResult || !parseResult?.cards || parseResult.cards.length === 0 || importing || parsing}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {importing && <Spinner size="sm" />}
            {importing
              ? t('deckImport.importing')
              : mode === 'create'
                ? (language === 'es' ? 'Crear Mazo' : 'Create Deck')
                : t('deckImport.importButton')
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeckImportModal

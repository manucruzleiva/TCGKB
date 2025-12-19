import { useLanguage } from '../../contexts/LanguageContext'

/**
 * DeckValidationIndicator - Shows inline validation status for a deck
 *
 * Props:
 * - validation: { isValid, errors, warnings, summary }
 * - format: detected format (standard, glc, etc.)
 * - compact: boolean - show compact version
 */
const DeckValidationIndicator = ({ validation, format, compact = false }) => {
  const { t } = useLanguage()

  if (!validation) return null

  const { isValid, errors = [], warnings = [], summary = {} } = validation

  // Card count display
  const totalCards = summary.totalCards || 0
  const expectedCards = format === 'glc' || format === 'standard' ? 60 :
                        format === 'constructed' ? 56 : 60

  const cardCountColor = totalCards === expectedCards ? 'text-green-600 dark:text-green-400' :
                         totalCards > expectedCards ? 'text-red-600 dark:text-red-400' :
                         'text-yellow-600 dark:text-yellow-400'

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Card Count Badge */}
        <span className={`text-sm font-medium ${cardCountColor}`}>
          {totalCards}/{expectedCards}
        </span>

        {/* Validation Status Icon */}
        {isValid ? (
          <span className="text-green-500" title={t('deckValidation.valid')}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </span>
        ) : (
          <span className="text-yellow-500" title={`${errors.length} ${t('deckValidation.errors')}`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Status icon */}
          {isValid ? (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{t('deckValidation.valid')}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{t('deckValidation.invalid')}</span>
            </span>
          )}
        </div>

        {/* Card count */}
        <span className={`text-lg font-bold ${cardCountColor}`}>
          {totalCards}/{expectedCards} {t('deckValidation.cards')}
        </span>
      </div>

      {/* Summary stats */}
      {summary.basicPokemon !== undefined && (
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>{t('deckValidation.basicPokemon')}: {summary.basicPokemon}</span>
          {summary.aceSpecs > 0 && (
            <span className={summary.aceSpecs > 1 ? 'text-red-500' : ''}>
              ACE SPEC: {summary.aceSpecs}/1
            </span>
          )}
          {summary.radiants > 0 && (
            <span className={summary.radiants > 1 ? 'text-red-500' : ''}>
              Radiant: {summary.radiants}/1
            </span>
          )}
        </div>
      )}

      {/* Errors list */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 space-y-1">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
            {t('deckValidation.errors')} ({errors.length})
          </h4>
          <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 text-red-500">•</span>
                <span>{getLocalizedErrorMessage(error, t)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings list */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 space-y-1">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            {t('deckValidation.warnings')} ({warnings.length})
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 text-yellow-500">•</span>
                <span>{warning.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Get localized error message based on error type
 */
function getLocalizedErrorMessage(error, t) {
  const { type, message, current, expected, limit, cardName } = error

  switch (type) {
    case 'card_count':
      return t('deckValidation.errorCardCount', { current, expected })
    case 'copy_limit':
      return t('deckValidation.errorCopyLimit', { card: cardName, current, limit })
    case 'singleton_limit':
      return t('deckValidation.errorSingleton', { card: cardName, current })
    case 'no_basic':
      return t('deckValidation.errorNoBasic')
    case 'ace_spec_limit':
      return t('deckValidation.errorAceSpec', { current, limit })
    case 'radiant_limit':
      return t('deckValidation.errorRadiant', { current, limit })
    case 'rule_box_prohibited':
      return t('deckValidation.errorRuleBox')
    case 'ace_spec_prohibited':
      return t('deckValidation.errorAceSpecGLC')
    default:
      return message
  }
}

export default DeckValidationIndicator

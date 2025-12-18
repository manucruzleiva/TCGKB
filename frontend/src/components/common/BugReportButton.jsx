import { useState, useCallback, useRef } from 'react'
import html2canvas from 'html2canvas'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import api from '../../services/api'

const BugReportButton = () => {
  const { language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const { isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [capturingScreenshot, setCapturingScreenshot] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [issueUrl, setIssueUrl] = useState(null)
  const buttonRef = useRef(null)

  // Auto-capture screenshot when opening the modal
  const handleOpenModal = useCallback(async () => {
    // First hide the bug report button
    if (buttonRef.current) {
      buttonRef.current.style.display = 'none'
    }

    setCapturingScreenshot(true)

    try {
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100))

      const capturedCanvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
        backgroundColor: isDark ? '#111827' : '#ffffff',
        onclone: (clonedDoc) => {
          // Remove any elements we don't want in the screenshot
          const bugButton = clonedDoc.querySelector('[data-bug-button]')
          if (bugButton) bugButton.remove()
        }
      })

      setScreenshot(capturedCanvas.toDataURL('image/jpeg', 0.7))
    } catch (error) {
      console.error('Auto-screenshot failed:', error)
      // Continue without screenshot - user can still report
    } finally {
      setCapturingScreenshot(false)
      // Show the button again
      if (buttonRef.current) {
        buttonRef.current.style.display = ''
      }
    }

    setIsOpen(true)
  }, [isDark])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      return
    }

    try {
      setSubmitting(true)

      // Create GitHub issue directly
      const response = await api.post('/github/issues', {
        title: title.trim(),
        description: description.trim(),
        screenshot,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        theme: isDark ? 'dark' : 'light',
        language,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      })

      setSuccess(true)
      setIssueUrl(response.data?.data?.url || null)
      setTitle('')
      setDescription('')
      setScreenshot(null)

      // Keep modal open longer if we have a URL to show
      setTimeout(() => {
        setSuccess(false)
        setIssueUrl(null)
        setIsOpen(false)
      }, response.data?.data?.url ? 5000 : 2000)
    } catch (error) {
      console.error('Failed to submit bug report:', error)
      alert(language === 'es' ? 'Error al enviar el reporte' : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setTitle('')
    setDescription('')
    setScreenshot(null)
    setSuccess(false)
    setIssueUrl(null)
  }

  // Retry screenshot capture
  const handleRetryScreenshot = async () => {
    setCapturingScreenshot(true)
    try {
      const capturedCanvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
        backgroundColor: isDark ? '#111827' : '#ffffff',
        ignoreElements: (element) => {
          return element.closest('[data-bug-modal]') !== null
        }
      })
      setScreenshot(capturedCanvas.toDataURL('image/jpeg', 0.7))
    } catch (error) {
      console.error('Screenshot retry failed:', error)
    } finally {
      setCapturingScreenshot(false)
    }
  }

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {/* Floating Bug Report Button - Only for logged-in users */}
      <button
        ref={buttonRef}
        data-bug-button
        onClick={handleOpenModal}
        className="fixed bottom-4 right-4 z-40 p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
        title={language === 'es' ? 'Reportar un Bug' : 'Report a Bug'}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div data-bug-modal className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>🐛</span>
                {language === 'es' ? 'Reportar un Bug' : 'Report a Bug'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                  {language === 'es' ? '¡Gracias por tu reporte!' : 'Thanks for your report!'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {language === 'es' ? 'Se ha creado un issue en GitHub' : 'A GitHub issue has been created'}
                </p>
                {issueUrl && (
                  <a
                    href={issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors text-sm"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    {language === 'es' ? 'Ver en GitHub' : 'View on GitHub'}
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'es' ? 'Título' : 'Title'} *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={language === 'es' ? 'Describe brevemente el problema' : 'Briefly describe the issue'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                    maxLength={200}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'es' ? 'Descripción' : 'Description'} *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === 'es'
                      ? '¿Qué pasó? ¿Qué esperabas que pasara?'
                      : 'What happened? What did you expect to happen?'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={4}
                    maxLength={2000}
                    required
                  />
                </div>

                {/* Auto-captured screenshot preview */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {language === 'es' ? 'Captura de pantalla' : 'Screenshot'}
                    </label>
                    {!capturingScreenshot && (
                      <button
                        type="button"
                        onClick={handleRetryScreenshot}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        {language === 'es' ? 'Recapturar' : 'Retake'}
                      </button>
                    )}
                  </div>
                  {capturingScreenshot ? (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm">{language === 'es' ? 'Capturando...' : 'Capturing...'}</span>
                      </div>
                    </div>
                  ) : screenshot ? (
                    <img
                      src={screenshot}
                      alt="Screenshot"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                      {language === 'es' ? 'No se pudo capturar' : 'Could not capture'}
                    </div>
                  )}
                </div>

                {/* Context Info */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p className="flex items-center gap-2">
                    <span>{isDark ? '🌙' : '☀️'}</span>
                    <span>{language === 'es' ? 'Tema:' : 'Theme:'} {isDark ? 'Dark' : 'Light'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span>🌐</span>
                    <span className="truncate">{window.location.pathname}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span>📐</span>
                    <span>{window.innerWidth}x{window.innerHeight}</span>
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !description.trim()}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {language === 'es' ? 'Enviando...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <span>🐛</span>
                      {language === 'es' ? 'Enviar Reporte' : 'Submit Report'}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default BugReportButton

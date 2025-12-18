import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import Input from '../common/Input'
import Button from '../common/Button'
import Spinner from '../common/Spinner'

// Error messages by code
const ERROR_MESSAGES = {
  EMAIL_NOT_FOUND: {
    es: 'No hay cuenta registrada con este email',
    en: 'No account found with this email'
  },
  WRONG_PASSWORD: {
    es: 'Contraseña incorrecta',
    en: 'Incorrect password'
  },
  ACCOUNT_INACTIVE: {
    es: 'Tu cuenta está inactiva. Contacta a soporte.',
    en: 'Your account is inactive. Contact support.'
  },
  INTERNAL_ERROR: {
    es: 'Error interno del servidor. Intenta nuevamente.',
    en: 'Internal server error. Please try again.'
  },
  NETWORK_ERROR: {
    es: 'Error de conexión. Verifica tu internet.',
    en: 'Connection error. Check your internet.'
  },
  VALIDATION_ERROR: {
    es: 'Por favor completa todos los campos correctamente',
    en: 'Please fill all fields correctly'
  }
}

const LoginForm = () => {
  const navigate = useNavigate()
  const { login, error: authError } = useAuth()
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation
    if (!formData.email || !formData.password) {
      setError(language === 'es' ? 'Por favor completa todos los campos' : 'Please fill in all fields')
      setLoading(false)
      return
    }

    if (!formData.email.includes('@')) {
      setError(language === 'es' ? 'Por favor ingresa un email válido' : 'Please enter a valid email')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError(language === 'es' ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const result = await login(formData.email, formData.password)

      if (result.success) {
        navigate('/')
      } else {
        // Use errorCode for specific messages
        const errorCode = result.errorCode
        if (errorCode && ERROR_MESSAGES[errorCode]) {
          setError(ERROR_MESSAGES[errorCode][language])
        } else {
          // Fallback to generic error
          setError(result.error || (language === 'es'
            ? 'Error al iniciar sesión. Intenta nuevamente.'
            : 'Login failed. Please try again.'))
        }
      }
    } catch (err) {
      setError(ERROR_MESSAGES.NETWORK_ERROR[language])
    }

    setLoading(false)
  }

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {language === 'es' ? 'Iniciar Sesión' : 'Login'}
      </h2>

      {(error || authError) && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded">
          {error || authError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={language === 'es' ? 'tu@email.com' : 'your@email.com'}
          required
        />

        <Input
          label={language === 'es' ? 'Contraseña' : 'Password'}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full"
        >
          {loading ? <Spinner size="sm" /> : (language === 'es' ? 'Iniciar Sesión' : 'Login')}
        </Button>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setError(language === 'es'
              ? 'Contacta a soporte para recuperar tu contraseña'
              : 'Contact support to recover your password')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
        {language === 'es' ? '¿No tienes cuenta?' : "Don't have an account?"}{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          {language === 'es' ? 'Regístrate' : 'Register'}
        </Link>
      </p>
    </div>
  )
}

export default LoginForm

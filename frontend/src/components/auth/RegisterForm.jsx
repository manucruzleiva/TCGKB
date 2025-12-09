import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../common/Input'
import Button from '../common/Button'
import Spinner from '../common/Spinner'
import { USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../utils/constants'

const RegisterForm = () => {
  const navigate = useNavigate()
  const { register, error: authError } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setErrors({
      ...errors,
      [e.target.name]: ''
    })
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email es requerido'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email no es válido'
    }

    if (!formData.username) {
      newErrors.username = 'Nombre de usuario es requerido'
    } else if (formData.username.length < USERNAME_MIN_LENGTH) {
      newErrors.username = `Debe tener al menos ${USERNAME_MIN_LENGTH} caracteres`
    } else if (formData.username.length > USERNAME_MAX_LENGTH) {
      newErrors.username = `No puede exceder ${USERNAME_MAX_LENGTH} caracteres`
    }

    if (!formData.password) {
      newErrors.password = 'Contraseña es requerida'
    } else if (formData.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    const result = await register(formData.email, formData.username, formData.password)

    if (result.success) {
      navigate('/')
    } else {
      setErrors({ general: result.error })
    }

    setLoading(false)
  }

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h2>

      {(errors.general || authError) && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general || authError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          error={errors.email}
          required
        />

        <Input
          label="Nombre de Usuario"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="usuario123"
          error={errors.username}
          required
        />

        <Input
          label="Contraseña"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.password}
          required
        />

        <Input
          label="Confirmar Contraseña"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.confirmPassword}
          required
        />

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full"
        >
          {loading ? <Spinner size="sm" /> : 'Registrarse'}
        </Button>
      </form>

      <p className="mt-4 text-center text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Inicia Sesión
        </Link>
      </p>
    </div>
  )
}

export default RegisterForm

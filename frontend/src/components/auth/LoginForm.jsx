import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Input from '../common/Input'
import Button from '../common/Button'
import Spinner from '../common/Spinner'

const LoginForm = () => {
  const navigate = useNavigate()
  const { login, error: authError } = useAuth()
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

    const result = await login(formData.email, formData.password)

    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>

      {(error || authError) && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
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
          placeholder="tu@email.com"
          required
        />

        <Input
          label="Contraseña"
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
          {loading ? <Spinner size="sm" /> : 'Iniciar Sesión'}
        </Button>
      </form>

      <p className="mt-4 text-center text-gray-600">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Regístrate
        </Link>
      </p>
    </div>
  )
}

export default LoginForm

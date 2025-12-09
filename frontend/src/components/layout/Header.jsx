import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../common/Button'

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">
              Pokemon TCG KB
            </h1>
          </Link>

          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">
                  Hola, <span className="font-medium">{user?.username}</span>
                </span>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="secondary" className="text-sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={logout} className="text-sm">
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" className="text-sm">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header

import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import Button from '../common/Button'
import LanguageSwitcher from '../common/LanguageSwitcher'
import ThemeSwitcher from '../common/ThemeSwitcher'

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const { t } = useLanguage()

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md transition-colors">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex flex-col">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              TCG KB
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">TCG Knowledge Base</p>
          </Link>

          <nav className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                <span className="text-gray-700 dark:text-gray-300">
                  {t('nav.profile')}, <span className="font-medium">{user?.username}</span>
                </span>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="secondary" className="text-sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={logout} className="text-sm">
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-sm">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" className="text-sm">
                    {t('nav.register')}
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

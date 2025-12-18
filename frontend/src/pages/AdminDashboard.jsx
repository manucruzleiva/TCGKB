import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Navigate } from 'react-router-dom'

const AdminDashboard = () => {
  const { isAdmin } = useAuth()
  const { language } = useLanguage()

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">
        {language === 'es' ? 'Panel de Administración' : 'Admin Dashboard'}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        {language === 'es' ? 'Funcionalidades de administración próximamente...' : 'Admin features coming soon...'}
      </p>
    </div>
  )
}

export default AdminDashboard

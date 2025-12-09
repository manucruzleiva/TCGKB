import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

const AdminDashboard = () => {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Panel de Administración</h2>
      <p className="text-gray-600">
        Funcionalidades de administración próximamente...
      </p>
    </div>
  )
}

export default AdminDashboard

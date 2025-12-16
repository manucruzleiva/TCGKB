import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import Button from '../components/common/Button'

const ModDashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [timeSeriesData, setTimeSeriesData] = useState([])
  const [users, setUsers] = useState([])
  const [summary, setSummary] = useState(null)
  const [timeRange, setTimeRange] = useState(30)
  const [updatingUser, setUpdatingUser] = useState(null)

  useEffect(() => {
    // Redirect if not admin
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (user && user.role !== 'admin') {
      navigate('/')
      return
    }

    fetchDashboardData()
  }, [isAuthenticated, user, navigate, timeRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [timeSeriesRes, usersRes, summaryRes] = await Promise.all([
        api.get(`/mod/time-series?days=${timeRange}`),
        api.get('/mod/users'),
        api.get('/mod/summary')
      ])

      if (timeSeriesRes.data.success) {
        setTimeSeriesData(timeSeriesRes.data.data)
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.data)
      }

      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingUser(userId)

      const response = await api.put(`/mod/users/${userId}/role`, { role: newRole })

      if (response.data.success) {
        // Update local state
        setUsers(users.map(u =>
          u._id === userId ? { ...u, role: newRole } : u
        ))
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert(error.response?.data?.message || 'Failed to update user role')
    } finally {
      setUpdatingUser(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {language === 'es' ? 'Panel de Moderación' : 'Moderation Dashboard'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'es'
            ? 'Administra usuarios y monitorea la actividad de la plataforma'
            : 'Manage users and monitor platform activity'}
        </p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-5">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {summary.stats.totalComments}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {language === 'es' ? 'Total Comentarios' : 'Total Comments'}
            </div>
          </div>

          <div className="bg-red-100 dark:bg-red-900 rounded-lg p-5">
            <div className="text-3xl mb-2">🚫</div>
            <div className="text-2xl font-bold text-red-800 dark:text-red-200">
              {summary.stats.moderatedComments}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">
              {language === 'es' ? 'Comentarios Moderados' : 'Moderated Comments'}
            </div>
          </div>

          <div className="bg-green-100 dark:bg-green-900 rounded-lg p-5">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {summary.stats.totalUsers}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              {language === 'es' ? 'Total Usuarios' : 'Total Users'}
            </div>
          </div>

          <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-5">
            <div className="text-3xl mb-2">👑</div>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {summary.stats.adminUsers}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              {language === 'es' ? 'Administradores' : 'Administrators'}
            </div>
          </div>
        </div>
      )}

      {/* Time Series Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {language === 'es' ? 'Actividad en el Tiempo' : 'Activity Over Time'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === 7
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {language === 'es' ? '7 días' : '7 days'}
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === 30
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {language === 'es' ? '30 días' : '30 days'}
            </button>
            <button
              onClick={() => setTimeRange(90)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === 90
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {language === 'es' ? '90 días' : '90 days'}
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              tick={{ fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg)',
                border: '1px solid var(--tooltip-border)',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="comments"
              stroke="#8b5cf6"
              strokeWidth={2}
              name={language === 'es' ? 'Comentarios' : 'Comments'}
            />
            <Line
              type="monotone"
              dataKey="reactions"
              stroke="#ec4899"
              strokeWidth={2}
              name={language === 'es' ? 'Reacciones' : 'Reactions'}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* User Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {language === 'es' ? 'Gestión de Usuarios' : 'User Management'}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  {language === 'es' ? 'Usuario' : 'Username'}
                </th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  Email
                </th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  {language === 'es' ? 'Rol' : 'Role'}
                </th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  {language === 'es' ? 'Actividad' : 'Activity'}
                </th>
                <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                  {language === 'es' ? 'Acciones' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u._id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {u.username}
                    {u.email === 'shieromanu@gmail.com' && (
                      <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                        {language === 'es' ? 'DUEÑO' : 'OWNER'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {u.role === 'admin' ? (language === 'es' ? 'Admin' : 'Admin') : (language === 'es' ? 'Usuario' : 'User')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                    💬 {u.stats.comments} | 😀 {u.stats.reactions}
                  </td>
                  <td className="py-3 px-4">
                    {u._id !== user._id && u.email !== 'shieromanu@gmail.com' && (
                      <div className="flex gap-2">
                        {u.role === 'user' ? (
                          <Button
                            onClick={() => handleRoleChange(u._id, 'admin')}
                            disabled={updatingUser === u._id}
                            variant="primary"
                            className="text-xs py-1 px-3"
                          >
                            {updatingUser === u._id
                              ? '...'
                              : (language === 'es' ? 'Promover a Admin' : 'Promote to Admin')}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleRoleChange(u._id, 'user')}
                            disabled={updatingUser === u._id}
                            variant="secondary"
                            className="text-xs py-1 px-3"
                          >
                            {updatingUser === u._id
                              ? '...'
                              : (language === 'es' ? 'Degradar a Usuario' : 'Demote to User')}
                          </Button>
                        )}
                      </div>
                    )}
                    {u._id === user._id && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {language === 'es' ? '(Tú)' : '(You)'}
                      </span>
                    )}
                    {u.email === 'shieromanu@gmail.com' && u._id !== user._id && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {language === 'es' ? 'Protegido' : 'Protected'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ModDashboard

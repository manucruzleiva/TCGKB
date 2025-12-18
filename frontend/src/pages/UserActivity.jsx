import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import { cardService } from '../services/cardService'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

// Card link with hover preview
const CardLink = ({ cardId }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [cardData, setCardData] = useState(null)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true)
      if (!cardData && !loading) {
        loadCardData()
      }
    }, 300)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setShowTooltip(false)
  }

  const loadCardData = async () => {
    try {
      setLoading(true)
      const response = await cardService.getCardById(cardId)
      setCardData(response.data.card)
    } catch (error) {
      console.error('Error loading card:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <span className="relative inline-block">
      <Link
        to={`/card/${cardId}`}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span>🃏</span>
        <span>{cardData?.name || cardId}</span>
      </Link>

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2">
            {loading ? (
              <div className="w-[100px] h-[140px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
              </div>
            ) : cardData ? (
              <div className="text-center">
                <img
                  src={cardData.images?.small || cardData.images?.large}
                  alt={cardData.name}
                  className="w-[100px] h-auto rounded"
                />
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate max-w-[100px]">
                  {cardData.set?.name}
                </p>
              </div>
            ) : (
              <div className="w-[100px] h-[140px] flex items-center justify-center text-gray-500 text-xs">
                No disponible
              </div>
            )}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white dark:border-t-gray-800"></div>
        </div>
      )}
    </span>
  )
}

const UserActivity = () => {
  const { userId } = useParams()
  const { user, isAuthenticated } = useAuth()
  const { language } = useLanguage()
  const { formatDate, timeAgo } = useDateFormat()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [comments, setComments] = useState([])
  const [reactions, setReactions] = useState([])
  const [activeTab, setActiveTab] = useState('comments')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/')
      return
    }

    fetchUserActivity()
  }, [userId, isAuthenticated, user])

  const fetchUserActivity = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/mod/users/${userId}/activity`)

      if (response.data.success) {
        setUserData(response.data.data.user)
        setComments(response.data.data.comments.items)
        setReactions(response.data.data.reactions.items)
      }
    } catch (error) {
      console.error('Error fetching user activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (newRole) => {
    try {
      setUpdating('role')
      const response = await api.put(`/mod/users/${userId}/role`, { role: newRole })
      if (response.data.success) {
        setUserData(prev => ({ ...prev, role: newRole }))
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert(error.response?.data?.message || 'Error updating role')
    } finally {
      setUpdating(null)
    }
  }

  const handleRestrictionChange = async (field, value) => {
    try {
      setUpdating(field)
      const response = await api.put(`/mod/users/${userId}/restrictions`, { [field]: value })
      if (response.data.success) {
        setUserData(prev => ({ ...prev, [field]: value }))
      }
    } catch (error) {
      console.error('Error updating restriction:', error)
      alert(error.response?.data?.message || 'Error updating restriction')
    } finally {
      setUpdating(null)
    }
  }

  const handleModerateComment = async (commentId, isModerated) => {
    try {
      setUpdating(commentId)
      const response = await api.put(`/mod/comments/${commentId}/moderate`, {
        isModerated,
        reason: isModerated ? 'Moderated from user activity' : null
      })
      if (response.data.success) {
        setComments(prev =>
          prev.map(c => c._id === commentId ? { ...c, isModerated } : c)
        )
      }
    } catch (error) {
      console.error('Error moderating comment:', error)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500 dark:text-gray-400">
          {language === 'es' ? 'Usuario no encontrado' : 'User not found'}
        </p>
      </div>
    )
  }

  const isSystemAdmin = userData.email === 'shieromanu@gmail.com'
  const isSelf = user?.id === userId

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/mod')}
        className="mb-6 text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {language === 'es' ? 'Volver al Dashboard' : 'Back to Dashboard'}
      </button>

      {/* User Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
            {userData.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {userData.username}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{userData.email}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                userData.role === 'admin'
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {userData.role === 'admin' ? 'Admin' : 'User'}
              </span>
              {!userData.canComment && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                  🚫 {language === 'es' ? 'Sin comentarios' : 'No comments'}
                </span>
              )}
              {!userData.canReact && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                  🚫 {language === 'es' ? 'Sin reacciones' : 'No reactions'}
                </span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'es' ? 'Registrado:' : 'Joined:'} {formatDate(userData.createdAt)}
              </span>
            </div>

            {/* User Management Buttons */}
            {!isSystemAdmin && !isSelf && (
              <div className="mt-4 flex flex-wrap gap-2">
                {/* Role Toggle */}
                <button
                  onClick={() => handleRoleChange(userData.role === 'admin' ? 'user' : 'admin')}
                  disabled={updating === 'role'}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    userData.role === 'admin'
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
                  }`}
                >
                  {updating === 'role' ? '...' : (
                    userData.role === 'admin'
                      ? (language === 'es' ? '⬇️ Quitar Admin' : '⬇️ Demote to User')
                      : (language === 'es' ? '⬆️ Hacer Admin' : '⬆️ Promote to Admin')
                  )}
                </button>

                {/* Comment Toggle */}
                <button
                  onClick={() => handleRestrictionChange('canComment', !userData.canComment)}
                  disabled={updating === 'canComment'}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    userData.canComment
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900'
                      : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                  }`}
                >
                  {updating === 'canComment' ? '...' : (
                    userData.canComment
                      ? (language === 'es' ? '🚫 Desactivar Comentarios' : '🚫 Disable Comments')
                      : (language === 'es' ? '✅ Activar Comentarios' : '✅ Enable Comments')
                  )}
                </button>

                {/* Reaction Toggle */}
                <button
                  onClick={() => handleRestrictionChange('canReact', !userData.canReact)}
                  disabled={updating === 'canReact'}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    userData.canReact
                      ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900'
                      : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                  }`}
                >
                  {updating === 'canReact' ? '...' : (
                    userData.canReact
                      ? (language === 'es' ? '🚫 Desactivar Reacciones' : '🚫 Disable Reactions')
                      : (language === 'es' ? '✅ Activar Reacciones' : '✅ Enable Reactions')
                  )}
                </button>
              </div>
            )}

            {isSystemAdmin && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
                {language === 'es' ? 'Este es el administrador del sistema y no puede ser modificado.' : 'This is the system administrator and cannot be modified.'}
              </p>
            )}

            {isSelf && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
                {language === 'es' ? 'No puedes modificar tu propio perfil desde aquí.' : 'You cannot modify your own profile from here.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'comments'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          💬 {language === 'es' ? 'Comentarios' : 'Comments'} ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab('reactions')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'reactions'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          😀 {language === 'es' ? 'Reacciones' : 'Reactions'} ({reactions.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {language === 'es' ? 'No hay comentarios' : 'No comments'}
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment._id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border transition-colors ${
                  comment.isModerated
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                    : comment.isHiddenByUser
                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      <CardLink cardId={comment.cardId} />
                      <span>{timeAgo(comment.createdAt)}</span>
                      {comment.isModerated && (
                        <span className="text-red-500 font-medium">🚫 {language === 'es' ? 'Moderado' : 'Moderated'}</span>
                      )}
                      {comment.isHiddenByUser && (
                        <span className="text-yellow-500 font-medium">👁 {language === 'es' ? 'Oculto' : 'Hidden'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleModerateComment(comment._id, !comment.isModerated)}
                      disabled={updating === comment._id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        comment.isModerated
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900'
                          : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900'
                      }`}
                    >
                      {updating === comment._id ? '...' : (
                        comment.isModerated
                          ? (language === 'es' ? '✅ Restaurar' : '✅ Restore')
                          : (language === 'es' ? '🚫 Moderar' : '🚫 Moderate')
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'reactions' && (
        <div className="space-y-4">
          {reactions.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {language === 'es' ? 'No hay reacciones' : 'No reactions'}
            </p>
          ) : (
            reactions.map((reaction) => (
              <div
                key={reaction._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0">{reaction.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {reaction.targetType === 'card' && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400">
                            🃏 {language === 'es' ? 'Carta' : 'Card'}
                          </span>
                          <CardLink cardId={reaction.cardId || reaction.targetId} />
                        </>
                      )}
                      {reaction.targetType === 'comment' && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                            💬 {language === 'es' ? 'Comentario' : 'Comment'}
                          </span>
                          {reaction.cardId && <CardLink cardId={reaction.cardId} />}
                        </>
                      )}
                      {reaction.targetType === 'attack' && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                            ⚔️ {language === 'es' ? `Ataque #${(reaction.itemIndex || 0) + 1}` : `Attack #${(reaction.itemIndex || 0) + 1}`}
                          </span>
                          {reaction.cardId && <CardLink cardId={reaction.cardId} />}
                        </>
                      )}
                      {reaction.targetType === 'ability' && (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                            ✨ {language === 'es' ? `Habilidad #${(reaction.itemIndex || 0) + 1}` : `Ability #${(reaction.itemIndex || 0) + 1}`}
                          </span>
                          {reaction.cardId && <CardLink cardId={reaction.cardId} />}
                        </>
                      )}
                    </div>
                    {/* Show comment preview for comment reactions */}
                    {reaction.targetType === 'comment' && reaction.commentPreview && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-1 line-clamp-2">
                        "{reaction.commentPreview}"
                      </p>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      {timeAgo(reaction.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default UserActivity

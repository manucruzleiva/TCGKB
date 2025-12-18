import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import Button from '../components/common/Button'
import api from '../services/api'

// Default Pokemon avatars from PokeAPI sprites
const DEFAULT_AVATARS = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', // Pikachu
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',  // Bulbasaur
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',  // Charmander
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',  // Squirtle
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png', // Eevee
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png', // Mewtwo
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png', // Mew
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png',  // Jigglypuff
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png', // Snorlax
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',   // Charizard
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png',  // Gengar
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png', // Lapras
]

const Settings = () => {
  const { user, isAuthenticated, updateUser } = useAuth()
  const { language } = useLanguage()
  const { dateFormat, changeDateFormat } = useDateFormat()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Profile settings
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || DEFAULT_AVATARS[0])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  // Date format
  const [selectedDateFormat, setSelectedDateFormat] = useState(dateFormat)
  const [showRelativeTime, setShowRelativeTime] = useState(true)

  // Account settings
  const [accountMessage, setAccountMessage] = useState(null)
  const [savingAccount, setSavingAccount] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [activeSection, setActiveSection] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (user?.avatar) {
      setSelectedAvatar(user.avatar)
    }
  }, [user?.avatar])

  // Obfuscate email: show first 2 chars, then ***, then @ domain first char and ***
  const obfuscateEmail = (email) => {
    if (!email) return ''
    const [localPart, domain] = email.split('@')
    if (!domain) return email
    const obfuscatedLocal = localPart.slice(0, 2) + '***'
    const domainParts = domain.split('.')
    const obfuscatedDomain = domainParts[0].slice(0, 1) + '***.' + domainParts.slice(1).join('.')
    return `${obfuscatedLocal}@${obfuscatedDomain}`
  }

  const handleSaveAvatar = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const response = await api.put('/auth/avatar', { avatar: selectedAvatar })
      if (response.data.success && updateUser) {
        updateUser({ ...user, avatar: selectedAvatar })
      }
      setMessage({
        type: 'success',
        text: language === 'es' ? 'Avatar actualizado' : 'Avatar updated'
      })
      setShowAvatarPicker(false)
    } catch (error) {
      console.error('Error saving avatar:', error)
      setMessage({
        type: 'error',
        text: language === 'es' ? 'Error al guardar avatar' : 'Error saving avatar'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDateFormat = async () => {
    setSaving(true)
    setMessage(null)
    try {
      if (selectedDateFormat !== dateFormat) {
        changeDateFormat(selectedDateFormat)
      }
      await api.put('/auth/preferences', {
        dateFormat: selectedDateFormat,
        showRelativeTime
      })
      setMessage({
        type: 'success',
        text: language === 'es' ? 'Preferencias guardadas' : 'Preferences saved'
      })
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({
        type: 'error',
        text: language === 'es' ? 'Error al guardar' : 'Error saving'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateAccount = async (type) => {
    setSavingAccount(true)
    setAccountMessage(null)

    try {
      const data = {}

      if (type === 'email' && newEmail) {
        data.email = newEmail
        data.currentPassword = currentPassword
      } else if (type === 'username' && newUsername) {
        data.username = newUsername
        data.currentPassword = currentPassword
      } else if (type === 'password') {
        if (newPassword !== confirmPassword) {
          setAccountMessage({
            type: 'error',
            text: language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match'
          })
          setSavingAccount(false)
          return
        }
        data.currentPassword = currentPassword
        data.newPassword = newPassword
      }

      const response = await api.put('/auth/update-account', data)

      if (response.data.success) {
        setAccountMessage({
          type: 'success',
          text: language === 'es' ? 'Cuenta actualizada' : 'Account updated'
        })
        setNewEmail('')
        setNewUsername('')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setActiveSection(null)

        if ((type === 'email' || type === 'username') && updateUser) {
          updateUser(response.data.data.user)
        }
      }
    } catch (error) {
      console.error('Error updating account:', error)
      setAccountMessage({
        type: 'error',
        text: error.response?.data?.message || (language === 'es' ? 'Error al actualizar' : 'Error updating')
      })
    } finally {
      setSavingAccount(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {language === 'es' ? 'Configuración' : 'Settings'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'es' ? 'Administra tu perfil y preferencias' : 'Manage your profile and preferences'}
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-primary-300 transition-all overflow-hidden"
            >
              {selectedAvatar ? (
                <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {user?.username}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {obfuscateEmail(user?.email)}
            </p>
            <div className="flex gap-2 mt-2">
              {user?.role === 'admin' && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Avatar Picker */}
        {showAvatarPicker && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              {language === 'es' ? 'Elige un avatar' : 'Choose an avatar'}
            </h3>
            <div className="grid grid-cols-6 gap-3 mb-4">
              {DEFAULT_AVATARS.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar
                      ? 'border-primary-500 ring-2 ring-primary-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-primary-400'
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveAvatar} disabled={saving} variant="primary" className="flex-1">
                {saving ? '...' : (language === 'es' ? 'Guardar Avatar' : 'Save Avatar')}
              </Button>
              <Button onClick={() => setShowAvatarPicker(false)} variant="secondary">
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Date Format */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>📅</span> {language === 'es' ? 'Formato de Fecha' : 'Date Format'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { value: 'DD/MM/YYYY', example: '16/12/2025' },
            { value: 'MM/DD/YYYY', example: '12/16/2025' },
            { value: 'YYYY/MM/DD', example: '2025/12/16' }
          ].map((format) => (
            <button
              key={format.value}
              onClick={() => setSelectedDateFormat(format.value)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                selectedDateFormat === format.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{format.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{format.example}</div>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-pointer">
          <input
            type="checkbox"
            checked={showRelativeTime}
            onChange={(e) => setShowRelativeTime(e.target.checked)}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700 dark:text-gray-300">
            {language === 'es' ? 'Mostrar tiempo relativo (ej: hace 2 horas)' : 'Show relative time (e.g., 2 hours ago)'}
          </span>
        </label>
        <Button onClick={handleSaveDateFormat} disabled={saving} variant="primary" className="w-full mt-4">
          {saving ? '...' : (language === 'es' ? 'Guardar' : 'Save')}
        </Button>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>🔐</span> {language === 'es' ? 'Seguridad de la Cuenta' : 'Account Security'}
        </h3>

        {accountMessage && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${
            accountMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {accountMessage.text}
          </div>
        )}

        <div className="space-y-3">
          {/* Change Email */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setActiveSection(activeSection === 'email' ? null : 'email')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {language === 'es' ? 'Cambiar Email' : 'Change Email'}
              </span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${activeSection === 'email' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeSection === 'email' && (
              <div className="p-4 pt-0 space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={language === 'es' ? 'Nuevo email' : 'New email'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={language === 'es' ? 'Contraseña actual' : 'Current password'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  onClick={() => handleUpdateAccount('email')}
                  disabled={!newEmail || !currentPassword || savingAccount}
                  variant="primary"
                  className="w-full"
                >
                  {savingAccount ? '...' : (language === 'es' ? 'Actualizar' : 'Update')}
                </Button>
              </div>
            )}
          </div>

          {/* Change Username */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setActiveSection(activeSection === 'username' ? null : 'username')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {language === 'es' ? 'Cambiar Usuario' : 'Change Username'}
              </span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${activeSection === 'username' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeSection === 'username' && (
              <div className="p-4 pt-0 space-y-3">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder={language === 'es' ? 'Nuevo usuario' : 'New username'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={language === 'es' ? 'Contraseña actual' : 'Current password'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  onClick={() => handleUpdateAccount('username')}
                  disabled={!newUsername || !currentPassword || savingAccount}
                  variant="primary"
                  className="w-full"
                >
                  {savingAccount ? '...' : (language === 'es' ? 'Actualizar' : 'Update')}
                </Button>
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {language === 'es' ? 'Cambiar Contraseña' : 'Change Password'}
              </span>
              <svg className={`w-5 h-5 text-gray-500 transition-transform ${activeSection === 'password' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeSection === 'password' && (
              <div className="p-4 pt-0 space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={language === 'es' ? 'Contraseña actual' : 'Current password'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={language === 'es' ? 'Nueva contraseña' : 'New password'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={language === 'es' ? 'Confirmar contraseña' : 'Confirm password'}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  onClick={() => handleUpdateAccount('password')}
                  disabled={!currentPassword || !newPassword || !confirmPassword || savingAccount}
                  variant="primary"
                  className="w-full"
                >
                  {savingAccount ? '...' : (language === 'es' ? 'Actualizar' : 'Update')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

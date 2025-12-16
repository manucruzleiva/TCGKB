import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import { languages } from '../i18n'
import Button from '../components/common/Button'
import api from '../services/api'

const Settings = () => {
  const { user, isAuthenticated, updateUser } = useAuth()
  const { language, changeLanguage } = useLanguage()
  const { theme, setThemeMode } = useTheme()
  const { dateFormat, changeDateFormat } = useDateFormat()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Local state for settings
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [selectedTheme, setSelectedTheme] = useState(theme)
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

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      // Apply changes locally first
      if (selectedLanguage !== language) {
        changeLanguage(selectedLanguage)
      }
      if (selectedTheme !== theme) {
        setThemeMode(selectedTheme)
      }
      if (selectedDateFormat !== dateFormat) {
        changeDateFormat(selectedDateFormat)
      }

      // Save to backend
      await api.put('/auth/preferences', {
        language: selectedLanguage,
        theme: selectedTheme,
        dateFormat: selectedDateFormat,
        showRelativeTime
      })

      setMessage({
        type: 'success',
        text: language === 'es' ? 'Preferencias guardadas exitosamente' : 'Preferences saved successfully'
      })
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({
        type: 'error',
        text: language === 'es' ? 'Error al guardar preferencias' : 'Error saving preferences'
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
          text: language === 'es' ? 'Cuenta actualizada exitosamente' : 'Account updated successfully'
        })

        // Clear form fields
        setNewEmail('')
        setNewUsername('')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')

        // Update user in context if email or username changed
        if (type === 'email' || type === 'username') {
          if (updateUser) {
            updateUser(response.data.data.user)
          }
        }
      }
    } catch (error) {
      console.error('Error updating account:', error)
      setAccountMessage({
        type: 'error',
        text: error.response?.data?.message || (language === 'es' ? 'Error al actualizar cuenta' : 'Error updating account')
      })
    } finally {
      setSavingAccount(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {language === 'es' ? 'Configuración' : 'Settings'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'es'
            ? 'Administra tu cuenta y preferencias'
            : 'Manage your account and preferences'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {language === 'es' ? 'Cuenta' : 'Account'}
          </h2>

          {/* Current Info */}
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {language === 'es' ? 'Usuario actual:' : 'Current username:'} <span className="font-medium text-gray-900 dark:text-gray-100">{user?.username}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'es' ? 'Email actual:' : 'Current email:'} <span className="font-medium text-gray-900 dark:text-gray-100">{user?.email}</span>
            </p>
          </div>

          {/* Change Email */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              {language === 'es' ? 'Cambiar Email' : 'Change Email'}
            </label>
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
              variant="secondary"
              className="w-full"
            >
              {savingAccount ? (language === 'es' ? 'Guardando...' : 'Saving...') : (language === 'es' ? 'Actualizar Email' : 'Update Email')}
            </Button>
          </div>

          {/* Change Username */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              {language === 'es' ? 'Cambiar Usuario' : 'Change Username'}
            </label>
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
              variant="secondary"
              className="w-full"
            >
              {savingAccount ? (language === 'es' ? 'Guardando...' : 'Saving...') : (language === 'es' ? 'Actualizar Usuario' : 'Update Username')}
            </Button>
          </div>

          {/* Change Password */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              {language === 'es' ? 'Cambiar Contraseña' : 'Change Password'}
            </label>
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
              variant="secondary"
              className="w-full"
            >
              {savingAccount ? (language === 'es' ? 'Guardando...' : 'Saving...') : (language === 'es' ? 'Actualizar Contraseña' : 'Update Password')}
            </Button>
          </div>

          {/* Account Message */}
          {accountMessage && (
            <div
              className={`p-4 rounded-lg ${
                accountMessage.type === 'success'
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}
            >
              {accountMessage.text}
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {language === 'es' ? 'Preferencias' : 'Preferences'}
          </h2>

        {/* Language Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            {language === 'es' ? 'Idioma' : 'Language'}
          </label>
          <div className="space-y-2">
            {languages.map((lang) => (
              <label
                key={lang.code}
                className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <input
                  type="radio"
                  name="language"
                  value={lang.code}
                  checked={selectedLanguage === lang.code}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="ml-3 text-gray-900 dark:text-gray-100">
                  {lang.flag} {lang.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Theme Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            {language === 'es' ? 'Tema' : 'Theme'}
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={selectedTheme === 'light'}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-3 text-gray-900 dark:text-gray-100">
                ☀️ {language === 'es' ? 'Claro' : 'Light'}
              </span>
            </label>
            <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={selectedTheme === 'dark'}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-3 text-gray-900 dark:text-gray-100">
                🌙 {language === 'es' ? 'Oscuro' : 'Dark'}
              </span>
            </label>
          </div>
        </div>

        {/* Date Format Setting */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            {language === 'es' ? 'Formato de Fecha' : 'Date Format'}
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="dateFormat"
                value="DD/MM/YYYY"
                checked={selectedDateFormat === 'DD/MM/YYYY'}
                onChange={(e) => setSelectedDateFormat(e.target.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-3 text-gray-900 dark:text-gray-100">
                DD/MM/YYYY (16/12/2025)
              </span>
            </label>
            <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="dateFormat"
                value="MM/DD/YYYY"
                checked={selectedDateFormat === 'MM/DD/YYYY'}
                onChange={(e) => setSelectedDateFormat(e.target.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-3 text-gray-900 dark:text-gray-100">
                MM/DD/YYYY (12/16/2025)
              </span>
            </label>
            <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="dateFormat"
                value="YYYY/MM/DD"
                checked={selectedDateFormat === 'YYYY/MM/DD'}
                onChange={(e) => setSelectedDateFormat(e.target.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-3 text-gray-900 dark:text-gray-100">
                YYYY/MM/DD (2025/12/16)
              </span>
            </label>
          </div>

          {/* Show Relative Time Checkbox */}
          <div className="mt-4">
            <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={showRelativeTime}
                onChange={(e) => setShowRelativeTime(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-3 text-gray-900 dark:text-gray-100">
                {language === 'es' ? 'Mostrar tiempo relativo al lado de fechas' : 'Show relative time next to dates'}
              </span>
            </label>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 ml-3">
              {language === 'es' ? 'Ejemplo: 16/12/2025 (hace 2 horas)' : 'Example: 12/16/2025 (2 hours ago)'}
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="primary"
            className="w-full"
          >
            {saving
              ? (language === 'es' ? 'Guardando...' : 'Saving...')
              : (language === 'es' ? 'Guardar Preferencias' : 'Save Preferences')}
          </Button>
        </div>
      </div>
    </div>
    </div>
  )
}

export default Settings

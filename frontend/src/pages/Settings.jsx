import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useDateFormat } from '../contexts/DateFormatContext'
import Button from '../components/common/Button'
import api from '../services/api'

// Default Pokemon avatars from PokeAPI sprites
const DEFAULT_AVATARS = [
  { id: 25, name: 'Pikachu', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
  { id: 1, name: 'Bulbasaur', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
  { id: 4, name: 'Charmander', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
  { id: 7, name: 'Squirtle', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
  { id: 133, name: 'Eevee', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png' },
  { id: 150, name: 'Mewtwo', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png' },
  { id: 151, name: 'Mew', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png' },
  { id: 39, name: 'Jigglypuff', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png' },
  { id: 143, name: 'Snorlax', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png' },
  { id: 6, name: 'Charizard', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png' },
  { id: 94, name: 'Gengar', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png' },
  { id: 131, name: 'Lapras', url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png' },
]

// Background gradient options
const BACKGROUND_GRADIENTS = [
  { id: 'primary', gradient: 'from-primary-400 to-primary-600', name: 'Primary' },
  { id: 'red', gradient: 'from-red-400 to-red-600', name: 'Fire' },
  { id: 'blue', gradient: 'from-blue-400 to-blue-600', name: 'Water' },
  { id: 'green', gradient: 'from-green-400 to-green-600', name: 'Grass' },
  { id: 'yellow', gradient: 'from-yellow-400 to-yellow-600', name: 'Electric' },
  { id: 'purple', gradient: 'from-purple-400 to-purple-600', name: 'Psychic' },
  { id: 'pink', gradient: 'from-pink-400 to-pink-600', name: 'Fairy' },
  { id: 'gray', gradient: 'from-gray-400 to-gray-600', name: 'Steel' },
  { id: 'orange', gradient: 'from-orange-400 to-orange-600', name: 'Fighting' },
  { id: 'teal', gradient: 'from-teal-400 to-teal-600', name: 'Ice' },
  { id: 'indigo', gradient: 'from-indigo-400 to-indigo-600', name: 'Ghost' },
  { id: 'amber', gradient: 'from-amber-400 to-amber-600', name: 'Ground' },
  { id: 'rainbow', gradient: 'from-red-500 via-yellow-500 to-blue-500', name: 'Rainbow' },
  { id: 'sunset', gradient: 'from-orange-400 via-pink-500 to-purple-600', name: 'Sunset' },
  { id: 'ocean', gradient: 'from-cyan-400 via-blue-500 to-indigo-600', name: 'Ocean' },
  { id: 'forest', gradient: 'from-green-400 via-emerald-500 to-teal-600', name: 'Forest' },
]

const Settings = () => {
  const { user, isAuthenticated, updateUser } = useAuth()
  const { language } = useLanguage()
  const { dateFormat, changeDateFormat } = useDateFormat()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Profile settings
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || DEFAULT_AVATARS[0].url)
  const [selectedBackground, setSelectedBackground] = useState(user?.avatarBackground || BACKGROUND_GRADIENTS[0].gradient)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [avatarTab, setAvatarTab] = useState('pokemon') // 'pokemon' | 'background'
  const [pokemonSearch, setPokemonSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimeoutRef = useRef(null)

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
    if (user?.avatarBackground) {
      setSelectedBackground(user.avatarBackground)
    }
  }, [user?.avatar, user?.avatarBackground])

  // Pokemon search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (pokemonSearch.trim().length < 2) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Search Pokemon by name using PokeAPI
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1500`)
        const data = await response.json()

        const searchLower = pokemonSearch.toLowerCase()
        const matches = data.results
          .filter(p => p.name.includes(searchLower))
          .slice(0, 20)
          .map(p => {
            const id = p.url.split('/').filter(Boolean).pop()
            return {
              id: parseInt(id),
              name: p.name.charAt(0).toUpperCase() + p.name.slice(1).replace(/-/g, ' '),
              url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            }
          })

        setSearchResults(matches)
      } catch (error) {
        console.error('Error searching Pokemon:', error)
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [pokemonSearch])

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
      const response = await api.put('/auth/avatar', {
        avatar: selectedAvatar,
        avatarBackground: selectedBackground
      })
      if (response.data.success && updateUser) {
        updateUser({ ...user, avatar: selectedAvatar, avatarBackground: selectedBackground })
      }
      setMessage({
        type: 'success',
        text: language === 'es' ? 'Avatar actualizado' : 'Avatar updated'
      })
      setShowAvatarPicker(false)
      setPokemonSearch('')
      setSearchResults([])
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
              className={`w-24 h-24 rounded-full bg-gradient-to-br ${selectedBackground} flex items-center justify-center cursor-pointer hover:ring-4 hover:ring-primary-300 transition-all overflow-hidden`}
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
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAvatarTab('pokemon')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  avatarTab === 'pokemon'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {language === 'es' ? 'Pokemon' : 'Pokemon'}
              </button>
              <button
                onClick={() => setAvatarTab('background')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  avatarTab === 'background'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {language === 'es' ? 'Fondo' : 'Background'}
              </button>
            </div>

            {/* Pokemon Tab */}
            {avatarTab === 'pokemon' && (
              <div>
                {/* Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={pokemonSearch}
                    onChange={(e) => setPokemonSearch(e.target.value)}
                    placeholder={language === 'es' ? 'Buscar Pokemon...' : 'Search Pokemon...'}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Search Results */}
                {searchLoading && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    {language === 'es' ? 'Buscando...' : 'Searching...'}
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {language === 'es' ? 'Resultados' : 'Results'}
                    </h4>
                    <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                      {searchResults.map((pokemon) => (
                        <button
                          key={pokemon.id}
                          onClick={() => setSelectedAvatar(pokemon.url)}
                          className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                            selectedAvatar === pokemon.url
                              ? 'bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-500'
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          title={pokemon.name}
                        >
                          <img src={pokemon.url} alt={pokemon.name} className="w-10 h-10" />
                          <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">
                            {pokemon.name.length > 8 ? pokemon.name.slice(0, 8) + '...' : pokemon.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Default Avatars */}
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {language === 'es' ? 'Pokemon Populares' : 'Popular Pokemon'}
                </h4>
                <div className="grid grid-cols-6 gap-3 mb-4">
                  {DEFAULT_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.url)}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                        selectedAvatar === avatar.url
                          ? 'border-primary-500 ring-2 ring-primary-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-400'
                      }`}
                      title={avatar.name}
                    >
                      <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background Tab */}
            {avatarTab === 'background' && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {language === 'es' ? 'Elige un fondo' : 'Choose a background'}
                </h4>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {BACKGROUND_GRADIENTS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBackground(bg.gradient)}
                      className={`relative h-16 rounded-lg bg-gradient-to-br ${bg.gradient} transition-all ${
                        selectedBackground === bg.gradient
                          ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800'
                          : 'hover:opacity-80'
                      }`}
                      title={bg.name}
                    >
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-white font-medium drop-shadow-lg">
                        {bg.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${selectedBackground} flex items-center justify-center overflow-hidden`}>
                    {selectedAvatar ? (
                      <img src={selectedAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {language === 'es' ? 'Vista previa' : 'Preview'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {language === 'es' ? 'Asi se vera tu avatar' : 'This is how your avatar will look'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSaveAvatar} disabled={saving} variant="primary" className="flex-1">
                {saving ? '...' : (language === 'es' ? 'Guardar Avatar' : 'Save Avatar')}
              </Button>
              <Button onClick={() => { setShowAvatarPicker(false); setPokemonSearch(''); setSearchResults([]) }} variant="secondary">
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

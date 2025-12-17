import { useTheme } from '../../contexts/ThemeContext'

const ThemeSwitcher = () => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      data-theme={theme}
    >
      <div className="theme-toggle-track">
        {/* Sun/Moon thumb with inner moon style */}
        <div className={`theme-toggle-thumb ${isDark ? 'is-dark' : 'is-light'}`}>
          {/* Crater for moon effect */}
          <div className="theme-toggle-crater"></div>
          {/* Sun rays */}
          <div className="theme-toggle-rays">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="theme-toggle-ray" style={{ '--ray-index': i }} />
            ))}
          </div>
        </div>
        {/* Stars in the track (visible in dark mode) */}
        <div className="theme-toggle-stars">
          <span className="star star-1" />
          <span className="star star-2" />
          <span className="star star-3" />
        </div>
      </div>
    </button>
  )
}

export default ThemeSwitcher

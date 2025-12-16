/**
 * Theme Configuration
 * Centralized color palettes for Light and Dark modes
 *
 * Modify these values to customize the appearance of both themes
 */

export const themeConfig = {
  light: {
    // Background colors
    bg: {
      primary: '#ffffff',     // Main background
      secondary: '#f9fafb',   // Secondary background (cards, sections)
      tertiary: '#f3f4f6',    // Tertiary background (hover states)
      inverse: '#111827'      // Text on dark backgrounds
    },

    // Text colors
    text: {
      primary: '#111827',     // Main text
      secondary: '#6b7280',   // Secondary text
      tertiary: '#9ca3af',    // Tertiary text (hints, placeholders)
      inverse: '#ffffff',     // Text on dark backgrounds
      link: '#2563eb',        // Links
      linkHover: '#1d4ed8'    // Links hover
    },

    // Border colors
    border: {
      light: '#e5e7eb',       // Light borders
      medium: '#d1d5db',      // Medium borders
      dark: '#9ca3af',        // Dark borders
      focus: '#3b82f6'        // Focus state
    },

    // Component specific
    card: {
      bg: '#ffffff',
      border: '#e5e7eb',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    },

    header: {
      bg: '#ffffff',
      text: '#111827',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
    },

    button: {
      primary: {
        bg: '#3b82f6',
        bgHover: '#2563eb',
        text: '#ffffff'
      },
      secondary: {
        bg: '#f3f4f6',
        bgHover: '#e5e7eb',
        text: '#111827'
      },
      ghost: {
        bg: 'transparent',
        bgHover: '#f3f4f6',
        text: '#6b7280'
      }
    }
  },

  dark: {
    // Background colors
    bg: {
      primary: '#111827',     // Main background
      secondary: '#1f2937',   // Secondary background (cards, sections)
      tertiary: '#374151',    // Tertiary background (hover states)
      inverse: '#f9fafb'      // Text on light backgrounds
    },

    // Text colors
    text: {
      primary: '#f9fafb',     // Main text
      secondary: '#d1d5db',   // Secondary text
      tertiary: '#9ca3af',    // Tertiary text (hints, placeholders)
      inverse: '#111827',     // Text on light backgrounds
      link: '#60a5fa',        // Links
      linkHover: '#93c5fd'    // Links hover
    },

    // Border colors
    border: {
      light: '#374151',       // Light borders
      medium: '#4b5563',      // Medium borders
      dark: '#6b7280',        // Dark borders
      focus: '#60a5fa'        // Focus state
    },

    // Component specific
    card: {
      bg: '#1f2937',
      border: '#374151',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)'
    },

    header: {
      bg: '#1f2937',
      text: '#f9fafb',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)'
    },

    button: {
      primary: {
        bg: '#3b82f6',
        bgHover: '#2563eb',
        text: '#ffffff'
      },
      secondary: {
        bg: '#374151',
        bgHover: '#4b5563',
        text: '#f9fafb'
      },
      ghost: {
        bg: 'transparent',
        bgHover: '#374151',
        text: '#d1d5db'
      }
    }
  }
}

/**
 * Get color value from theme config
 * @param {string} theme - 'light' or 'dark'
 * @param {string} path - Dot-separated path (e.g., 'bg.primary')
 * @returns {string} Color value
 */
export function getThemeColor(theme, path) {
  const keys = path.split('.')
  let value = themeConfig[theme]

  for (const key of keys) {
    value = value?.[key]
  }

  return value || '#000000'
}

export default themeConfig

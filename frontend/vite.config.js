import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git commit hash at build time
// Priority: VERCEL_GIT_COMMIT_SHA > git command > 'dev'
const getGitCommitHash = () => {
  // Debug: Log available Vercel environment variables during build
  if (process.env.VERCEL) {
    console.log('[vite-build] Running on Vercel')
    console.log('[vite-build] VERCEL_GIT_COMMIT_SHA:', process.env.VERCEL_GIT_COMMIT_SHA || 'not set')
    console.log('[vite-build] VERCEL_GIT_COMMIT_REF:', process.env.VERCEL_GIT_COMMIT_REF || 'not set')
  }

  // Vercel provides this during build (full SHA)
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7)
  }

  // Try git command (local development or CI environments with git)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    // Git not available
  }

  return 'dev'
}

export default defineConfig({
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})

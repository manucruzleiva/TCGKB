// Simple logger utility
const log = {
  info: (module, message, data = {}) => {
    console.log(`[${new Date().toISOString()}] [${module}] INFO: ${message}`, data)
  },

  error: (module, message, error = null) => {
    console.error(`[${new Date().toISOString()}] [${module}] ERROR: ${message}`)
    if (error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        ...(error.response && {
          status: error.response.status,
          data: error.response.data
        })
      })
    }
  },

  warn: (module, message, data = {}) => {
    console.warn(`[${new Date().toISOString()}] [${module}] WARN: ${message}`, data)
  },

  perf: (module, operation, duration) => {
    console.log(`[${new Date().toISOString()}] [${module}] PERF: ${operation} took ${duration}ms`)
  }
}

export default log

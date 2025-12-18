import axios from 'axios'

// Runtime API URL detection - evaluated when requests are made, not at build time
const getApiUrl = () => {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return isLocalhost ? 'http://localhost:3001/api' : '/api'
}

const api = axios.create({
  timeout: 60000, // 60 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to set baseURL dynamically and add token
api.interceptors.request.use(
  (config) => {
    // Set baseURL at request time (runtime, not build time)
    if (!config.baseURL) {
      config.baseURL = getApiUrl()
    }
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

import api from './api'

export const authService = {
  register: async (email, username, password) => {
    const response = await api.post('/auth/register', {
      email,
      username,
      password
    })
    return response.data
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    })
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

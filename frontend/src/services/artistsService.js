import api from './api'

export const artistsService = {
  // Get artist info (fan count and user's fan status)
  getArtistInfo: async (artistName) => {
    const response = await api.get(`/artists/info/${encodeURIComponent(artistName)}`)
    return response.data
  },

  // Toggle fan status
  toggleFan: async (artistName) => {
    const response = await api.post('/artists/toggle-fan', { artistName })
    return response.data
  },

  // Get top artists
  getTopArtists: async (limit = 20) => {
    const response = await api.get('/artists/top', { params: { limit } })
    return response.data
  },

  // Get user's favorite artists
  getMyFavorites: async () => {
    const response = await api.get('/artists/my-favorites')
    return response.data
  },

  // Batch check fan status
  batchCheckStatus: async (artistNames) => {
    const response = await api.post('/artists/batch-status', { artistNames })
    return response.data
  }
}

export default artistsService

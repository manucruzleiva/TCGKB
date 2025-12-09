import api from './api'

export const reactionService = {
  getReactions: async (targetType, targetId) => {
    const response = await api.get(`/reactions/${targetType}/${targetId}`)
    return response.data
  },

  addReaction: async (targetType, targetId, emoji) => {
    const response = await api.post('/reactions', {
      targetType,
      targetId,
      emoji
    })
    return response.data
  },

  removeReaction: async (targetType, targetId, emoji) => {
    const response = await api.delete('/reactions', {
      data: {
        targetType,
        targetId,
        emoji
      }
    })
    return response.data
  }
}

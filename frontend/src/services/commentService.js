import api from './api'

export const commentService = {
  getCommentsByCard: async (cardId, page = 1, pageSize = 50, sortBy = 'newest') => {
    const response = await api.get(`/comments/${cardId}`, {
      params: { page, pageSize, sortBy }
    })
    return response.data
  },

  getCommentsByDeck: async (deckId, page = 1, pageSize = 50, sortBy = 'newest') => {
    const response = await api.get(`/comments/deck/${deckId}`, {
      params: { page, pageSize, sortBy }
    })
    return response.data
  },

  createComment: async (cardId, content, parentId = null, cardMentions = [], deckMentions = []) => {
    const response = await api.post('/comments', {
      cardId,
      content,
      parentId,
      cardMentions,
      deckMentions
    })
    return response.data
  },

  createDeckComment: async (deckId, content, parentId = null, cardMentions = [], deckMentions = []) => {
    const response = await api.post('/comments', {
      deckId,
      targetType: 'deck',
      content,
      parentId,
      cardMentions,
      deckMentions
    })
    return response.data
  },

  getCommentReplies: async (commentId) => {
    const response = await api.get(`/comments/${commentId}/replies`)
    return response.data
  },

  hideComment: async (commentId, isHidden) => {
    const response = await api.patch(`/comments/${commentId}/hide`, {
      isHidden
    })
    return response.data
  },

  moderateComment: async (commentId, isModerated, reason = null) => {
    const response = await api.patch(`/comments/${commentId}/moderate`, {
      isModerated,
      reason
    })
    return response.data
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`)
    return response.data
  }
}

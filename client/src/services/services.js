import api from './api';

export const itemService = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  getTrending: () => api.get('/items/trending'),
  getRecentReturned: () => api.get('/items/recent-returned'),
  getUserItems: (userId, params) => api.get(`/items/user/${userId}`, { params }),
  getQR: (id) => api.get(`/items/${id}/qr`),

  create: (formData) => api.post('/items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  updateStatus: (id, status) => api.put(`/items/${id}/status`, { status }),

  // Likes
  toggleLike: (id) => api.post(`/items/${id}/like`),
  getLikes: (id) => api.get(`/items/${id}/likes`),

  // Comments
  getComments: (id) => api.get(`/items/${id}/comments`),
  addComment: (id, content, parentId) => api.post(`/items/${id}/comments`, { content, parent_id: parentId }),
  deleteComment: (id) => api.delete(`/comments/${id}`),

  // Bookmarks
  toggleBookmark: (id) => api.post(`/items/${id}/bookmark`),

  // Shares
  trackShare: (id, platform) => api.post(`/items/${id}/share`, { platform }),

  // Claims
  submitClaim: (id, formData) => api.post(`/items/${id}/claim`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Reports
  report: (id, reason, description) => api.post(`/items/${id}/report`, { reason, description }),
};

export const searchService = {
  imageSearch: (formData) => api.post('/search/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  textSearch: (params) => api.get('/search', { params }),
};

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  updateAvatar: (formData) => api.put('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const claimService = {
  getReceived: () => api.get('/claims/received'),
  getSent: () => api.get('/claims/sent'),
  update: (id, status) => api.put(`/claims/${id}`, { status }),
};

export const bookmarkService = {
  getAll: () => api.get('/bookmarks'),
};

export const messageService = {
  send: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations'),
  getConversation: (userId) => api.get(`/messages/${userId}`),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleBan: (id) => api.put(`/admin/users/${id}/ban`),
  deleteItem: (id) => api.delete(`/admin/items/${id}`),
  getReports: () => api.get('/admin/reports'),
  updateReport: (id, status) => api.put(`/admin/reports/${id}`, { status }),
};

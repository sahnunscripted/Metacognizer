import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Actions API
export const actionsApi = {
  getAll: (params) => api.get('/actions', { params }),
  getOne: (id) => api.get(`/actions/${id}`),
  create: (data) => api.post('/actions', data),
  update: (id, data) => api.put(`/actions/${id}`, data),
  delete: (id) => api.delete(`/actions/${id}`),
  complete: (id) => api.post(`/actions/${id}/complete`)
};

// Projects API
export const projectsApi = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id, deleteActions = false) => api.delete(`/projects/${id}`, { params: { deleteActions } }),
  addAction: (id, data) => api.post(`/projects/${id}/actions`, data),
  getCategories: () => api.get('/projects/meta/categories')
};

// Braindump API
export const braindumpApi = {
  getAll: (params) => api.get('/braindump', { params }),
  getOne: (id) => api.get(`/braindump/${id}`),
  create: (data) => api.post('/braindump', data),
  createBulk: (items) => api.post('/braindump/bulk', { items }),
  update: (id, data) => api.put(`/braindump/${id}`, data),
  delete: (id) => api.delete(`/braindump/${id}`),
  process: (id, convertTo, data) => api.post(`/braindump/${id}/process`, { convertTo, data }),
  getUnprocessedCount: () => api.get('/braindump/meta/unprocessed-count')
};

// Inbasket API
export const inbasketApi = {
  getAll: (params) => api.get('/inbasket', { params }),
  getOne: (id) => api.get(`/inbasket/${id}`),
  create: (data) => api.post('/inbasket', data),
  update: (id, data) => api.put(`/inbasket/${id}`, data),
  delete: (id) => api.delete(`/inbasket/${id}`),
  process: (id, decision, data) => api.post(`/inbasket/${id}/process`, { decision, data }),
  getUnprocessedCount: () => api.get('/inbasket/meta/unprocessed-count')
};

// Someday API
export const somedayApi = {
  getAll: (params) => api.get('/someday', { params }),
  getOne: (id) => api.get(`/someday/${id}`),
  create: (data) => api.post('/someday', data),
  update: (id, data) => api.put(`/someday/${id}`, data),
  delete: (id) => api.delete(`/someday/${id}`),
  activate: (id, activateTo, data) => api.post(`/someday/${id}/activate`, { activateTo, data }),
  review: (id) => api.post(`/someday/${id}/review`),
  getNeedsReview: () => api.get('/someday/meta/needs-review')
};

// Stats API
export const statsApi = {
  get: () => api.get('/stats'),
  getStreak: () => api.get('/stats/streak'),
  getPoints: () => api.get('/stats/points'),
  getAchievements: () => api.get('/stats/achievements'),
  getActivity: (days) => api.get('/stats/activity', { params: { days } }),
  checkin: () => api.post('/stats/checkin')
};

export default api;

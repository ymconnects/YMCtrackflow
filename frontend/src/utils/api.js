 import axios from 'axios'

const BASE_URL = 'https://ymctrackflow.onrender.com'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const getToken = () => {
  return localStorage.getItem('token')
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const login = (username, password) => {
  return api.post('/login', { username, password })
}

export const logout = () => {
  return api.post('/logout')
}

export const getMe = () => {
  return api.get('/me')
}

export const getStatus = () => {
  return api.get('/status')
}

export const getOrders = () => {
  return api.get('/orders')
}

export const syncOrders = () => {
  return api.post('/sync')
}

export const runNow = () => {
  return api.post('/run-now')
}

export const retryFailed = () => {
  return api.post('/retry-failed')
}

export const retrySingle = (order) => {
  return api.post('/retry-single', order)
}

export const toggleAutoMessage = (enabled) => {
  return api.post('/toggle-auto-message', { enabled })
}

export const toggleSystem = (enabled) => {
  return api.post('/toggle-system', { 
    action: enabled ? 'start' : 'stop' 
  })
}

export const getAutoMessageStatus = () => {
  return api.get('/auto-message-status')
}

export const uploadContacts = (formData) => {
  return api.post('/campaigns/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getContactBooks = () => {
  return api.get('/campaigns/books')
}

export const createCampaign = (data) => {
  return api.post('/campaigns/create', data)
}

export const sendCampaign = (campaignId) => {
  return api.post(`/campaigns/send/${campaignId}`)
}

export const retryCampaign = (campaignId, recipientId) => {
  return api.post(`/campaigns/${campaignId}/retry`, recipientId ? { recipient_id: recipientId } : {})
}

export const getBookColumns = (bookId) => {
  return api.get(`/campaigns/books/${bookId}/columns`)
}

export const getCampaignStatus = (campaignId) => {
  return api.get(`/campaigns/status/${campaignId}`)
}

export const getBookContacts = (bookId) => {
  return api.get(`/campaigns/books/${bookId}/contacts`)
}

export const deleteContactBook = (bookId) =>
  api.delete(`/campaigns/books/${bookId}`)

export const getCampaignHistory = () =>
  api.get('/campaigns/history')

export const deleteCampaign = (campaignId) =>
  api.delete(`/campaigns/${campaignId}`)

export const getCampaignRecipients = (campaignId) => {
  return api.get(`/campaigns/${campaignId}/recipients`)
}

export const getLogs = () => {
  return api.get('/logs')
}

export const updateSettings = (data) => {
  return api.post('/update-settings', data)
}

export const saveToken = (token) => {
  localStorage.setItem('token', token)
}

export const removeToken = () => {
  localStorage.removeItem('token')
}

export const getTemplates = () => {
  return api.get('/templates')
}

export const deleteTemplate = (name) => {
  return api.delete(`/templates/delete?name=${name}`)
}

export const createTemplate = (data) => {
  return api.post('/templates/create', data)
}
export default api

 import axios from 'axios'

const BASE_URL = 'http://localhost:5000'

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

export const runNow = () => {
  return api.post('/run-now')
}

export const retryFailed = () => {
  return api.post('/retry-failed')
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

export const getCampaigns = () => {
  return api.get('/campaigns')
}

export const createCampaign = (data) => {
  return api.post('/campaigns/create', data)
}

export const sendCampaign = (campaignId) => {
  return api.post(`/campaigns/${campaignId}/send`)
}

export const cancelCampaign = (campaignId) => {
  return api.post(`/campaigns/${campaignId}/cancel`)
}

export const getCampaignReport = (campaignId) => {
  return api.get(`/campaigns/${campaignId}/report`)
}

export const estimateAudience = (filters) => {
  return api.post('/audience/estimate', filters)
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

export default api

import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

// API functions
export const roomsAPI = {
  getAll: (params?: any) => api.get('/rooms', { params }),
  getById: (id: string) => api.get(`/rooms/${id}`),
  create: (data: any) => api.post('/rooms', data),
  update: (id: string, data: any) => api.put(`/rooms/${id}`, data),
  delete: (id: string) => api.delete(`/rooms/${id}`),
  updateAvailability: (id: string, data: any) => api.put(`/rooms/${id}/availability`, data),
  updateSchedule: (id: string, data: any) => api.put(`/rooms/${id}/schedule`, data),
  book: (id: string, data: any) => api.post(`/rooms/${id}/book`, data),
  getBookings: (id: string) => api.get(`/rooms/${id}/bookings`),
}

export const eventsAPI = {
  getAll: (params?: any) => api.get('/events', { params }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  register: (id: string, data?: any) => api.post(`/events/${id}/register`, data),
}

export const facultyAPI = {
  getAll: (params?: any) => api.get('/faculty', { params }),
  getById: (id: string) => api.get(`/faculty/${id}`),
  create: (data: any) => api.post('/faculty', data),
  update: (id: string, data: any) => api.put(`/faculty/${id}`, data),
  updateAvailability: (id: string, data: any) => api.put(`/faculty/${id}/availability`, data),
}

export const resourcesAPI = {
  getAll: (params?: any) => api.get('/resources', { params }),
  getById: (id: string) => api.get(`/resources/${id}`),
  create: (data: any) => api.post('/resources', data),
  update: (id: string, data: any) => api.put(`/resources/${id}`, data),
  delete: (id: string) => api.delete(`/resources/${id}`),
  reserve: (id: string, data: any) => api.post(`/resources/${id}/reserve`, data),
  updateStatus: (id: string, data: any) => api.put(`/resources/${id}/status`, data),
}


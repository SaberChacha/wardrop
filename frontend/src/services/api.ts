import axios from 'axios'

// Get API base URL - use current origin to ensure same protocol (HTTP/HTTPS)
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  return '/api'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  },
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Clients
export const clientsAPI = {
  getAll: async (params?: { skip?: number; limit?: number; search?: string }) => {
    const response = await api.get('/clients', { params })
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/clients/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/clients', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/clients/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/clients/${id}`)
    return response.data
  },
}

// Dresses
export const dressesAPI = {
  getAll: async (params?: { skip?: number; limit?: number; search?: string; status?: string; category?: string; size?: string }) => {
    const response = await api.get('/dresses', { params })
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/dresses/${id}`)
    return response.data
  },
  create: async (formData: FormData) => {
    const response = await api.post('/dresses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/dresses/${id}`, data)
    return response.data
  },
  uploadImages: async (id: number, formData: FormData) => {
    const response = await api.post(`/dresses/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  deleteImage: async (dressId: number, imageId: number) => {
    const response = await api.delete(`/dresses/${dressId}/images/${imageId}`)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/dresses/${id}`)
    return response.data
  },
}

// Clothing
export const clothingAPI = {
  getAll: async (params?: { skip?: number; limit?: number; search?: string; category?: string; size?: string; in_stock?: boolean }) => {
    const response = await api.get('/clothing', { params })
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/clothing/${id}`)
    return response.data
  },
  create: async (formData: FormData) => {
    const response = await api.post('/clothing', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/clothing/${id}`, data)
    return response.data
  },
  uploadImages: async (id: number, formData: FormData) => {
    const response = await api.post(`/clothing/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  deleteImage: async (clothingId: number, imageId: number) => {
    const response = await api.delete(`/clothing/${clothingId}/images/${imageId}`)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/clothing/${id}`)
    return response.data
  },
}

// Bookings
export const bookingsAPI = {
  getAll: async (params?: { skip?: number; limit?: number; status?: string; deposit_status?: string; client_id?: number; dress_id?: number; start_date?: string; end_date?: string }) => {
    const response = await api.get('/bookings', { params })
    return response.data
  },
  getCalendar: async (start: string, end: string, dress_id?: number) => {
    const response = await api.get('/bookings/calendar', { params: { start, end, dress_id } })
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/bookings/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/bookings', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/bookings/${id}`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/bookings/${id}`)
    return response.data
  },
}

// Sales
export const salesAPI = {
  getAll: async (params?: { skip?: number; limit?: number; client_id?: number; clothing_id?: number; start_date?: string; end_date?: string }) => {
    const response = await api.get('/sales', { params })
    return response.data
  },
  getById: async (id: number) => {
    const response = await api.get(`/sales/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/sales', data)
    return response.data
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/sales/${id}`, data)
    return response.data
  },
  delete: async (id: number, restore_stock: boolean = true) => {
    const response = await api.delete(`/sales/${id}`, { params: { restore_stock } })
    return response.data
  },
}

// Reports
export const reportsAPI = {
  getDashboard: async () => {
    const response = await api.get('/reports/dashboard')
    return response.data
  },
  getEarnings: async (params?: { start_date?: string; end_date?: string; period?: string }) => {
    const response = await api.get('/reports/earnings', { params })
    return response.data
  },
  getTopDresses: async (params?: { limit?: number; start_date?: string; end_date?: string }) => {
    const response = await api.get('/reports/top-dresses', { params })
    return response.data
  },
  getTopClients: async (params?: { limit?: number; start_date?: string; end_date?: string }) => {
    const response = await api.get('/reports/top-clients', { params })
    return response.data
  },
}

// Export/Import
export const exportAPI = {
  exportClients: async () => {
    const response = await api.get('/export/clients', { responseType: 'blob' })
    return response.data
  },
  exportDresses: async () => {
    const response = await api.get('/export/dresses', { responseType: 'blob' })
    return response.data
  },
  exportClothing: async () => {
    const response = await api.get('/export/clothing', { responseType: 'blob' })
    return response.data
  },
  exportBookings: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await api.get('/export/bookings', { responseType: 'blob', params })
    return response.data
  },
  exportSales: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await api.get('/export/sales', { responseType: 'blob', params })
    return response.data
  },
  exportCommercialReport: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await api.get('/export/commercial-report', { responseType: 'blob', params })
    return response.data
  },
  importClients: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/export/import/clients', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  importDresses: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/export/import/dresses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  importClothing: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/export/import/clothing', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

export default api


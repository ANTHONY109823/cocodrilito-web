import axios from 'axios'
import { useAuthStore } from '@/lib/store/authStore'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
})

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/Auth/refresh`,
          {},
          { withCredentials: true }
        )
        return apiClient(original)
      } catch {
        useAuthStore.getState().clearUser()
        if (typeof window !== 'undefined') window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

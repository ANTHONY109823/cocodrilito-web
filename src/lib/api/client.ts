import axios from 'axios'
import { useAuthStore } from '@/lib/store/authStore'
import { redirectToLogin } from '@/lib/auth/logoutRedirect'
import { resolveApiBaseUrl } from './apiBaseUrl'

const apiClient = axios.create({
  withCredentials: true,
  timeout: 20_000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
})

apiClient.interceptors.request.use((config) => {
  config.baseURL = resolveApiBaseUrl()

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
    const isAuthEndpoint =
      typeof original?.url === 'string' &&
      (original.url.includes('/Auth/login') ||
        original.url.includes('/Auth/logout') ||
        original.url.includes('/Auth/refresh'))

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true
      try {
        await axios.post(
          `${resolveApiBaseUrl()}/Auth/refresh`,
          {},
          { withCredentials: true, timeout: 10_000 }
        )
        return apiClient(original)
      } catch {
        useAuthStore.getState().clearUser()
        redirectToLogin()
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

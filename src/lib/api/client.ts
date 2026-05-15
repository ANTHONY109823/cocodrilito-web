import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const accessToken = localStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token')
        if (!accessToken || !refreshToken) throw new Error('No tokens')
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/Auth/refresh`,
          { accessToken, refreshToken }
        )
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data
        localStorage.setItem('access_token', newAccess)
        localStorage.setItem('refresh_token', newRefresh)
        original.headers.Authorization = `Bearer ${newAccess}`
        return apiClient(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
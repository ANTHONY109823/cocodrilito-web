import apiClient from './client'

export const gamificationApi = {
  getMyStatus: () => apiClient.get('/gamification/me'),
  getGlobalRanking: (period = 'weekly') =>
    apiClient.get(`/rankings/global?period=${period}`),
  getMyRanking: (period = 'weekly') =>
    apiClient.get(`/rankings/me?period=${period}`),
}
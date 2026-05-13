import apiClient from './client'

export const examsApi = {
  start: (examId: string) =>
    apiClient.post(`/exams/${examId}/start`),
  submitAnswer: (sessionId: string, data: {
    questionId: string
    selectedOptionId: string | null
    timeSpentMs: number
  }) => apiClient.post(`/exams/sessions/${sessionId}/answer`, data),
  finish: (sessionId: string) =>
    apiClient.post(`/exams/sessions/${sessionId}/finish`),
  getResult: (sessionId: string) =>
    apiClient.get(`/exams/sessions/${sessionId}/result`),
  getLatestSession: () =>
    apiClient.get('/exams/sessions/latest'),
  getMyStats: () =>
    apiClient.get('/exams/sessions/stats'),
}
import apiClient from './client'

export const examsApi = {
  start: (examId: string, params?: { mode?: string; category?: string }) => {
    const qs = new URLSearchParams()
    if (params?.mode) qs.set('mode', params.mode)
    if (params?.category) qs.set('category', params.category)
    const query = qs.toString()
    return apiClient.post(`/exams/${examId}/start${query ? `?${query}` : ''}`)
  },
  getQuestionCounts: () =>
    apiClient.get('/exams/question-counts'),
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
  getCategoryStats: () =>
    apiClient.get('/exams/sessions/stats/categories'),
  getHistory: () =>
    apiClient.get('/exams/sessions/history'),
  getReviewSession: (sessionId: string) =>
    apiClient.get(`/exams/sessions/${sessionId}/review`),
}

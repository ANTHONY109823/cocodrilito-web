import apiClient from './client'

export const examsApi = {
  start: (examId: string, params?: { mode?: string; category?: string; questionCount?: number; track?: string }) => {
    const qs = new URLSearchParams()
    if (params?.mode) qs.set('mode', params.mode)
    if (params?.category) qs.set('category', params.category)
    if (params?.questionCount) qs.set('questionCount', String(params.questionCount))
    if (params?.track) qs.set('track', params.track)
    const query = qs.toString()
    return apiClient.post(`/exams/${examId}/start${query ? `?${query}` : ''}`)
  },
  getQuestionCounts: (track?: string) => {
    const qs = track ? `?track=${encodeURIComponent(track)}` : ''
    return apiClient.get(`/exams/question-counts${qs}`)
  },
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
  getHistory: (limit = 50) =>
    apiClient.get(`/exams/sessions/history?limit=${limit}`),
  getReviewSession: (sessionId: string) =>
    apiClient.get(`/exams/sessions/${sessionId}/review`),
}

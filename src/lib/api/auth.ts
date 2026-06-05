import apiClient from './client'
import type { AuthUser } from '@/lib/store/authStore'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  dni: string
  email: string
  password: string
  fullName: string
  rank: string
  unit: string
}

export type AuthProfileResponse = AuthUser

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthProfileResponse>('/Auth/login', data),
  register: (data: RegisterRequest) =>
    apiClient.post<AuthProfileResponse>('/Auth/register', data),
  logout: () => apiClient.post('/Auth/logout'),
  stopImpersonate: () => apiClient.post<AuthProfileResponse>('/Auth/stop-impersonate'),
  me: () => apiClient.get('/Auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/Auth/change-password', data),
}

import apiClient from './client'
import type { AuthUser } from '@/lib/store/authStore'

export interface LoginRequest {
  email: string
  password: string
  tenantSlug?: string | null
}

export type AuthProfileResponse = AuthUser

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthProfileResponse>('/Auth/login', data),
  logout: () => apiClient.post('/Auth/logout'),
  stopImpersonate: () => apiClient.post<AuthProfileResponse>('/Auth/stop-impersonate'),
  me: () => apiClient.get('/Auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/Auth/change-password', data),
}

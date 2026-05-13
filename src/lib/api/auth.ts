import apiClient from './client'

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

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: {
    id: string
    fullName: string
    email: string
    dni: string
    rank: string
    unit: string
    planType: string
    role: string
  }
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/Auth/login', data),
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/Auth/register', data),
}
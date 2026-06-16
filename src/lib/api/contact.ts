import apiClient from './client'

export interface JoinRequestPayload {
  fullName: string
  email: string
  institutionName: string
  phone?: string
  tenantType?: 'Agencia'
  message?: string
}

export const contactApi = {
  submitJoinRequest: (data: JoinRequestPayload) =>
    apiClient.post<{ message: string }>('/contact/join-request', data),
}

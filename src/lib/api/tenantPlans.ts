import apiClient from './client'

export interface TenantPlan {
  id: string
  tenantId: string
  trackType: string
  name: string
  price: number
  durationDays: number
  description?: string | null
  isActive: boolean
  createdAt: string
}

export interface TenantPlanPayload {
  trackType: number
  name: string
  price: number
  durationDays: number
  description?: string
  isActive?: boolean
}

export const tenantPlansApi = {
  list: (tenantId?: string) =>
    apiClient.get<TenantPlan[]>('/tenant/plans', {
      params: tenantId ? { tenantId } : undefined,
    }),
  create: (data: TenantPlanPayload, tenantId?: string) =>
    apiClient.post('/tenant/plans', data, {
      params: tenantId ? { tenantId } : undefined,
    }),
  update: (id: string, data: TenantPlanPayload, tenantId?: string) =>
    apiClient.put(`/tenant/plans/${id}`, data, {
      params: tenantId ? { tenantId } : undefined,
    }),
  deactivate: (id: string, tenantId?: string) =>
    apiClient.delete(`/tenant/plans/${id}`, {
      params: tenantId ? { tenantId } : undefined,
    }),
}

import apiClient from './client'

export interface DashboardStats {
  totalTenants: number
  activeTenants: number
  totalStudents: number
  agencias: { total: number; active: number; students: number }
  academias: { total: number; active: number; students: number }
  totalExamsToday: number
  totalExamsThisMonth: number
  pendingPayments: number
  monthlyRevenue: number
  topTenantsByActivity: { tenantId: string; tenantName: string; examsCompleted: number }[]
}

export interface TenantSummary {
  id: string
  name: string
  slug: string
  tenantType: string
  allowedTrackTypes: string[]
  students: number
  examsCompleted: number
  isActive: boolean
  suspended: boolean
  monthlyFee: number
  contactEmail: string
  createdAt: string
}

export interface TenantDetail {
  id: string
  name: string
  slug: string
  tenantType: string
  logoUrl?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  welcomeMessage?: string | null
  allowedTrackTypes: string[]
  gamificationEnabled: boolean
  rankingPublic: boolean
  certificatesEnabled: boolean
  flashcardsEnabled: boolean
  dailyChallengeEnabled: boolean
  monthlyFee: number
  contactEmail: string
  contactPhone?: string | null
  notes?: string | null
  isActive: boolean
  suspendedAt?: string | null
  suspendedReason?: string | null
  createdAt: string
}

export interface CreateTenantPayload {
  name: string
  slug?: string
  tenantType: string
  contactEmail: string
  contactPhone?: string
  monthlyFee: number
  primaryColor?: string
  welcomeMessage?: string
  gamificationEnabled?: boolean
  rankingPublic?: boolean
}

export interface ImpersonateResponse {
  accessToken: string
  expiresInMinutes: number
  tenantId: string
  tenantName: string
  impersonating: boolean
}

export const superadminApi = {
  getDashboard: () => apiClient.get<DashboardStats>('/superadmin/dashboard'),
  getTenants: () => apiClient.get<TenantSummary[]>('/superadmin/tenants'),
  getTenant: (id: string) => apiClient.get<TenantDetail>(`/superadmin/tenants/${id}`),
  createTenant: (data: CreateTenantPayload) => apiClient.post('/superadmin/tenants', data),
  updateTenant: (id: string, data: Partial<CreateTenantPayload & { notes?: string }>) =>
    apiClient.put(`/superadmin/tenants/${id}`, data),
  suspendTenant: (id: string, reason: string) =>
    apiClient.post(`/superadmin/tenants/${id}/suspend`, { reason }),
  reactivateTenant: (id: string) => apiClient.post(`/superadmin/tenants/${id}/reactivate`),
  impersonateTenant: (id: string) =>
    apiClient.post<ImpersonateResponse>(`/superadmin/tenants/${id}/impersonate`),
  getTenantUsers: (id: string) => apiClient.get(`/superadmin/tenants/${id}/users`),
  getTenantStats: (id: string) => apiClient.get(`/superadmin/tenants/${id}/stats`),
  registerPayment: (id: string, data: {
    amount: number
    periodStart: string
    periodEnd: string
    markAsPaid: boolean
    notes?: string
  }) => apiClient.post(`/superadmin/tenants/${id}/payments`, data),
  getUsers: (page = 1, pageSize = 50) =>
    apiClient.get('/superadmin/users', { params: { page, pageSize } }),
  getAuditLog: (page = 1, pageSize = 50) =>
    apiClient.get('/superadmin/audit-log', { params: { page, pageSize } }),
}

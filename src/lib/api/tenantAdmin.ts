import apiClient from './client'

export interface TenantProfile {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  primaryColor?: string
  tenantType: string
  contactEmail: string
  contactPhone?: string | null
  address?: string | null
  description?: string | null
}

export interface AdminDashboardData {
  totalUsers: number
  activeUsers: number
  examsCompleted: number
  passRate: number
  activeSubscriptions: number
  pendingSubscriptions: number
  ranking: {
    position: number
    userId: string
    fullName: string
    avgScore: number
    examsCount: number
  }[]
  recentAccess: {
    id: string
    fullName: string
    email: string
    lastLogin: string | null
    isActive: boolean
  }[]
}

export const tenantAdminApi = {
  getProfile: () => apiClient.get<TenantProfile>('/admin/tenant/profile'),
  updateProfile: (data: Partial<TenantProfile>) =>
    apiClient.put('/admin/tenant/profile', data),
  getDashboard: () => apiClient.get<AdminDashboardData>('/admin/dashboard'),
}

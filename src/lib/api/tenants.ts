import apiClient from './client'
import type { TenantLoginBranding } from '@/lib/constants/defaultLoginBranding'

export interface TenantConfig {
  name: string
  slug: string
  logoUrl?: string | null
  primaryColor?: string | null
  welcomeMessage?: string | null
  loginConfig?: Partial<TenantLoginBranding> | null
  tenantType: string
  allowedTrackTypes: string[]
  isActive: boolean
  modules: {
    gamification: boolean
    ranking: boolean
    certificates: boolean
    flashcards: boolean
    dailyChallenge: boolean
  }
}

export async function fetchTenantConfig(slug: string): Promise<TenantConfig | null> {
  try {
    const res = await apiClient.get<TenantConfig>(`/tenants/${slug}/config`)
    return res.data
  } catch {
    return null
  }
}

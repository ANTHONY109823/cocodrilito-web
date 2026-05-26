import { create } from 'zustand'

export interface AuthUser {
  id: string
  userId?: string
  fullName: string
  nombre?: string
  email: string
  dni: string
  rank: string
  unit: string
  planType: string
  role: string
  tenantId?: string | null
  tenantName?: string | null
  tenantType?: string | null
  tenantLogoUrl?: string | null
  allowedTrackTypes?: string[]
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  clearUser: () => void
  logout: () => void
  loadFromStorage: () => void
}

export function normalizeUser(data: Record<string, unknown>): AuthUser {
  const id = String(data.id ?? data.userId ?? '')
  return {
    id,
    userId: id,
    fullName: String(data.fullName ?? data.nombre ?? ''),
    nombre: String(data.nombre ?? data.fullName ?? ''),
    email: String(data.email ?? ''),
    dni: String(data.dni ?? ''),
    rank: String(data.rank ?? ''),
    unit: String(data.unit ?? ''),
    planType: String(data.planType ?? 'Free'),
    role: String(data.role ?? 'Student'),
    tenantId: data.tenantId != null ? String(data.tenantId) : null,
    tenantName: data.tenantName != null ? String(data.tenantName) : null,
    tenantType: data.tenantType != null ? String(data.tenantType) : null,
    tenantLogoUrl: data.tenantLogoUrl != null ? String(data.tenantLogoUrl) : null,
    allowedTrackTypes: Array.isArray(data.allowedTrackTypes)
      ? (data.allowedTrackTypes as string[])
      : [],
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  clearUser: () => {
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false })
  },

  logout: () => {
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false })
  },

  loadFromStorage: () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr) as Record<string, unknown>
        const user = normalizeUser(parsed)
        set({ user, isAuthenticated: true })
      } catch {
        localStorage.removeItem('user')
      }
    }
  },
}))

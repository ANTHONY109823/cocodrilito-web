import { create } from 'zustand'
import { QUESTION_TRACK_OPTIONS } from '@/lib/constants/trackTypes'

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
  tenantSlug?: string | null
  tenantType?: string | null
  tenantLogoUrl?: string | null
  allowedTrackTypes?: string[]
  activeTrackType?: string | null
  promotionGrade?: string | null
  promotionHierarchy?: string | null
  mustChangePassword?: boolean
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  clearUser: () => void
  logout: () => void
  loadFromStorage: () => void
}

function normalizeTrackKey(value: string | null | undefined): string | null {
  if (value == null || value === '') return null
  const trimmed = String(value).trim()
  const byValue = QUESTION_TRACK_OPTIONS.find((t) => String(t.value) === trimmed)
  if (byValue) return byValue.key
  const byKey = QUESTION_TRACK_OPTIONS.find((t) => t.key === trimmed)
  if (byKey) return byKey.key
  return trimmed
}

export function normalizeUser(data: Record<string, unknown>): AuthUser {
  const id = String(data.id ?? data.userId ?? '')
  const allowedTrackTypes = Array.isArray(data.allowedTrackTypes)
    ? (data.allowedTrackTypes as string[])
        .map((t) => normalizeTrackKey(String(t)))
        .filter((t): t is string => Boolean(t))
    : []
  const activeFromApi = normalizeTrackKey(
    data.activeTrackType != null ? String(data.activeTrackType) : null
  )
  const activeTrackType =
    activeFromApi ??
    (allowedTrackTypes[0] != null ? allowedTrackTypes[0] : 'AscensosSuboficiales')

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
    tenantSlug: data.tenantSlug != null ? String(data.tenantSlug) : null,
    tenantType: data.tenantType != null ? String(data.tenantType) : null,
    tenantLogoUrl: data.tenantLogoUrl != null ? String(data.tenantLogoUrl) : null,
    allowedTrackTypes,
    activeTrackType,
    promotionGrade: data.promotionGrade != null ? String(data.promotionGrade) : null,
    promotionHierarchy: data.promotionHierarchy != null ? String(data.promotionHierarchy) : null,
    mustChangePassword: Boolean(data.mustChangePassword),
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => {
    const prev = useAuthStore.getState().user
    if (
      prev &&
      prev.id === user.id &&
      prev.role === user.role &&
      prev.activeTrackType === user.activeTrackType &&
      prev.tenantSlug === user.tenantSlug &&
      prev.mustChangePassword === user.mustChangePassword
    ) {
      return
    }
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

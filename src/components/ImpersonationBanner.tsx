'use client'

import { useRouter } from 'next/navigation'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { authApi } from '@/lib/api/auth'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'
import { WARNING } from '@/lib/constants/theme'

export function ImpersonationBanner() {
  const router = useRouter()
  const { active, tenantName, tenantType, stopImpersonation } = useImpersonationStore()
  const { setUser, logout } = useAuthStore()

  if (!active || !tenantName) return null

  const handleExit = async () => {
    stopImpersonation()
    try {
      await authApi.logout()
    } catch { /* ignore */ }
    logout()
    router.push('/login')
  }

  const handleRefreshProfile = async () => {
    try {
      const res = await authApi.me()
      const profile = (res.data as { profile?: Record<string, unknown> }).profile ?? res.data
      setUser(normalizeUser(profile as Record<string, unknown>))
    } catch { /* ignore */ }
  }

  return (
    <div
      className="sticky top-0 z-50 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap text-sm"
      style={{
        background: `linear-gradient(90deg, ${WARNING}22, rgba(201,148,58,0.08))`,
        borderBottom: `1px solid ${WARNING}40`,
        color: WARNING,
      }}
    >
      <div className="flex items-center gap-2">
        <span>🎭</span>
        <span>
          Impersonando <strong>{tenantName}</strong>
          {tenantType ? ` (${tenantType})` : ''}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleRefreshProfile}
          className="px-3 py-1 rounded-lg text-xs font-medium"
          style={{ backgroundColor: `${WARNING}20`, border: `1px solid ${WARNING}30` }}
        >
          Actualizar sesión
        </button>
        <button
          type="button"
          onClick={handleExit}
          className="px-3 py-1 rounded-lg text-xs font-bold"
          style={{ backgroundColor: WARNING, color: '#000' }}
        >
          Salir de impersonación
        </button>
      </div>
    </div>
  )
}

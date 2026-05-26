'use client'

import { useRouter } from 'next/navigation'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { authApi } from '@/lib/api/auth'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'
import { WARNING } from '@/lib/constants/theme'

export function ImpersonationBanner() {
  const router = useRouter()
  const { active, tenantName, tenantType, stopImpersonation } = useImpersonationStore()
  const { setUser } = useAuthStore()

  if (!active || !tenantName) return null

  const handleExit = async () => {
    try {
      const res = await authApi.stopImpersonate()
      stopImpersonation()
      setUser(normalizeUser(res.data as unknown as Record<string, unknown>))
      router.push('/superadmin?tab=agencias')
    } catch {
      stopImpersonation()
      router.push('/login')
    }
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
          Ingresando como <strong>{tenantName}</strong>
          {tenantType ? ` (${tenantType})` : ''}
        </span>
      </div>
      <button
        type="button"
        onClick={() => void handleExit()}
        className="px-3 py-1 rounded-lg text-xs font-bold"
        style={{ backgroundColor: WARNING, color: '#000' }}
      >
        Volver a SuperAdmin
      </button>
    </div>
  )
}

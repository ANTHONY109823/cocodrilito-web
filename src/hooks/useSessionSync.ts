'use client'

import { useEffect, useRef } from 'react'
import apiClient from '@/lib/api/client'
import { redirectToLogin } from '@/lib/auth/logoutRedirect'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'

const RETRY_DELAY_MS = 600

/**
 * Sincroniza Zustand con cookies HttpOnly una vez por sesión (no en cada navegación).
 */
export function useSessionSync() {
  const { isAuthenticated, setUser, clearUser } = useAuthStore()
  const syncedRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      syncedRef.current = false
      return
    }
    if (syncedRef.current) return

    let cancelled = false
    syncedRef.current = true

    const syncSession = (allowRetry: boolean) => {
      apiClient
        .get('/Auth/me')
        .then((res) => {
          if (cancelled) return
          const data = res.data as { profile?: Record<string, unknown>; impersonating?: boolean }
          const profile = data.profile ?? (res.data as Record<string, unknown>)
          if (profile && typeof profile === 'object') {
            setUser(normalizeUser(profile as Record<string, unknown>))
          }
          if (data.impersonating) {
            const imp = useImpersonationStore.getState()
            if (!imp.active && profile && typeof profile === 'object') {
              const p = profile as Record<string, unknown>
              if (p.tenantId && p.tenantName) {
                useImpersonationStore.getState().startImpersonation({
                  tenantId: String(p.tenantId),
                  tenantName: String(p.tenantName),
                  tenantType: String(p.tenantType ?? 'Agencia'),
                })
              }
            }
          } else {
            useImpersonationStore.getState().stopImpersonation()
          }
        })
        .catch(() => {
          if (cancelled) return
          syncedRef.current = false
          if (allowRetry) {
            window.setTimeout(() => syncSession(false), RETRY_DELAY_MS)
            return
          }
          clearUser()
          redirectToLogin()
        })
    }

    syncSession(true)

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, setUser, clearUser])
}

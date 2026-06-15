'use client'

import { useEffect, useRef } from 'react'
import apiClient from '@/lib/api/client'
import { redirectToLogin } from '@/lib/auth/logoutRedirect'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'

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
          const profile = (res.data as { profile?: Record<string, unknown> }).profile ?? res.data
          if (profile && typeof profile === 'object') {
            setUser(normalizeUser(profile as Record<string, unknown>))
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

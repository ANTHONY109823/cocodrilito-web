'use client'

import { useEffect } from 'react'
import apiClient from '@/lib/api/client'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'

const RETRY_DELAY_MS = 400

/**
 * Sincroniza Zustand (localStorage) con las cookies HttpOnly del backend.
 * Si las cookies expiraron o fueron revocadas, limpia el estado local y redirige a login.
 */
export function useSessionSync() {
  const { isAuthenticated, setUser, clearUser } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

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
          if (allowRetry) {
            window.setTimeout(() => syncSession(false), RETRY_DELAY_MS)
            return
          }
          console.error('[auth] session sync failed — cookies invalid or expired')
          clearUser()
          if (typeof window !== 'undefined') window.location.href = '/login'
        })
    }

    syncSession(true)

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, setUser, clearUser])
}

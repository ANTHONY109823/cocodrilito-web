'use client'

import { useEffect } from 'react'
import apiClient from '@/lib/api/client'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'

/**
 * Sincroniza Zustand (localStorage) con las cookies HttpOnly del backend.
 * Si las cookies expiraron o fueron revocadas, limpia el estado local y redirige a login.
 * La autorización real siempre la decide el backend — esto es solo UX.
 */
export function useSessionSync() {
  const { isAuthenticated, setUser, clearUser } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false

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
        console.error('[auth] session sync failed — cookies invalid or expired')
        clearUser()
        if (typeof window !== 'undefined') window.location.href = '/login'
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, setUser, clearUser])
}

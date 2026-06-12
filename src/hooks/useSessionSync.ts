'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { redirectToLogin } from '@/lib/auth/logoutRedirect'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'

const RETRY_DELAY_MS = 600

function isAuthPage(pathname: string) {
  return pathname === '/login' || pathname === '/register'
}

/**
 * Sincroniza Zustand con cookies HttpOnly. No corre en /login para evitar bucles.
 */
export function useSessionSync() {
  const pathname = usePathname()
  const { isAuthenticated, setUser, clearUser } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || isAuthPage(pathname)) return

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
          clearUser()
          redirectToLogin()
        })
    }

    syncSession(true)

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, pathname, setUser, clearUser])
}

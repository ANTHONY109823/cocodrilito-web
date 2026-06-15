'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { getNavContext } from '@/lib/auth/roles'
import { redirectToLogin } from '@/lib/auth/logoutRedirect'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { enforceTenantHostAccess } from '@/lib/utils/tenantHost'
import { useSessionSync } from '@/hooks/useSessionSync'

const STUDENT_ONLY_PREFIXES = ['/exams', '/history', '/ranking', '/premium', '/exam/', '/result/', '/review/']

let storesHydrated = false

function hydrateClientStores() {
  if (typeof window === 'undefined' || storesHydrated) return
  storesHydrated = true
  useAuthStore.getState().loadFromStorage()
  useImpersonationStore.getState().loadFromStorage()
}

export function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false)
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const impersonating = useImpersonationStore((s) => s.active)

  useLayoutEffect(() => {
    hydrateClientStores()
    setAuthReady(true)
  }, [])

  // Mantiene el backend de Railway caliente: evita cold-starts que causan
  // lentitud de varios minutos al primer uso tras período de inactividad.
  useEffect(() => {
    const ping = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      void fetch('/api/health', { method: 'GET', cache: 'no-store' }).catch(() => {})
    }
    ping()
    const onVisible = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisible)
    const id = setInterval(ping, 8 * 60 * 1000)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useSessionSync()

  useEffect(() => {
    if (!authReady) return
    if (!isAuthenticated) redirectToLogin()
  }, [authReady, isAuthenticated])

  useEffect(() => {
    if (!authReady || !user?.mustChangePassword) return
    if (pathname !== '/cambiar-clave') {
      window.location.replace('/cambiar-clave')
    }
  }, [authReady, user, pathname])

  useEffect(() => {
    if (!authReady || !user) return

    if (enforceTenantHostAccess(user.role, user.tenantSlug, impersonating, pathname)) {
      return
    }

    const ctx = getNavContext(user.role, impersonating)

    if (pathname.startsWith('/superadmin') && ctx !== 'superadmin') {
      window.location.replace(
        pathname.startsWith('/superadmin/preguntas') ? '/admin/preguntas' : '/admin'
      )
      return
    }

    if (pathname.startsWith('/admin') && ctx !== 'tenant-admin') {
      window.location.replace(ctx === 'superadmin' ? '/superadmin' : '/dashboard')
      return
    }

    if (
      (ctx === 'superadmin' || ctx === 'tenant-admin') &&
      STUDENT_ONLY_PREFIXES.some((p) => pathname.startsWith(p))
    ) {
      return
    }

    if (ctx === 'superadmin' && pathname === '/dashboard') {
      window.location.replace('/superadmin?tab=inicio')
      return
    }

    if (ctx === 'tenant-admin' && pathname === '/dashboard') {
      window.location.replace('/admin')
    }
  }, [authReady, user, pathname, impersonating])

  if (!authReady || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080E0A] flex items-center justify-center text-[#6B8A75] text-sm">
        Cargando...
      </div>
    )
  }

  return <DashboardShell>{children}</DashboardShell>
}

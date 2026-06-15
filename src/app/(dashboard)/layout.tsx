'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { getNavContext } from '@/lib/auth/roles'
import { redirectToLogin } from '@/lib/auth/logoutRedirect'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { enforceTenantHostAccess } from '@/lib/utils/tenantHost'
import { useSessionSync } from '@/hooks/useSessionSync'

const STUDENT_ONLY_PREFIXES = ['/exams', '/history', '/ranking', '/premium', '/exam/', '/result/', '/review/']

let clientStoresHydrated = false

function hydrateClientStores() {
  if (clientStoresHydrated || typeof window === 'undefined') return
  clientStoresHydrated = true
  useAuthStore.getState().loadFromStorage()
  useImpersonationStore.getState().loadFromStorage()
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const impersonating = useImpersonationStore((s) => s.active)

  hydrateClientStores()
  useSessionSync()

  useEffect(() => {
    if (!isAuthenticated) redirectToLogin()
  }, [isAuthenticated])

  useEffect(() => {
    if (!user?.mustChangePassword) return
    if (pathname !== '/cambiar-clave') {
      window.location.replace('/cambiar-clave')
    }
  }, [user, pathname])

  useEffect(() => {
    if (!user) return

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
  }, [user, pathname, impersonating])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080E0A] flex items-center justify-center text-[#6B8A75] text-sm">
        Cargando...
      </div>
    )
  }

  return <DashboardShell>{children}</DashboardShell>
}

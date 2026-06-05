'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { getNavContext } from '@/lib/auth/roles'
import { DashboardShell } from '@/components/layout/DashboardShell'

const STUDENT_ONLY_PREFIXES = ['/exams', '/history', '/ranking', '/premium', '/exam/', '/result/', '/review/']

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, loadFromStorage } = useAuthStore()
  const { loadFromStorage: loadImpersonation, active: impersonating } = useImpersonationStore()

  useEffect(() => {
    loadFromStorage()
    loadImpersonation()
  }, [loadFromStorage, loadImpersonation])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user?.mustChangePassword || impersonating) return
    if (pathname !== '/cambiar-clave') router.replace('/cambiar-clave')
  }, [user, pathname, router, impersonating])

  useEffect(() => {
    if (!user) return

    const ctx = getNavContext(user.role, impersonating)

    if (pathname.startsWith('/superadmin') && ctx !== 'superadmin') {
      if (pathname.startsWith('/superadmin/preguntas')) {
        router.push('/admin/preguntas')
      } else {
        router.push('/admin')
      }
      return
    }

    if (pathname.startsWith('/admin') && ctx !== 'tenant-admin') {
      if (ctx === 'superadmin') router.push('/superadmin')
      else router.push('/dashboard')
      return
    }

    if (ctx === 'superadmin' && STUDENT_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      // Permitido: acceso oculto explícito desde sidebar superadmin
      return
    }

    if (ctx === 'tenant-admin' && pathname === '/dashboard') {
      router.replace('/admin')
    }
  }, [user, pathname, router, impersonating])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080E0A]">
        <p className="text-[#A8BFB0] text-sm">Cargando...</p>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#080E0A]">
        <p className="text-[#A8BFB0] text-sm">Cargando...</p>
      </div>
    }>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  )
}

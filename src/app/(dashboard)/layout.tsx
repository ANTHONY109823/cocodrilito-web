'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { isSuperAdmin } from '@/lib/auth/roles'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, loadFromStorage } = useAuthStore()
  const { loadFromStorage: loadImpersonation } = useImpersonationStore()

  useEffect(() => {
    loadFromStorage()
    loadImpersonation()
  }, [loadFromStorage, loadImpersonation])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user) return
    if (pathname.startsWith('/superadmin') && !isSuperAdmin(user.role)) {
      router.push('/dashboard')
    }
  }, [user, pathname, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080E0A]">
        <p className="text-[#A8BFB0] text-sm">Cargando...</p>
      </div>
    )
  }

  return <DashboardShell>{children}</DashboardShell>
}

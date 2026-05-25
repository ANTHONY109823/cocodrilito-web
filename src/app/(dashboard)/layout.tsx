'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import Link from 'next/link'
import { isAnyAdmin, isSuperAdmin } from '@/lib/auth/roles'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, logout, loadFromStorage } = useAuthStore()
  const { loadFromStorage: loadImpersonation } = useImpersonationStore()
  const [menuOpen, setMenuOpen] = useState(false)

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

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    router.push('/login')
  }

  const isAdmin = isAnyAdmin(user?.role)
  const superAdmin = isSuperAdmin(user?.role)

  const navLinks = [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/exams', label: 'Exámenes' },
    { href: '/history', label: 'Historial' },
    { href: '/ranking', label: 'Ranking' },
    { href: '/premium', label: 'Premium ⭐' },
  ]

  const mobileLinks = [
    { href: '/dashboard', label: '🏠 Inicio' },
    { href: '/exams', label: '📝 Exámenes' },
    { href: '/history', label: '📋 Historial' },
    { href: '/ranking', label: '🏆 Ranking' },
    { href: '/premium', label: '⭐ Premium' },
    { href: '/profile', label: '👤 Mi perfil' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0F0D' }}>
      <ImpersonationBanner />

      <nav style={{ backgroundColor: '#0A0F0D', borderBottom: '1px solid #1E3328' }}
        className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🐊</span>
            <span className="font-bold text-lg text-police-green-400">Cocodrilito</span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href}
                className="text-gray-400 hover:text-white text-sm transition-colors">
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">
                Admin 🛡️
              </Link>
            )}
            {superAdmin && (
              <Link href="/superadmin" className="text-gray-400 hover:text-white text-sm transition-colors">
                SuperAdmin ⚡
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/profile" className="text-right hover:opacity-80 transition-opacity">
              <div className="text-white text-sm font-medium">{user?.fullName}</div>
              <div className="text-gray-500 text-xs">{user?.rank}</div>
            </Link>
            <button onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 text-sm transition-colors ml-1">
              Salir
            </button>
          </div>

          <button className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}>
            <div style={{ width: '24px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  height: '2px',
                  backgroundColor: menuOpen ? '#4A7C59' : 'currentColor',
                  display: 'block',
                  transition: 'all 0.2s',
                  transform: i === 0 && menuOpen ? 'rotate(45deg) translateY(7px)'
                    : i === 2 && menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none',
                  opacity: i === 1 && menuOpen ? 0 : 1,
                }} />
              ))}
            </div>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 pb-4" style={{ borderTop: '1px solid #1E3328', paddingTop: '1rem' }}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: '#4A7C5920', color: '#4A7C59' }}>
                  {user?.fullName?.charAt(0)}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{user?.fullName}</div>
                  <div className="text-gray-500 text-xs">{user?.rank} — {user?.planType}</div>
                </div>
              </div>
              {mobileLinks.map((item) => (
                <Link key={item.href} href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-300 hover:text-white text-sm py-2 transition-colors">
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}
                  className="text-gray-300 hover:text-white text-sm py-2 transition-colors">
                  🛡️ Admin
                </Link>
              )}
              {superAdmin && (
                <Link href="/superadmin" onClick={() => setMenuOpen(false)}
                  className="text-gray-300 hover:text-white text-sm py-2 transition-colors">
                  ⚡ SuperAdmin
                </Link>
              )}
              <button onClick={handleLogout}
                className="text-red-400 text-sm py-2 text-left transition-colors">
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {children}
      </main>
    </div>
  )
}

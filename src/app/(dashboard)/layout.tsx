'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user, logout, loadFromStorage } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { loadFromStorage() }, [])
  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated])

  const handleLogout = () => { logout(); router.push('/login') }
  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0F0D' }}>
      <nav style={{ backgroundColor: '#0A0F0D', borderBottom: '1px solid #1E3328' }}
        className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">

          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🐊</span>
            <span className="font-bold text-lg text-police-green-400">Cocodrilito</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
              Inicio
            </Link>
            <Link href="/exams" className="text-gray-400 hover:text-white text-sm transition-colors">
              Exámenes
            </Link>
            <Link href="/history" className="text-gray-400 hover:text-white text-sm transition-colors">
              Historial
            </Link>
            <Link href="/ranking" className="text-gray-400 hover:text-white text-sm transition-colors">
              Ranking
            </Link>
            <Link href="/premium" className="text-gray-400 hover:text-white text-sm transition-colors">
              Premium ⭐
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">
                Admin 🛡️
              </Link>
            )}
          </div>

          {/* Desktop user */}
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

          {/* Mobile hamburger */}
          <button className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}>
            <div style={{ width: '24px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{
                height: '2px', backgroundColor: menuOpen ? '#4A7C59' : 'currentColor',
                display: 'block', transition: 'all 0.2s',
                transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none'
              }} />
              <span style={{
                height: '2px', backgroundColor: menuOpen ? '#4A7C59' : 'currentColor',
                display: 'block', transition: 'all 0.2s',
                opacity: menuOpen ? 0 : 1
              }} />
              <span style={{
                height: '2px', backgroundColor: menuOpen ? '#4A7C59' : 'currentColor',
                display: 'block', transition: 'all 0.2s',
                transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none'
              }} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
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
              {[
                { href: '/dashboard', label: '🏠 Inicio' },
                { href: '/exams', label: '📝 Exámenes' },
                { href: '/history', label: '📋 Historial' },
                { href: '/ranking', label: '🏆 Ranking' },
                { href: '/premium', label: '⭐ Premium' },
                { href: '/profile', label: '👤 Mi perfil' },
              ].map(item => (
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
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, user, logout, loadFromStorage } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen">
      <nav style={{ backgroundColor: '#0A0F0D', borderBottom: '1px solid #1A2E24' }}
        className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐊</span>
          <span className="text-white font-bold text-lg">Cocodrilito</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard"
            className="text-gray-400 hover:text-white text-sm transition-colors">
            Inicio
          </Link>
          <Link href="/exams"
            className="text-gray-400 hover:text-white text-sm transition-colors">
            Exámenes
          </Link>
          <Link href="/ranking"
            className="text-gray-400 hover:text-white text-sm transition-colors">
            Ranking
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-white text-sm font-medium">{user?.fullName}</div>
            <div className="text-gray-500 text-xs">{user?.rank}</div>
          </div>
          <button onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors">
            Salir
          </button>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
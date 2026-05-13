'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { gamificationApi } from '@/lib/api/gamification'
import Link from 'next/link'

interface GamificationStatus {
  currentLeague: string
  totalXp: number
  currentStreakDays: number
  fossilRiskScore: number
  examsCompleted: number
  badges: string[]
}

const leagueConfig: Record<string, { color: string; bg: string; emoji: string; next: string; xpNext: number }> = {
  'Cocodrilo Élite':   { color: '#EF9F27', bg: '#2A1F00', emoji: '🐊', next: 'Máximo nivel', xpNext: 0 },
  'Cocodrilo Veterano':{ color: '#1D9E75', bg: '#0A2018', emoji: '🐊', next: 'Cocodrilo Élite', xpNext: 50000 },
  'Cocodrilo Activo':  { color: '#378ADD', bg: '#0A1525', emoji: '🦎', next: 'Cocodrilo Veterano', xpNext: 20000 },
  'Lagarto':           { color: '#6B8E6B', bg: '#0F1A0F', emoji: '🦎', next: 'Cocodrilo Activo', xpNext: 8000 },
  'Tortuga':           { color: '#8B7355', bg: '#1A1208', emoji: '🐢', next: 'Lagarto', xpNext: 2000 },
  'Fósil en Peligro':  { color: '#D85A30', bg: '#2A0A00', emoji: '💀', next: 'Tortuga', xpNext: 500 },
}

export default function DashboardPage() {
  const { user, loadFromStorage } = useAuthStore()
  const [gami, setGami] = useState<GamificationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFromStorage()
    loadGamification()
  }, [])

  const loadGamification = async () => {
    try {
      const res = await gamificationApi.getMyStatus()
      setGami(res.data)
    } catch {
      console.error('Error cargando gamificación')
    } finally {
      setLoading(false)
    }
  }

  const league = gami ? (leagueConfig[gami.currentLeague] || leagueConfig['Fósil en Peligro']) : leagueConfig['Fósil en Peligro']
  const xpProgress = gami && league.xpNext > 0 ? Math.min((gami.totalXp / league.xpNext) * 100, 100) : 100
  const isNewUser = !gami || gami.examsCompleted === 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* SALUDO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isNewUser ? '¡Bienvenido,' : '¡Hola de nuevo,'} {user?.fullName?.split(' ')[0] || user?.fullName}! {league.emoji}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{user?.rank} — {user?.unit}</p>
        </div>
        {gami && gami.currentStreakDays > 0 && (
          <div className="text-center px-4 py-2 rounded-xl"
            style={{ backgroundColor: '#1A1A0A', border: '1px solid #EF9F27' }}>
            <div className="text-2xl font-bold text-yellow-400">🔥 {gami.currentStreakDays}</div>
            <div className="text-xs text-gray-500">días seguidos</div>
          </div>
        )}
      </div>

      {/* CTA PRINCIPAL — solo si es nuevo usuario */}
      {isNewUser && (
        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #085041 0%, #1D9E75 100%)' }}>
          <div className="relative z-10">
            <div className="text-4xl mb-3">🐊</div>
            <h2 className="text-white text-xl font-bold mb-2">¡Tu primer simulacro te espera!</h2>
            <p className="text-green-100 text-sm mb-4">
              Descubre en qué nivel estás y empieza a escalar en el ranking PNP.
            </p>
            <Link href="/exams"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ backgroundColor: '#fff', color: '#085041' }}>
              Iniciar mi primer simulacro →
            </Link>
          </div>
          <div className="absolute right-4 top-4 text-8xl opacity-10">🐊</div>
        </div>
      )}

      {/* LIGA Y PROGRESO */}
      {!loading && (
        <div className="rounded-2xl p-5"
          style={{ backgroundColor: league.bg, border: `1px solid ${league.color}33` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{league.emoji}</span>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Liga actual</div>
                <div className="text-xl font-bold" style={{ color: league.color }}>
                  {gami?.currentLeague || 'Fósil en Peligro'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{gami?.totalXp || 0} XP</div>
              {league.xpNext > 0 && (
                <div className="text-xs text-gray-500">
                  {league.xpNext - (gami?.totalXp || 0)} XP para {league.next}
                </div>
              )}
            </div>
          </div>

          {/* Barra de progreso */}
          {league.xpNext > 0 && (
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#ffffff15' }}>
              <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${xpProgress}%`, backgroundColor: league.color }} />
            </div>
          )}
        </div>
      )}

      {/* STATS */}
      {!isNewUser && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-yellow-400">{gami?.totalXp || 0}</div>
            <div className="text-gray-500 text-xs mt-1">XP Total</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-400">
              {gami?.currentStreakDays || 0} 🔥
            </div>
            <div className="text-gray-500 text-xs mt-1">Días de racha</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-400">{gami?.examsCompleted || 0}</div>
            <div className="text-gray-500 text-xs mt-1">Simulacros</div>
          </div>
        </div>
      )}

      {/* ALERTA ANTI-FÓSIL */}
      {gami && gami.fossilRiskScore > 40 && (
        <div className="rounded-xl p-4 flex items-center gap-4"
          style={{ backgroundColor: '#2A1010', border: '1px solid #D85A30' }}>
          <span className="text-3xl">☠️</span>
          <div className="flex-1">
            <div className="text-red-400 font-semibold">¡Alerta Anti-Fósil!</div>
            <div className="text-red-500 text-sm">
              Llevas {Math.floor(gami.fossilRiskScore / 20)} días sin practicar. ¡Tu rancho te está aventajando!
            </div>
          </div>
          <Link href="/exams"
            className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap"
            style={{ backgroundColor: '#D85A30', color: '#fff' }}>
            Practicar ahora
          </Link>
        </div>
      )}

      {/* CTA SIMULACRO — para usuarios con historial */}
      {!isNewUser && (
        <Link href="/exams"
          className="block rounded-2xl p-5 transition-all hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #0A2018 0%, #1A3D2E 100%)', border: '1px solid #1D9E75' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-bold text-lg">📝 Nuevo simulacro</div>
              <div className="text-gray-400 text-sm mt-1">Sigue entrenando para subir de liga</div>
            </div>
            <div className="text-3xl">→</div>
          </div>
        </Link>
      )}

      {/* BADGES */}
      {gami && gami.badges.length > 0 && (
        <div className="card">
          <h3 className="text-white font-semibold mb-3">🏆 Mis logros</h3>
          <div className="flex flex-wrap gap-2">
            {gami.badges.map((badge, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: '#1A2E24', color: '#1D9E75' }}>
                🏆 {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* BANNER PREMIUM */}
      {user?.planType === 'Free' && (
        <div className="rounded-2xl p-5 flex items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, #1A1200 0%, #2A1F00 100%)', border: '1px solid #EF9F2733' }}>
          <div>
            <div className="text-yellow-400 font-bold text-lg">⭐ Desbloquea todo con Premium</div>
            <div className="text-gray-400 text-sm mt-1">
              Exámenes ilimitados · Banco completo · Sin publicidad
            </div>
          </div>
          <Link href="/premium"
            className="px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all hover:scale-105"
            style={{ backgroundColor: '#EF9F27', color: '#000' }}>
            Ver planes
          </Link>
        </div>
      )}

    </div>
  )
}
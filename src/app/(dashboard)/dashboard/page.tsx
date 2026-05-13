'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { gamificationApi } from '@/lib/api/gamification'
import { examsApi } from '@/lib/api/exams'
import Link from 'next/link'

interface GamificationStatus {
  currentLeague: string
  totalXp: number
  currentStreakDays: number
  fossilRiskScore: number
  examsCompleted: number
  badges: string[]
}

interface Stats {
  totalSessions: number
  totalCorrect: number
  totalIncorrect: number
  totalQuestions: number
  lastAccess: string
}

interface LatestSession {
  sessionId: string
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpentSeconds: number
  finishedAt: string
  passed: boolean
}

const leagueConfig: Record<string, { color: string; bg: string; border: string; emoji: string; next: string; correctasNext: number }> = {
  'Cola Cortada':                { color: '#EF9F27', bg: '#1A1200', border: '#EF9F2740', emoji: '🐊✂️', next: 'Máximo nivel', correctasNext: 0 },
  'Creo que nos cortan la cola': { color: '#1D9E75', bg: '#0A1A10', border: '#1D9E7540', emoji: '✂️',   next: 'Cola Cortada', correctasNext: 100 },
  'Lagartito':                   { color: '#378ADD', bg: '#0A1020', border: '#378ADD40', emoji: '🦎',   next: 'Creo que nos cortan la cola', correctasNext: 75 },
  'Cocodrilito':                 { color: '#A0C878', bg: '#0A1A08', border: '#A0C87840', emoji: '🐊',   next: 'Lagartito', correctasNext: 50 },
  'Dinosaurio':                  { color: '#D85A30', bg: '#1A0800', border: '#D85A3040', emoji: '🦕',   next: 'Cocodrilito', correctasNext: 25 },
}

const getLeagueByCorrects = (total: number) => {
  if (total >= 100) return 'Cola Cortada'
  if (total >= 75)  return 'Creo que nos cortan la cola'
  if (total >= 50)  return 'Lagartito'
  if (total >= 25)  return 'Cocodrilito'
  return 'Dinosaurio'
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export default function DashboardPage() {
  const { user, loadFromStorage } = useAuthStore()
  const [gami, setGami] = useState<GamificationStatus | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [latest, setLatest] = useState<LatestSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFromStorage()
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      const [gamiRes, statsRes, latestRes] = await Promise.all([
        gamificationApi.getMyStatus(),
        examsApi.getMyStats(),
        examsApi.getLatestSession(),
      ])
      setGami(gamiRes.data)
      setStats(statsRes.data)
      setLatest(latestRes.data)
    } catch {
      console.error('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const totalCorrects = stats?.totalCorrect || 0
  const ligaNombre = getLeagueByCorrects(totalCorrects)
  const league = leagueConfig[ligaNombre]
  const correctasNext = league.correctasNext
  const progressPercent = correctasNext > 0
    ? Math.min((totalCorrects / correctasNext) * 100, 100) : 100
  const isNewUser = !stats || stats.totalSessions === 0

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* SALUDO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isNewUser ? '¡Bienvenido,' : '¡Hola de nuevo,'}{' '}
            {user?.fullName?.split(' ')[0] || user?.fullName}! {league.emoji}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{user?.rank} — {user?.unit}</p>
        </div>
        <div className="text-center px-4 py-2 rounded-xl"
          style={{ backgroundColor: '#1A1A0A', border: '1px solid #EF9F27' }}>
          <div className="text-2xl font-bold text-yellow-400">
            {stats?.totalSessions || 0}
          </div>
          <div className="text-xs text-gray-500">simulacros</div>
        </div>
      </div>

      {/* CTA NUEVO USUARIO */}
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
          style={{ backgroundColor: league.bg, border: `1px solid ${league.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{league.emoji}</span>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Liga actual</div>
                <div className="text-xl font-bold" style={{ color: league.color }}>
                  {ligaNombre}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{totalCorrects}</div>
              <div className="text-xs text-gray-500">preguntas correctas totales</div>
              {correctasNext > 0 && (
                <div className="text-xs mt-1" style={{ color: league.color }}>
                  {correctasNext - totalCorrects} para {league.next}
                </div>
              )}
            </div>
          </div>
          {correctasNext > 0 && (
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#ffffff15' }}>
              <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%`, backgroundColor: league.color }} />
            </div>
          )}
        </div>
      )}

      {/* STATS */}
      {!isNewUser && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'linear-gradient(135deg, #0A2018 0%, #1A3D2E 100%)', border: '1px solid #1D9E75' }}>
            <div className="text-3xl font-bold text-green-400">{stats?.totalCorrect || 0}</div>
            <div className="text-gray-400 text-xs mt-1">Preguntas correctas</div>
          </div>
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'linear-gradient(135deg, #2A0A0A 0%, #3D1A1A 100%)', border: '1px solid #D85A30' }}>
            <div className="text-3xl font-bold text-red-400">{stats?.totalIncorrect || 0}</div>
            <div className="text-gray-400 text-xs mt-1">Preguntas incorrectas</div>
          </div>
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'linear-gradient(135deg, #1A1200 0%, #2A2000 100%)', border: '1px solid #EF9F27' }}>
            <div className="text-3xl font-bold text-yellow-400">{stats?.totalSessions || 0}</div>
            <div className="text-gray-400 text-xs mt-1">Simulacros realizados</div>
          </div>
        </div>
      )}

      {/* ALERTA ANTI-FÓSIL */}
      {gami && gami.fossilRiskScore > 40 && (
        <div className="rounded-xl p-4 flex items-center gap-4"
          style={{ backgroundColor: '#2A1010', border: '1px solid #D85A30' }}>
          <span className="text-3xl">☠️</span>
          <div className="flex-1">
            <div className="text-red-400 font-semibold">¡Alerta! Estás oxidándote 🦕</div>
            <div className="text-red-500 text-sm">
              Llevas días sin practicar. ¡Tu rancho te está aventajando!
            </div>
          </div>
          <Link href="/exams"
            className="px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap"
            style={{ backgroundColor: '#D85A30', color: '#fff' }}>
            Practicar ahora
          </Link>
        </div>
      )}

      {/* CTA NUEVO SIMULACRO */}
      {!isNewUser && (
        <Link href="/exams"
          className="block rounded-2xl p-5 transition-all hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #0A2018 0%, #1A3D2E 100%)', border: '1px solid #1D9E75' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-bold text-lg">📝 Nuevo simulacro</div>
              <div className="text-gray-400 text-sm mt-1">Sigue entrenando para subir de liga</div>
            </div>
            <div className="text-white text-2xl">→</div>
          </div>
        </Link>
      )}

      {/* ÚLTIMO SIMULACRO */}
      {latest && (
        <div className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #0A1020 0%, #1A2030 100%)', border: '1px solid #378ADD40' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white font-bold">📊 Último simulacro</div>
              <div className="text-gray-500 text-sm">
                {new Date(latest.finishedAt).toLocaleDateString('es-PE', {
                  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold"
                style={{ color: latest.passed ? '#1D9E75' : '#D85A30' }}>
                {latest.score}%
              </div>
              <div className="text-xs" style={{ color: latest.passed ? '#1D9E75' : '#D85A30' }}>
                {latest.passed ? '✅ Aprobado' : '❌ No aprobado'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center"
              style={{ backgroundColor: '#1A3D2E' }}>
              <div className="text-xl font-bold text-green-400">{latest.correctAnswers}</div>
              <div className="text-gray-400 text-xs">Correctas</div>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{ backgroundColor: '#2A1010' }}>
              <div className="text-xl font-bold text-red-400">
                {latest.totalQuestions - latest.correctAnswers}
              </div>
              <div className="text-gray-400 text-xs">Incorrectas</div>
            </div>
            <div className="rounded-xl p-3 text-center"
              style={{ backgroundColor: '#0A1525' }}>
              <div className="text-xl font-bold text-blue-400">{formatTime(latest.timeSpentSeconds)}</div>
              <div className="text-gray-400 text-xs">Tiempo</div>
            </div>
          </div>

          <Link href={`/result/${latest.sessionId}`}
            className="block text-center py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ backgroundColor: '#1A2A40', color: '#378ADD' }}>
            Ver respuestas detalladas →
          </Link>
        </div>
      )}

      {/* BADGES */}
      {gami && gami.badges.length > 0 && (
        <div className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #0A1A10 0%, #1A2A1A 100%)', border: '1px solid #1D9E7540' }}>
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
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

const LeagueIcons = {
  Dinosaurio: () => (
    <svg viewBox="0 0 128 128" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <path d="M121.09,108.67c-0.5-1.23-1.31-2.23-2.24-2.97c-0.92-0.74-1.99-1.2-2.97-1.4c-1.03-0.21-1.95-0.18-2.76-0.04c-0.8,0.14-1.48,0.38-2,0.63c-0.53,0.25-0.9,0.51-1.16,0.69c-0.25,0.19-0.38,0.29-0.38,0.29c-0.16,0.13-0.2,0.36-0.08,0.53c0.12,0.18,0.37,0.23,0.57,0.09c0,0,0.12-0.08,0.35-0.24c0.24-0.14,0.58-0.35,1.06-0.54c0.47-0.19,1.08-0.37,1.78-0.45c0.7-0.08,1.52-0.05,2.32,0.17c0.85,0.22,1.66,0.65,2.39,1.3c0.72,0.64,1.32,1.5,1.65,2.48c0.34,0.99,0.35,2.03,0.11,3.12c-0.24,1.08-0.72,2.1-1.38,3.06c-2.33,3.4-6.71,5.25-10.76,4.34c-1.17-0.6-2.29-1.27-3.32-2.07c-3.44-2.68-5.07-7.05-6.01-11.3c-1.05-4.76-2.01-9.35-3.47-14.01c-0.85-2.71-1.79-5.4-2.86-8.04c-0.87-2.15-1.85-4.32-2.91-6.47c-1.34-2.72-2.82-5.41-4.49-7.97c-2.46-3.8-5.28-7.34-8.54-10.3c-1.26-1.15-2.63-2.23-4.06-3.25c-3.04-2.16-6.41-3.99-9.93-5.24c-2.09-0.75-4.23-1.3-6.39-1.6c-3.26-0.46-6.73-1.13-10.05-2.21c-2.21-0.72-4.8-1.75-6.75-3.84c-1.95-2.09-2.34-4.18-2.18-6c0.26-2.81,0.72-5.37,0.22-8.48c-0.22-1.36-0.6-2.81-1.29-4.46c-1.42-2.74-4.79-6.62-8.2-10.07c1.81,4.83,2.21,9.9-0.32,14.98c0,1.05-3.15,3.15-6.3,2.1c-6.42-2.57-8.91-8.68-9.4-15.19c-1.18,5.35-1.89,12.22-0.86,17.46c1.62,8.21,6.4,11.68,9.02,13.66c1.94,1.47,2.29,2.29,5.45,5.25c1.81,1.69,3.21,8.21,4.37,10.46c1.62,3.14,3.6,6.47,6.16,9.02c2.33,1.96,5.01,3.46,7.83,4.64c1.74,0.73,3.53,1.34,5.33,1.85c2.18,0.63,4.4,1.14,6.62,1.62c2.1,0.46,4.39,0.91,6.71,1.45c3.46,0.82,6.98,1.87,9.99,3.55c1.69,0.94,3.23,2.08,4.5,3.5c2.21,2.48,4.31,5.45,5.71,8.44c1.47,3.15,2.73,6.26,4.64,9.19c2.35,3.6,5.19,6.88,8.42,9.72c1.6,1.4,3.3,2.81,5.12,3.91c2.91,1.75,6.43,2.69,9.82,2.36c0.64-0.18,1.25-0.37,1.84-0.63c2.38-1.02,4.57-2.84,5.98-5.19c0.69-1.15,1.23-2.47,1.43-3.81C121.71,111.34,121.59,109.88,121.09,108.67z" fill="#D85A30"/>
      <path d="M19.84,30.65c3.15,1.05,6.3-1.05,6.3-2.1c2.54-5.07,2.13-10.14,0.32-14.98c-3.85-3.89-7.75-7.23-8.97-7.72c-2.99-1.2-4.2,1.56-4.2,1.56c-0.87,1.04-1.98,4.14-2.84,8.04C10.93,21.98,13.42,28.08,19.84,30.65z" fill="#FF7043"/>
    </svg>
  ),
  Cocodrilito: () => (
    <svg viewBox="0 0 1920 1920" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <path d="M1509.4 435.6c-3.9-10-32.2-88.9 34-110 70.7-22.6 105.9 56.6 105.9 56.6l53.7 141-135.2 51.3-39.2 14.9-102.3 38.8-35 13.3-108.9 41.3-43.9 16.7-97.2 36.9-92.1 35-114.4 43.4-81.7 31-91.3 34.6L644.1 925l190.6 162.9 95.2 81.4 67.3 57.5 75.8 64.8 48.4 41.4 101.3 86.6 59.6 50.9 105.8 90.4-75.1 38.9-237.3-9.9-711.9-416.5-128.3-293L325.1 677l9.8-3.8 126-49.4S453.6 464 594.1 461.6c140.5-2.4 159.8 79.9 159.8 79.9l558.5-92.4s14-97.1 91.5-92.3c72 4.5 101.8 69.8 105.5 78.8z" fill="#1D9E75"/>
      <circle cx="596" cy="574.4" r="48.1" fill="#fff"/>
    </svg>
  ),
  Lagartito: () => <span style={{ fontSize: '36px' }}>🦎</span>,
  'Creo que nos cortan la cola': () => <span style={{ fontSize: '36px' }}>✂️🐊</span>,
  'Cola Cortada': () => <span style={{ fontSize: '36px' }}>🏆</span>,
}

const leagueConfig: Record<string, {
  color: string; glow: string; bg: string; border: string;
  next: string; correctasNext: number; label: string
}> = {
  'Cola Cortada':                { color: '#FFD700', glow: '#FFD70060', bg: 'rgba(26,18,0,0.8)',  border: '#FFD70050', next: 'Máximo nivel',              correctasNext: 0,   label: '🏆 Cola Cortada' },
  'Creo que nos cortan la cola': { color: '#00E5A0', glow: '#00E5A060', bg: 'rgba(0,20,12,0.8)',  border: '#00E5A050', next: 'Cola Cortada',               correctasNext: 100, label: '✂️ Creo que nos cortan la cola' },
  'Lagartito':                   { color: '#4FC3F7', glow: '#4FC3F760', bg: 'rgba(0,12,24,0.8)',  border: '#4FC3F750', next: 'Creo que nos cortan la cola', correctasNext: 75,  label: '🦎 Lagartito' },
  'Cocodrilito':                 { color: '#69F0AE', glow: '#69F0AE60', bg: 'rgba(0,18,8,0.8)',   border: '#69F0AE50', next: 'Lagartito',                   correctasNext: 50,  label: '🐊 Cocodrilito' },
  'Dinosaurio':                  { color: '#FF7043', glow: '#FF704360', bg: 'rgba(24,6,0,0.8)',   border: '#FF704350', next: 'Cocodrilito',                  correctasNext: 25,  label: '🦕 Dinosaurio' },
}

const getLeague = (total: number) => {
  if (total >= 100) return 'Cola Cortada'
  if (total >= 75)  return 'Creo que nos cortan la cola'
  if (total >= 50)  return 'Lagartito'
  if (total >= 25)  return 'Cocodrilito'
  return 'Dinosaurio'
}

const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`

export default function DashboardPage() {
  const { user, loadFromStorage } = useAuthStore()
  const [gami, setGami] = useState<GamificationStatus | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [latest, setLatest] = useState<LatestSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadFromStorage(); loadAll() }, [])

  const loadAll = async () => {
    try {
      const [g, s, l] = await Promise.all([
        gamificationApi.getMyStatus(),
        examsApi.getMyStats(),
        examsApi.getLatestSession(),
      ])
      setGami(g.data); setStats(s.data); setLatest(l.data)
    } catch { console.error('Error') } finally { setLoading(false) }
  }

  const lastCorrects = latest?.correctAnswers || 0
  const ligaNombre = getLeague(lastCorrects)
  const cfg = leagueConfig[ligaNombre]
  const pct = cfg.correctasNext > 0 ? Math.min((lastCorrects / cfg.correctasNext) * 100, 100) : 100
  const isNew = !latest
  const LeagueIcon = LeagueIcons[ligaNombre as keyof typeof LeagueIcons] || LeagueIcons.Dinosaurio

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {isNew ? '¡Bienvenido,' : '¡Hola,'}{' '}
            {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">{user?.rank} · {user?.unit}</p>
        </div>
        <Link href="/exams"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 hover:shadow-lg"
          style={{
            background: `linear-gradient(135deg, #00C87A, #00A060)`,
            color: '#000',
            boxShadow: '0 0 20px #00C87A40'
          }}>
          📝 Nuevo simulacro
        </Link>
      </div>

      {/* NUEVO USUARIO */}
      {isNew && (
        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, #003D25 0%, #006040 100%)',
            border: '1px solid #00C87A40',
            boxShadow: '0 0 40px #00C87A20'
          }}>
          <div className="relative z-10 flex items-center gap-6">
            <LeagueIcon />
            <div>
              <h2 className="text-white text-xl font-bold mb-1">¡Tu primer simulacro te espera!</h2>
              <p className="text-green-300 text-sm mb-4">Descubre tu nivel y empieza a escalar en el ranking PNP.</p>
              <Link href="/exams"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                style={{ backgroundColor: '#00C87A', color: '#000' }}>
                Comenzar ahora →
              </Link>
            </div>
          </div>
          <div className="absolute right-6 bottom-0 opacity-5 text-[120px]">🐊</div>
        </div>
      )}

      {/* LIGA */}
      {!loading && latest && (
        <div className="rounded-2xl p-5"
          style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            boxShadow: `0 0 30px ${cfg.glow}`
          }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl" style={{ backgroundColor: `${cfg.color}15` }}>
                <LeagueIcon />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Liga actual</div>
                <div className="text-2xl font-bold" style={{ color: cfg.color, textShadow: `0 0 20px ${cfg.color}` }}>
                  {ligaNombre}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{lastCorrects}</div>
              <div className="text-xs text-gray-500">correctas · último simulacro</div>
              {cfg.correctasNext > 0 && (
                <div className="text-xs mt-1 font-medium" style={{ color: cfg.color }}>
                  {cfg.correctasNext - lastCorrects} preguntas para el siguiente nivel
                </div>
              )}
            </div>
          </div>
          {cfg.correctasNext > 0 && (
            <div>
              <div className="w-full h-1.5 rounded-full mb-1" style={{ backgroundColor: '#ffffff10' }}>
                <div className="h-1.5 rounded-full transition-all duration-1000"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})`,
                    boxShadow: `0 0 8px ${cfg.color}`
                  }} />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>0</span><span>{cfg.correctasNext} → {cfg.next}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ÚLTIMO SIMULACRO */}
      {latest && (
        <div className="rounded-2xl p-5"
          style={{
            background: 'rgba(0,10,20,0.8)',
            border: '1px solid #4FC3F720',
            boxShadow: '0 0 30px #4FC3F710'
          }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white font-bold text-base">Último simulacro</div>
              <div className="text-gray-600 text-xs mt-0.5">
                {new Date(latest.finishedAt).toLocaleDateString('es-PE', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold"
                style={{
                  color: latest.passed ? '#00E5A0' : '#FF5252',
                  textShadow: `0 0 15px ${latest.passed ? '#00E5A0' : '#FF5252'}`
                }}>
                {latest.score}%
              </div>
              <div className="text-xs font-medium" style={{ color: latest.passed ? '#00E5A0' : '#FF5252' }}>
                {latest.passed ? '✓ Aprobado' : '✗ No aprobado'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Correctas', value: latest.correctAnswers, color: '#00E5A0', bg: 'rgba(0,229,160,0.08)', border: '#00E5A020' },
              { label: 'Incorrectas', value: latest.totalQuestions - latest.correctAnswers, color: '#FF5252', bg: 'rgba(255,82,82,0.08)', border: '#FF525220' },
              { label: 'Tiempo', value: formatTime(latest.timeSpentSeconds), color: '#4FC3F7', bg: 'rgba(79,195,247,0.08)', border: '#4FC3F720' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-3 text-center"
                style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
                <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
                <div className="text-gray-500 text-xs mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href={`/result/${latest.sessionId}`}
              className="text-center py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(79,195,247,0.1)', color: '#4FC3F7', border: '1px solid #4FC3F720' }}>
              Ver respuestas →
            </Link>
            <Link href="/ranking"
              className="text-center py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(0,229,160,0.1)', color: '#00E5A0', border: '1px solid #00E5A020' }}>
              Ver ranking →
            </Link>
          </div>
        </div>
      )}

      {/* ALERTA ANTI-FÓSIL */}
      {gami && gami.fossilRiskScore > 40 && (
        <div className="rounded-xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid #FF525230' }}>
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <div className="font-semibold text-sm" style={{ color: '#FF5252' }}>¡Estás oxidándote!</div>
            <div className="text-xs text-gray-500">Tu rancho te está aventajando en el ranking.</div>
          </div>
          <Link href="/exams"
            className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
            style={{ backgroundColor: '#FF5252', color: '#fff' }}>
            Practicar →
          </Link>
        </div>
      )}

      {/* PREMIUM */}
      {user?.planType === 'Free' && (
        <div className="rounded-2xl p-5 flex items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(26,18,0,0.9), rgba(42,30,0,0.9))',
            border: '1px solid #FFD70030',
            boxShadow: '0 0 20px #FFD70010'
          }}>
          <div>
            <div className="font-bold" style={{ color: '#FFD700' }}>⭐ Desbloquea Premium</div>
            <div className="text-gray-500 text-xs mt-1">Simulacros ilimitados · Banco completo · Sin límites</div>
          </div>
          <Link href="/premium"
            className="px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#000' }}>
            Ver planes
          </Link>
        </div>
      )}

    </div>
  )
}
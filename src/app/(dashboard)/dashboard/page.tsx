'use client'

import { useEffect, useState, useMemo } from 'react'
import { createFloatingParticles } from '@/lib/utils/particles'
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

interface CategoryStat {
  category: string
  total: number
  correct: number
  incorrect: number
  percentage: number
}

const leagueConfig: Record<string, {
  color: string; glow: string; bg: string; border: string
  next: string; correctasNext: number; emoji: string
}> = {
  'Cola Cortada':                { color: '#FFD700', glow: '#FFD70060', bg: 'rgba(26,18,0,0.85)',  border: '#FFD70040', next: 'Máximo nivel',              correctasNext: 0,   emoji: '🏆' },
  'Creo que nos cortan la cola': { color: '#00E5A0', glow: '#00E5A060', bg: 'rgba(0,20,12,0.85)',  border: '#00E5A040', next: 'Cola Cortada',               correctasNext: 100, emoji: '✂️' },
  'Lagartito':                   { color: '#4FC3F7', glow: '#4FC3F760', bg: 'rgba(0,12,24,0.85)',  border: '#4FC3F740', next: 'Creo que nos cortan la cola', correctasNext: 75,  emoji: '🦎' },
  'Cocodrilito':                 { color: '#69F0AE', glow: '#69F0AE60', bg: 'rgba(0,18,8,0.85)',   border: '#69F0AE40', next: 'Lagartito',                   correctasNext: 50,  emoji: '🐊' },
  'Dinosaurio':                  { color: '#FF7043', glow: '#FF704360', bg: 'rgba(24,6,0,0.85)',   border: '#FF704340', next: 'Cocodrilito',                  correctasNext: 25,  emoji: '🦕' },
}

const getLeague = (n: number) => {
  if (n >= 100) return 'Cola Cortada'
  if (n >= 75)  return 'Creo que nos cortan la cola'
  if (n >= 50)  return 'Lagartito'
  if (n >= 25)  return 'Cocodrilito'
  return 'Dinosaurio'
}

const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`

function Particles() {
  const particles = useMemo(() => createFloatingParticles(20), [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div key={p.id}
          className="absolute rounded-full opacity-20"
          style={{
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
            backgroundColor: p.backgroundColor,
            animation: p.animation,
            animationDelay: p.animationDelay,
          }} />
      ))}
    </div>
  )
}

function SideStats({ stats, latest }: { stats: Stats | null, latest: LatestSession | null }) {
  const items = [
    { label: 'Simulacros', value: stats?.totalSessions || 0, color: '#4A7C59', icon: '📝' },
    { label: 'Correctas', value: stats?.totalCorrect || 0, color: '#69F0AE', icon: '✅' },
    { label: 'Último score', value: latest ? `${latest.score}%` : '—', color: latest?.passed ? '#00E5A0' : '#FF5252', icon: '🎯' },
  ]
  return (
    <div className="hidden xl:flex flex-col gap-3 w-48 shrink-0">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl p-4 text-center backdrop-blur-sm"
          style={{
            background: 'rgba(0,10,5,0.7)',
            border: `1px solid ${item.color}25`,
            boxShadow: `0 0 20px ${item.color}10`
          }}>
          <div className="text-2xl mb-1">{item.icon}</div>
          <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
          <div className="text-gray-500 text-xs mt-1">{item.label}</div>
        </div>
      ))}
      <div className="rounded-2xl p-4 text-center backdrop-blur-sm"
        style={{ background: 'rgba(0,10,5,0.7)', border: '1px solid #FFD70025' }}>
        <div className="text-2xl mb-1">⚡</div>
        <div className="text-lg font-bold" style={{ color: '#FFD700' }}>PNP</div>
        <div className="text-gray-500 text-xs mt-1">Simulador oficial</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loadFromStorage } = useAuthStore()
  const [gami, setGami] = useState<GamificationStatus | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [latest, setLatest] = useState<LatestSession | null>(null)
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)
  const [slide, setSlide] = useState(0)

  const slides = [
    { bg: 'linear-gradient(135deg, #2D5A3D 0%, #0F1F14 100%)', text: '🐊 Entrena como cocodrilo', sub: 'Cada pregunta correcta te acerca al siguiente nivel', color: '#4A7C59' },
    { bg: 'linear-gradient(135deg, #1A0D00 0%, #0A0500 100%)', text: '🎯 Domina el examen PNP', sub: 'Más de 1,000 preguntas del valorario oficial', color: '#FF7043' },
    { bg: 'linear-gradient(135deg, #001A2A 0%, #000D15 100%)', text: '🏆 Compite en el ranking', sub: 'Demuestra quién manda en tu unidad', color: '#4FC3F7' },
  ]

  useEffect(() => {
    loadFromStorage()
    loadAll()
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [])

  const loadAll = async () => {
    try {
      const [g, s, l, cats] = await Promise.all([
        gamificationApi.getMyStatus(),
        examsApi.getMyStats(),
        examsApi.getLatestSession(),
        examsApi.getCategoryStats(),
      ])
      setGami(g.data)
      setStats(s.data)
      setLatest(l.data)
      setCategoryStats(Array.isArray(cats.data) ? cats.data : [])
    } catch { } finally { setLoading(false) }
  }

  const lastCorrects = latest?.correctAnswers || 0
  const liga = getLeague(lastCorrects)
  const cfg = leagueConfig[liga]
  const pct = cfg.correctasNext > 0 ? Math.min((lastCorrects / cfg.correctasNext) * 100, 100) : 100
  const isNew = !latest

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.15; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.35; }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-animate { animation: slide-in 0.5s ease forwards; }
      `}</style>

      <div className="flex gap-6">
        <div className="flex-1 space-y-4 min-w-0">

          {/* HERO CARRUSEL */}
          <div className="relative overflow-hidden rounded-2xl h-36 md:h-44"
            style={{ background: slides[slide].bg }}>
            <Particles />
            <div className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'linear-gradient(#4A7C59 1px, transparent 1px), linear-gradient(90deg, #4A7C59 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }} />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-20 blur-3xl"
              style={{ backgroundColor: slides[slide].color }} />
            <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-8 slide-animate" key={slide}>
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">{slides[slide].text}</div>
              <div className="text-sm md:text-base" style={{ color: slides[slide].color }}>{slides[slide].sub}</div>
            </div>
            <div className="absolute bottom-3 left-6 flex gap-1.5">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  className="w-6 h-1 rounded-full transition-all"
                  style={{ backgroundColor: i === slide ? slides[slide].color : '#ffffff30' }} />
              ))}
            </div>
          </div>

          {/* HEADER */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                {isNew ? '¡Bienvenido,' : '¡Hola,'}{' '}
                <span style={{ color: cfg.color }}>{user?.fullName?.split(' ')[0]}</span>
                {' '}{cfg.emoji}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">{user?.rank} · {user?.unit}</p>
            </div>
            <Link href="/exams"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #4A7C59, #2D5A3D)', color: '#000', boxShadow: '0 0 20px #4A7C5950' }}>
              📝 Nuevo simulacro
            </Link>
          </div>

          {/* CTA NUEVO USUARIO */}
          {isNew && (
            <div className="relative overflow-hidden rounded-2xl p-6"
              style={{ background: 'rgba(0,30,18,0.9)', border: '1px solid #4A7C5930', boxShadow: '0 0 30px #4A7C5915' }}>
              <p className="text-gray-400 text-base mb-4">Descubre tu nivel y empieza a escalar en el ranking PNP.</p>
              <Link href="/exams"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base"
                style={{ background: 'linear-gradient(135deg, #4A7C59, #2D5A3D)', color: '#000' }}>
                Comenzar mi primer simulacro →
              </Link>
            </div>
          )}

          {/* LIGA */}
          {!loading && latest && (
            <div className="rounded-2xl p-5"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: `0 0 25px ${cfg.glow}30` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.border}` }}>
                    {cfg.emoji}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Liga actual</div>
                    <div className="text-2xl md:text-3xl font-bold"
                      style={{ color: cfg.color, textShadow: `0 0 20px ${cfg.color}80` }}>
                      {liga}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white">{lastCorrects}</div>
                  <div className="text-xs text-gray-500">correctas · último simulacro</div>
                  {cfg.correctasNext > 0 && (
                    <div className="text-sm mt-1 font-semibold" style={{ color: cfg.color }}>
                      {cfg.correctasNext - lastCorrects} para {cfg.next}
                    </div>
                  )}
                </div>
              </div>
              {cfg.correctasNext > 0 && (
                <>
                  <div className="w-full h-2 rounded-full mb-1" style={{ backgroundColor: '#ffffff08' }}>
                    <div className="h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cfg.color}60, ${cfg.color})`, boxShadow: `0 0 10px ${cfg.color}` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>0</span><span>{cfg.correctasNext} → {cfg.next}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ÚLTIMO SIMULACRO */}
          {latest && (
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(0,8,16,0.9)', border: '1px solid #4FC3F720' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white font-bold text-lg">Último simulacro</div>
                  <div className="text-gray-600 text-sm mt-0.5">
                    {new Date(latest.finishedAt).toLocaleDateString('es-PE', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold"
                    style={{ color: latest.passed ? '#00E5A0' : '#FF5252', textShadow: `0 0 20px ${latest.passed ? '#00E5A0' : '#FF5252'}` }}>
                    {latest.score}%
                  </div>
                  <div className="text-sm font-semibold" style={{ color: latest.passed ? '#00E5A0' : '#FF5252' }}>
                    {latest.passed ? '✓ Aprobado' : '✗ No aprobado'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Correctas', value: latest.correctAnswers, color: '#00E5A0', bg: 'rgba(0,229,160,0.06)', border: '#00E5A020' },
                  { label: 'Incorrectas', value: latest.totalQuestions - latest.correctAnswers, color: '#FF5252', bg: 'rgba(255,82,82,0.06)', border: '#FF525220' },
                  { label: 'Tiempo', value: formatTime(latest.timeSpentSeconds), color: '#4FC3F7', bg: 'rgba(79,195,247,0.06)', border: '#4FC3F720' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-4 text-center"
                    style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
                    <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
                    <div className="text-gray-500 text-sm mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/result/${latest.sessionId}`}
                  className="text-center py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ backgroundColor: 'rgba(79,195,247,0.08)', color: '#4FC3F7', border: '1px solid #4FC3F720' }}>
                  Ver respuestas →
                </Link>
                <Link href="/ranking"
                  className="text-center py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ backgroundColor: 'rgba(0,229,160,0.08)', color: '#00E5A0', border: '1px solid #00E5A020' }}>
                  Ver ranking →
                </Link>
              </div>
            </div>
          )}

          {/* ESTADÍSTICAS POR CATEGORÍA */}
          {categoryStats.length > 0 && (
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(0,8,16,0.9)', border: '1px solid #4FC3F720' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-white font-bold text-base">📊 Rendimiento por categoría</div>
                  <div className="text-gray-600 text-xs mt-0.5">Basado en todos tus simulacros</div>
                </div>
              </div>
              <div className="space-y-3">
                {categoryStats.map((cat, i) => {
                  const color = cat.percentage >= 75 ? '#00E5A0'
                    : cat.percentage >= 50 ? '#FFD700' : '#FF5252'
                  const bgColor = cat.percentage >= 75 ? 'rgba(0,229,160,0.06)'
                    : cat.percentage >= 50 ? 'rgba(255,215,0,0.06)' : 'rgba(255,82,82,0.06)'
                  return (
                    <div key={i} className="rounded-xl p-3"
                      style={{ backgroundColor: bgColor, border: `1px solid ${color}20` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{cat.category}</span>
                          <span className="text-xs text-gray-500">{cat.total} preguntas</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span style={{ color: '#00E5A0' }}>✓ {cat.correct}</span>
                          <span style={{ color: '#FF5252' }}>✗ {cat.incorrect}</span>
                          <span className="font-bold text-sm" style={{ color }}>{cat.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#ffffff08' }}>
                        <div className="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${cat.percentage}%`,
                            background: `linear-gradient(90deg, ${color}60, ${color})`,
                            boxShadow: `0 0 6px ${color}`
                          }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              {categoryStats.length > 0 && (
                <div className="mt-3 pt-3 text-xs text-gray-600"
                  style={{ borderTop: '1px solid #ffffff08' }}>
                  💡 Tu punto débil: <span style={{ color: '#FF5252' }}>{categoryStats[0].category}</span> — enfócate en reforzarlo
                </div>
              )}
            </div>
          )}

          {/* ALERTA ANTI-FÓSIL */}
          {gami && gami.fossilRiskScore > 40 && (
            <div className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: 'rgba(255,82,82,0.06)', border: '1px solid #FF525225' }}>
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <div className="font-semibold" style={{ color: '#FF5252' }}>¡Estás oxidándote!</div>
                <div className="text-gray-500 text-sm">Tu rancho te está aventajando en el ranking.</div>
              </div>
              <Link href="/exams" className="px-4 py-2 rounded-lg text-sm font-bold"
                style={{ backgroundColor: '#FF5252', color: '#fff' }}>
                Practicar →
              </Link>
            </div>
          )}

          {/* CONTADOR REGRESIVO */}
          {(() => {
            const examDate = new Date('2026-10-15')
            const today = new Date()
            const daysLeft = Math.ceil((examDate.getTime() - today.getTime()) / 86400000)
            if (daysLeft <= 0) return null
            return (
              <div className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Examen de ascenso PNP</div>
                  <div className="text-white font-bold">⏳ Faltan {daysLeft} días</div>
                  <div className="text-gray-500 text-xs mt-0.5">Fecha estimada: 15 de octubre 2026</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold" style={{ color: '#FFD700' }}>{daysLeft}</div>
                  <div className="text-xs text-gray-600">días</div>
                </div>
              </div>
            )
          })()}

          {/* HISTORIAL */}
          {!isNew && (
            <Link href="/history"
              className="block rounded-2xl p-4 transition-all hover:opacity-80"
              style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff08' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">📋 Ver historial completo</div>
                  <div className="text-gray-600 text-xs mt-0.5">Todos tus simulacros anteriores</div>
                </div>
                <div className="text-gray-500">→</div>
              </div>
            </Link>
          )}

          {/* PREMIUM */}
          {user?.planType === 'Free' && (
            <div className="rounded-2xl p-5 flex items-center justify-between gap-4"
              style={{ background: 'linear-gradient(135deg, rgba(26,18,0,0.9), rgba(42,30,0,0.9))', border: '1px solid #FFD70025' }}>
              <div>
                <div className="text-lg font-bold" style={{ color: '#FFD700' }}>⭐ Desbloquea Premium</div>
                <div className="text-gray-500 text-sm mt-1">Simulacros ilimitados · Banco completo · Sin límites</div>
              </div>
              <Link href="/premium"
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA000)', color: '#000' }}>
                Ver planes
              </Link>
            </div>
          )}

        </div>

        {/* STATS LATERALES */}
        <SideStats stats={stats} latest={latest} />
      </div>
    </>
  )
}

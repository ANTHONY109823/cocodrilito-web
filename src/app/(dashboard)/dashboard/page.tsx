'use client'

import { startTransition, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Flame,
  Play,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { toast } from '@/components/Toast'
import { Button, ErrorState } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getApiErrorMessage } from '@/lib/api/errors'
import { examsApi } from '@/lib/api/exams'
import { gamificationApi } from '@/lib/api/gamification'
import { useAuthStore } from '@/lib/store/authStore'
import { cn } from '@/lib/utils/cn'

interface GamificationStatus {
  currentLeague: string
  totalXp: number
  currentStreakDays: number
  examsCompleted: number
}

interface Stats {
  totalSessions: number
  totalCorrect: number
  totalIncorrect: number
  totalUnanswered: number
  totalQuestions: number
}

interface LatestSession {
  correctAnswers: number
  score: number
  passed: boolean
}

interface HistoryEntry {
  score: number
}

interface MyRanking {
  position: number
}

const leagueConfig: Record<string, { emoji: string; next: string; xpTarget: number }> = {
  'Cola Cortada': { emoji: '🏆', next: 'Máximo nivel', xpTarget: 0 },
  'Creo que nos cortan la cola': { emoji: '✂️', next: 'Cola Cortada', xpTarget: 2000 },
  Lagartito: { emoji: '🦎', next: 'Creo que nos cortan la cola', xpTarget: 1500 },
  Cocodrilito: { emoji: '🐊', next: 'Lagartito', xpTarget: 1000 },
  Dinosaurio: { emoji: '🦕', next: 'Cocodrilito', xpTarget: 500 },
}

const getLeague = (n: number) => {
  if (n >= 100) return 'Cola Cortada'
  if (n >= 75) return 'Creo que nos cortan la cola'
  if (n >= 50) return 'Lagartito'
  if (n >= 25) return 'Cocodrilito'
  return 'Dinosaurio'
}

function StatCard({
  icon: Icon,
  iconClass,
  value,
  label,
  trend,
  trendColor = 'text-[#318F48]',
}: {
  icon: typeof FileText
  iconClass: string
  value: string | number
  label: string
  trend: string
  trendColor?: string
}) {
  return (
    <div className="rounded-xl border border-[rgba(189,255,223,0.12)] bg-[#0D1A10] px-3.5 py-4">
      <div
        className={cn(
          'mb-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-lg',
          iconClass
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <div className="text-[22px] font-extrabold text-white">{value}</div>
      <div className="mt-0.5 text-[11px] text-[#6B8A75]">{label}</div>
      <div className={cn('mt-1 text-[11px]', trendColor)}>{trend}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [gami, setGami] = useState<GamificationStatus | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [latest, setLatest] = useState<LatestSession | null>(null)
  const [myRanking, setMyRanking] = useState<MyRanking | null>(null)
  const [chartScores, setChartScores] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [g, s, l, h, r] = await Promise.all([
        gamificationApi.getMyStatus(),
        examsApi.getMyStats(),
        examsApi.getLatestSession(),
        examsApi.getHistory(7),
        gamificationApi.getMyRanking(),
      ])
      setGami(g.data)
      setStats(s.data)
      setLatest(l.data)
      setMyRanking(r.data)

      const historyItems: HistoryEntry[] = Array.isArray(h.data)
        ? h.data
        : h.data?.items ?? []
      const scores = historyItems
        .slice(0, 7)
        .reverse()
        .map((entry) => entry.score)
      setChartScores(scores)
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Error al cargar el dashboard')
      console.error('[dashboard] loadAll failed:', err)
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const firstName = user?.fullName?.split(' ')[0] || 'Cadete'
  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const sessions = stats?.totalSessions ?? gami?.examsCompleted ?? 0
  const totalQ = stats?.totalQuestions ?? 0
  const avgPct =
    totalQ > 0
      ? Math.round(((stats?.totalCorrect ?? 0) / totalQ) * 100)
      : latest?.score ?? 0
  const streak = gami?.currentStreakDays ?? 0
  const liga = getLeague(latest?.correctAnswers ?? 0)
  const ligaCfg = leagueConfig[liga] ?? leagueConfig.Dinosaurio
  const xp = gami?.totalXp ?? 0
  const xpTarget = ligaCfg.xpTarget || 2000
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Buen día' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center text-[#6B8A75]">
        Cargando estadísticas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <ErrorState message={error} onRetry={() => void loadAll()} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white md:text-2xl">
            {greet}, {firstName} 👋
          </h1>
          <p className="mt-0.5 text-[13px] capitalize text-[#6B8A75]">{today}</p>
        </div>
        <span className="rounded-full border border-[#318F48] bg-[#318F48]/15 px-3 py-1.5 text-xs font-medium text-[#318F48]">
          {ligaCfg.emoji} Liga {liga}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          iconClass="bg-[#318F48]/15 text-[#318F48]"
          value={sessions}
          label="Exámenes realizados"
          trend="↑ Actividad registrada"
        />
        <StatCard
          icon={TrendingUp}
          iconClass="bg-[rgba(24,95,165,0.15)] text-[#378ADD]"
          value={`${avgPct}%`}
          label="Promedio de notas"
          trend="↑ Basado en tu historial"
          trendColor="text-[#378ADD]"
        />
        <StatCard
          icon={Flame}
          iconClass="bg-[rgba(186,117,23,0.15)] text-[#BA7517]"
          value={streak}
          label="Días de racha"
          trend={streak > 0 ? '🔥 ¡Sigue así!' : 'Practica hoy'}
          trendColor="text-[#BA7517]"
        />
        <div className="rounded-xl border border-[rgba(189,255,223,0.12)] bg-[#0D1A10] px-3.5 py-4">
          <div className="mb-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-[rgba(201,148,58,0.15)]">
            <Trophy className="h-[18px] w-[18px] text-[#C9943A]" />
          </div>
          <div className="text-[22px] font-extrabold text-white">
            {myRanking?.position != null ? `#${myRanking.position}` : '—'}
          </div>
          <div className="mt-0.5 text-[11px] text-[#6B8A75]">Posición ranking</div>
          <Link
            href="/ranking"
            className="mt-1 inline-block text-[11px] text-[#C9943A] hover:underline"
          >
            Ver ranking →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-[rgba(74,124,89,0.2)] bg-[#0D1A10] px-3.5 py-3 text-center">
          <div className="text-[20px] font-extrabold text-[#318F48]">{stats?.totalCorrect ?? 0}</div>
          <div className="mt-0.5 text-[11px] text-[#6B8A75]">✅ Correctas (total)</div>
        </div>
        <div className="rounded-xl border border-[rgba(255,82,82,0.2)] bg-[#0D1A10] px-3.5 py-3 text-center">
          <div className="text-[20px] font-extrabold text-[#FF5252]">{stats?.totalIncorrect ?? 0}</div>
          <div className="mt-0.5 text-[11px] text-[#6B8A75]">❌ Incorrectas (total)</div>
        </div>
        <div className="rounded-xl border border-[rgba(255,215,0,0.2)] bg-[#0D1A10] px-3.5 py-3 text-center">
          <div className="text-[20px] font-extrabold text-[#FFD700]">{stats?.totalUnanswered ?? 0}</div>
          <div className="mt-0.5 text-[11px] text-[#6B8A75]">⬜ Sin responder (total)</div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-[rgba(189,255,223,0.12)] bg-[#0D1A10] p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-white">
            Rendimiento últimos 7 exámenes
          </h3>
          {chartScores.length === 0 ? (
            <EmptyState
              icon="📊"
              title="Sin datos aún"
              description="Completa simulacros para ver tu evolución."
              action={{ label: 'Ir a exámenes', href: '/exams' }}
              className="border-0 bg-transparent p-4"
            />
          ) : (
            <div className="flex h-20 items-end gap-1.5">
              {chartScores.map((score, i) => (
                <div
                  key={`score-${i}-${score}`}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      'w-full rounded-t transition-colors',
                      i === chartScores.length - 1
                        ? 'bg-[#318F48]'
                        : 'bg-[rgba(189,255,223,0.12)] hover:bg-[#318F48]/70'
                    )}
                    style={{ height: `${Math.max(8, score)}%` }}
                  />
                  <span className="text-[9px] text-[#6B8A75]">{score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[rgba(189,255,223,0.12)] bg-[#0D1A10] p-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[32px]">{ligaCfg.emoji}</span>
            <div>
              <div className="text-[15px] font-bold text-white">{liga}</div>
              <div className="text-xs text-[#6B8A75]">
                Liga actual · {xp.toLocaleString()} XP
              </div>
            </div>
          </div>
          {xpTarget > 0 && (
            <>
              <ProgressBar value={xp} max={xpTarget} color="green" animated />
              <p className="text-xs text-[#6B8A75]">
                Siguiente:{' '}
                <span className="font-semibold text-[#C9943A]">{ligaCfg.next}</span>
                {xpTarget > xp && ` · faltan ${xpTarget - xp} XP`}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Link href="/exams" className="block">
          <Button
            variant="primary"
            size="md"
            fullWidth
            className="justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            Iniciar Simulacro General
          </Button>
        </Link>
        <Link href="/exams" className="block">
          <Button
            variant="outline"
            size="md"
            fullWidth
            className="justify-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Repasar por Categoría
          </Button>
        </Link>
      </div>

      {latest && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[rgba(189,255,223,0.12)] bg-[#0D1A10] p-4">
          <div>
            <p className="text-sm font-semibold text-white">Último simulacro</p>
            <p className="text-xs text-[#6B8A75]">
              {latest.passed ? 'Aprobado' : 'No aprobado'} · {latest.score}%
            </p>
          </div>
          <Link
            href="/history"
            className="text-sm font-medium text-[#318F48] hover:text-[#5EC97A]"
          >
            Ver historial →
          </Link>
        </div>
      )}

      {user?.planType === 'Free' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#C9943A]/30 bg-[#C9943A]/10 p-4">
          <div>
            <p className="font-bold text-[#C9943A]">⭐ Desbloquea Premium</p>
            <p className="mt-0.5 text-xs text-[#6B8A75]">
              Simulacros ilimitados y banco completo
            </p>
          </div>
          <Link href="/premium">
            <Button variant="outline" size="sm" className="border-[#C9943A] text-[#C9943A]">
              Ver planes
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

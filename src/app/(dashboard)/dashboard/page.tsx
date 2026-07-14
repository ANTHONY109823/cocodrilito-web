'use client'

import Link from 'next/link'
import {
  FileText,
  Flame,
  Play,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { Button, ErrorState } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useStudentDashboard } from '@/hooks/useStudentDashboard'
import { useAuthStore } from '@/lib/store/authStore'
import { cn } from '@/lib/utils/cn'
import { formatProgressPoints, rankEmoji } from '@/lib/constants/progressRanks'

interface GamificationStatus {
  currentLeague?: string
  currentRank?: string
  totalXp?: number
  progressPoints?: number
  nextRank?: string | null
  pointsToNextRank?: number
  rankProgressPercent?: number
  currentStreakDays?: number
  examsCompleted?: number
  maxProgressPoints?: number
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

function StatCard({
  icon: Icon,
  iconClass,
  value,
  label,
  trend,
  trendColor = 'text-[var(--color-primary)]',
}: {
  icon: typeof FileText
  iconClass: string
  value: string | number
  label: string
  trend: string
  trendColor?: string
}) {
  return (
    <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)] px-3.5 py-4">
      <div
        className={cn(
          'mb-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-lg',
          iconClass
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      </div>
      <div className="text-[22px] font-extrabold text-[var(--color-text-primary)]">{value}</div>
      <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{label}</div>
      <div className={cn('mt-1 text-[11px]', trendColor)}>{trend}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { gami, stats, latest, chartScores, loading, error } = useStudentDashboard()

  const gamiData = gami as GamificationStatus | null
  const statsData = stats as Stats | null
  const latestData = latest as LatestSession | null

  const firstName = user?.fullName?.split(' ')[0] || 'Cadete'
  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const sessions = statsData?.totalSessions ?? gamiData?.examsCompleted ?? 0
  const totalQ = statsData?.totalQuestions ?? 0
  const avgPct =
    totalQ > 0
      ? Math.round(((statsData?.totalCorrect ?? 0) / totalQ) * 100)
      : latestData?.score ?? 0
  const streak = gamiData?.currentStreakDays ?? 0
  const rank = gamiData?.currentRank ?? gamiData?.currentLeague ?? 'Bronce'
  const points = gamiData?.progressPoints ?? gamiData?.totalXp ?? 0
  const nextRank = gamiData?.nextRank ?? null
  const pointsToNext = gamiData?.pointsToNextRank ?? 0
  const rankPercent = gamiData?.rankProgressPercent ?? 0
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Buen día' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  if (loading && !gamiData && !statsData) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center text-[var(--color-text-muted)]">
        Cargando estadísticas...
      </div>
    )
  }

  if (error && !gamiData && !statsData) {
    const msg = getApiErrorMessage(error, 'Error al cargar el dashboard')
    return (
      <div className="mx-auto max-w-6xl">
        <ErrorState message={msg} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--color-text-primary)] md:text-2xl">
            {greet}, {firstName} 👋
          </h1>
          <p className="mt-0.5 text-[13px] capitalize text-[var(--color-text-muted)]">{today}</p>
        </div>
        <span className="rounded-full border border-[#318F48] bg-[#318F48]/15 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)]">
          {rankEmoji(rank)} {rank}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          iconClass="bg-[#318F48]/15 text-[var(--color-primary)]"
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
        <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)] px-3.5 py-4">
          <div className="mb-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-[rgba(201,148,58,0.15)]">
            <Trophy className="h-[18px] w-[18px] text-[#C9943A]" />
          </div>
          <div className="text-[22px] font-extrabold text-[var(--color-text-primary)]">
            {rankEmoji(rank)} {rank}
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Tu rango</div>
          <Link
            href="/ranking"
            className="mt-1 inline-block text-[11px] text-[#C9943A] hover:underline"
          >
            Ver progreso →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-[rgba(74,124,89,0.2)] bg-[var(--color-surface-card)] px-3.5 py-3 text-center">
          <div className="text-[20px] font-extrabold text-[var(--color-primary)]">{statsData?.totalCorrect ?? 0}</div>
          <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">✅ Correctas (total)</div>
        </div>
        <div className="rounded-xl border border-[rgba(255,82,82,0.2)] bg-[var(--color-surface-card)] px-3.5 py-3 text-center">
          <div className="text-[20px] font-extrabold text-[#FF5252]">{statsData?.totalIncorrect ?? 0}</div>
          <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">❌ Incorrectas (total)</div>
        </div>
        <div className="rounded-xl border border-[rgba(255,215,0,0.2)] bg-[var(--color-surface-card)] px-3.5 py-3 text-center">
          <div className="text-[20px] font-extrabold text-[#FFD700]">{statsData?.totalUnanswered ?? 0}</div>
          <div className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">⬜ Sin responder (total)</div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)] p-4">
          <h3 className="mb-3 text-[13px] font-semibold text-[var(--color-text-primary)]">
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
                  <span className="text-[9px] text-[var(--color-text-muted)]">{score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)] p-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[32px]">{rankEmoji(rank)}</span>
            <div>
              <div className="text-[15px] font-bold text-[var(--color-text-primary)]">{rank}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                Tu progreso · {formatProgressPoints(points)}
              </div>
            </div>
          </div>
          <ProgressBar value={nextRank ? rankPercent : 100} max={100} color="green" animated />
          <p className="text-xs text-[var(--color-text-muted)]">
            {nextRank ? (
              <>
                Siguiente:{' '}
                <span className="font-semibold text-[#C9943A]">{nextRank}</span>
                {pointsToNext > 0 && ` · faltan ${pointsToNext} pts`}
              </>
            ) : (
              <span className="font-semibold text-[#C9943A]">¡Rango máximo: Leyenda!</span>
            )}
          </p>
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

      {latestData && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)] p-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Último simulacro</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {latestData.passed ? 'Aprobado' : 'No aprobado'} · {latestData.score}%
            </p>
          </div>
          <Link
            href="/history"
            className="text-sm font-medium text-[var(--color-primary)] hover:text-[#5EC97A]"
          >
            Ver historial →
          </Link>
        </div>
      )}

      {user?.planType === 'Free' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#C9943A]/30 bg-[#C9943A]/10 p-4">
          <div>
            <p className="font-bold text-[#C9943A]">⭐ Desbloquea Premium</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
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

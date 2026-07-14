'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Card, ErrorState, ProgressBar } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/lib/store/authStore'
import { swrFetcher } from '@/lib/swr/fetcher'
import { getApiErrorMessage } from '@/lib/api/errors'
import {
  MAX_PROGRESS_POINTS,
  PROGRESS_RANKS,
  formatProgressPoints,
  rankEmoji,
} from '@/lib/constants/progressRanks'
import { cn } from '@/lib/utils/cn'

interface ProgressStatus {
  totalXp?: number
  progressPoints?: number
  currentRank?: string
  currentLeague?: string
  nextRank?: string | null
  currentRankMin?: number
  nextRankMin?: number | null
  pointsToNextRank?: number
  rankProgressPercent?: number
  maxProgressPoints?: number
  examsCompleted?: number
  currentStreakDays?: number
  badges?: string[]
}

export default function ProgressRankPage() {
  const { user } = useAuthStore()
  const { data, error, isLoading, mutate } = useSWR<ProgressStatus>(
    '/gamification/me',
    swrFetcher,
    { revalidateOnFocus: true, dedupingInterval: 30_000 }
  )

  const errorMessage = error ? getApiErrorMessage(error, 'Error al cargar tu progreso') : null
  const points = data?.progressPoints ?? data?.totalXp ?? 0
  const rank = data?.currentRank ?? data?.currentLeague ?? 'Bronce'
  const nextRank = data?.nextRank ?? null
  const pointsToNext = data?.pointsToNextRank ?? Math.max(0, (data?.nextRankMin ?? MAX_PROGRESS_POINTS) - points)
  const percent = data?.rankProgressPercent
    ?? (nextRank
      ? Math.min(100, Math.round(
          ((points - (data?.currentRankMin ?? 0)) /
            Math.max(1, (data?.nextRankMin ?? MAX_PROGRESS_POINTS) - (data?.currentRankMin ?? 0))) *
            100
        ))
      : 100)
  const maxPts = data?.maxProgressPoints ?? MAX_PROGRESS_POINTS

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-start gap-3 sm:gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          ← Inicio
        </Link>
        <div>
          <h1 className="text-xl font-bold text-theme-primary sm:text-2xl">Mi rango</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Progreso personal · no se compara con otros alumnos
          </p>
        </div>
      </div>

      {errorMessage ? (
        <ErrorState message={errorMessage} onRetry={() => void mutate()} />
      ) : isLoading && !data ? (
        <p className="py-12 text-center text-[var(--color-text-muted)]">Cargando tu rango...</p>
      ) : (
        <>
          <Card
            variant="highlighted"
            padding="md"
            className="mb-4 rounded-xl border-[var(--color-surface-border)] bg-[var(--color-primary-bg)]"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-5xl" aria-hidden>
                {rankEmoji(rank)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-[var(--color-text-muted)]">{user?.fullName}</div>
                <div className="text-2xl font-extrabold text-[var(--color-text-primary)]">{rank}</div>
                <div className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  {formatProgressPoints(points)}
                  {nextRank
                    ? ` · faltan ${pointsToNext} para ${nextRank}`
                    : ' · rango máximo'}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar
                value={nextRank ? percent : 100}
                max={100}
                color="green"
                animated
              />
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Meta Leyenda: {formatProgressPoints(maxPts)} · Básico 1 · Intermedio 2 · Avanzado 5 pts/acierto
              </p>
            </div>
          </Card>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <Card padding="sm" className="rounded-xl text-center">
              <div className="text-xl font-bold text-[var(--color-text-primary)]">
                {data?.examsCompleted ?? 0}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Simulacros</div>
            </Card>
            <Card padding="sm" className="rounded-xl text-center">
              <div className="text-xl font-bold text-[var(--color-text-primary)]">
                {data?.currentStreakDays ?? 0}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Días de racha</div>
            </Card>
          </div>

          <h2 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Camino de rangos</h2>
          <div className="mb-6 space-y-2">
            {PROGRESS_RANKS.map((r) => {
              const reached = points >= r.threshold
              const current = rank.toLowerCase() === r.name.toLowerCase()
              return (
                <div
                  key={r.name}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2.5',
                    current
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)]'
                      : reached
                        ? 'border-[var(--color-surface-border)] bg-[var(--color-surface-card)]'
                        : 'border-[var(--color-surface-border)] opacity-55'
                  )}
                >
                  <span className="text-xl">{r.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">{r.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      Desde {formatProgressPoints(r.threshold)}
                    </div>
                  </div>
                  {current ? (
                    <span className="text-xs font-semibold text-[var(--color-primary)]">Actual</span>
                  ) : reached ? (
                    <span className="text-xs text-[var(--color-text-muted)]">✓</span>
                  ) : null}
                </div>
              )
            })}
          </div>

          {(data?.badges?.length ?? 0) > 0 ? (
            <div className="mb-4">
              <h2 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">Logros</h2>
              <div className="flex flex-wrap gap-2">
                {data!.badges!.map((b) => (
                  <span
                    key={b}
                    className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-card)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <EmptyState
            icon="🎯"
            title="Suma puntos en cada simulacro"
            description="Básico, Intermedio y Avanzado cuentan. Termina exámenes y acierta para subir de rango."
            action={{ label: 'Ir a exámenes', href: '/exams' }}
          />
        </>
      )}
    </div>
  )
}

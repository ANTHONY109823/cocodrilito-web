'use client'

import Link from 'next/link'
import { Badge, Card, ErrorState } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/lib/store/authStore'
import { useRanking } from '@/hooks/useRanking'
import { leagueEmoji } from '@/lib/utils/league'
import { getApiErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils/cn'

const podiumStyles: Record<number, string> = {
  1: 'border-[#C9943A]/30 bg-[#C9943A]/10',
  2: 'border-[rgba(189,255,223,0.2)] bg-[rgba(189,255,223,0.06)]',
  3: 'border-[#BA7517]/30 bg-[#BA7517]/10',
}

const podiumScoreColor: Record<number, string> = {
  1: 'text-[#C9943A]',
  2: 'text-[#A8BFB0]',
  3: 'text-[#BA7517]',
}

function PositionBadge({ position }: { position: number }) {
  if (position <= 3) {
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'
    return (
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
          podiumStyles[position]
        )}
      >
        {medal}
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(189,255,223,0.08)] text-sm font-bold text-[#6B8A75]">
      #{position}
    </div>
  )
}

export default function RankingPage() {
  const { user } = useAuthStore()
  const { ranking, myRanking, isLoading, error, refresh } = useRanking()

  const errorMessage = error ? getApiErrorMessage(error, 'Error al cargar el ranking') : null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-start gap-3 sm:gap-4">
        <Link href="/dashboard" className="text-sm text-[#6B8A75] transition-colors hover:text-white">
          ← Inicio
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Ranking PNP 🏆</h1>
          <p className="mt-0.5 text-sm text-[#6B8A75]">Los mejores efectivos del simulacro</p>
        </div>
      </div>

      {myRanking && (
        <Card
          variant="highlighted"
          padding="sm"
          className="mb-4 rounded-xl border-[rgba(49,143,72,0.35)] bg-[rgba(49,143,72,0.08)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(49,143,72,0.2)] text-lg font-bold text-[#318F48]">
                #{myRanking.position}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Tu posición</div>
                <div className="text-xs text-[#6B8A75]">{user?.fullName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#318F48]">
                {leagueEmoji[myRanking.currentLeague]} {myRanking.currentLeague}
              </div>
              <div className="text-xs text-[#6B8A75]">
                Promedio {myRanking.averageScore}% · {myRanking.examsCompleted} exámenes
              </div>
            </div>
          </div>
        </Card>
      )}

      {!isLoading && ranking.length >= 3 && (
        <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
          {[ranking[1], ranking[0], ranking[2]].map((entry, i) => {
            if (!entry) return null
            const actualPos = i === 0 ? 2 : i === 1 ? 1 : 3
            return (
              <Card
                key={entry.userId}
                padding="sm"
                className={cn(
                  'rounded-xl text-center',
                  podiumStyles[actualPos],
                  actualPos === 1 ? 'py-5 sm:py-6' : 'py-3 sm:py-4'
                )}
              >
                <div className="mb-1 text-2xl">
                  {actualPos === 1 ? '🥇' : actualPos === 2 ? '🥈' : '🥉'}
                </div>
                <div className="truncate text-xs font-bold text-white">{entry.fullName.split(' ')[0]}</div>
                <div className={cn('mt-0.5 text-xs', podiumScoreColor[actualPos])}>
                  {entry.averageScore}% prom.
                </div>
                <div className="mt-0.5 text-xs text-[#6B8A75]">{leagueEmoji[entry.currentLeague]}</div>
              </Card>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-[rgba(189,255,223,0.12)] bg-[#0D1A10]"
            />
          ))}
        </div>
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={() => refresh()} />
      ) : ranking.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Ranking vacío"
          description="Sé el primero en completar un simulacro."
          action={{ label: 'Hacer simulacro →', href: '/exams' }}
        />
      ) : (
        <div className="space-y-2">
          {ranking.map((entry) => {
            const isMe = entry.userId === user?.id
            return (
              <Card
                key={entry.userId}
                padding="sm"
                className={cn(
                  'rounded-xl transition-transform hover:translate-x-1',
                  isMe && 'border-[rgba(49,143,72,0.35)] bg-[rgba(49,143,72,0.06)]'
                )}
              >
                <div className="flex items-center gap-3">
                  <PositionBadge position={entry.position} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">{entry.fullName}</span>
                      {isMe && <Badge color="green">tú</Badge>}
                    </div>
                    <div className="truncate text-xs text-[#6B8A75]">
                      {entry.rank} · {entry.unit}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-[#318F48]">{entry.averageScore}%</div>
                    <div className="text-xs text-[#6B8A75]">
                      {leagueEmoji[entry.currentLeague]} {entry.currentLeague}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

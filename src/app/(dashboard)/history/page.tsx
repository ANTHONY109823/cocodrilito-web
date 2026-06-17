'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { toast } from '@/components/Toast'
import { Badge, Button, Card, ErrorState } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import apiClient from '@/lib/api/client'
import { getApiErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils/cn'

interface SessionHistory {
  sessionId: string
  examTitle: string
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpentSeconds: number
  passed: boolean
  finishedAt: string
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/exams/sessions/history')
      setSessions(Array.isArray(res.data) ? res.data : res.data?.items || [])
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Error al cargar el historial')
      console.error('[history] loadHistory failed:', err)
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start gap-3 sm:gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          ← Inicio
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Historial de simulacros
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">Todos tus exámenes anteriores</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)]"
            />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadHistory()} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Sin historial aún"
          description="Completa tu primer simulacro para ver tu historial."
          action={{ label: 'Ir a exámenes →', href: '/exams' }}
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const incorrect = s.totalQuestions - s.correctAnswers
            return (
              <Card
                key={s.sessionId}
                padding="sm"
                className={cn(
                  'rounded-xl',
                  s.passed
                    ? 'border-[var(--color-surface-border)]'
                    : 'border-[rgba(192,57,43,0.25)]'
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{s.examTitle}</span>
                      <Badge color={s.passed ? 'green' : 'red'}>
                        {s.passed ? '✓ Aprobado' : '✗ No aprobado'}
                      </Badge>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">{formatDate(s.finishedAt)}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <span className="text-[var(--color-primary)]">✓ {s.correctAnswers} correctas</span>
                      <span className="text-[#e74c3c]">✗ {incorrect} incorrectas</span>
                      <span className="inline-flex items-center gap-1 text-[#5ba8cc]">
                        <Clock className="h-3 w-3" />
                        {formatTime(s.timeSpentSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                    <div
                      className={cn(
                        'text-2xl font-bold',
                        s.passed ? 'text-[var(--color-primary)]' : 'text-[#e74c3c]'
                      )}
                    >
                      {s.score}%
                    </div>
                    <Link href={`/result/${s.sessionId}`}>
                      <Button variant="outline" size="sm">
                        Ver →
                      </Button>
                    </Link>
                    <Link href={`/review/${s.sessionId}`}>
                      <Button variant="secondary" size="sm">
                        📚 Repasar
                      </Button>
                    </Link>
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

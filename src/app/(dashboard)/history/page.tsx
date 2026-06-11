'use client'

import { useCallback, useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { getApiErrorMessage } from '@/lib/api/errors'
import { toast } from '@/components/Toast'
import { ErrorState } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

import { NEON } from '@/lib/constants/theme'
const RED = '#FF5252'
const GOLD = '#FFD700'
const BLUE = '#4FC3F7'

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

  useEffect(() => { void loadHistory() }, [loadHistory])

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`
  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="max-w-3xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors">
          ← Inicio
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de simulacros</h1>
          <p className="text-gray-500 text-sm mt-0.5">Todos tus exámenes anteriores</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl animate-pulse"
              style={{ backgroundColor: 'rgba(0,8,4,0.6)' }} />
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
        <div className="space-y-3 fade-in">
          {sessions.map((s) => (
            <div key={s.sessionId} className="rounded-2xl p-4"
              style={{
                background: 'rgba(0,8,4,0.9)',
                border: `1px solid ${s.passed ? NEON : RED}15`
              }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-semibold text-sm">{s.examTitle}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: s.passed ? `${NEON}15` : `${RED}15`,
                        color: s.passed ? NEON : RED
                      }}>
                      {s.passed ? '✓ Aprobado' : '✗ No aprobado'}
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs">{formatDate(s.finishedAt)}</div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span style={{ color: NEON }}>✓ {s.correctAnswers} correctas</span>
                    <span style={{ color: RED }}>✗ {s.totalQuestions - s.correctAnswers} incorrectas</span>
                    <span style={{ color: BLUE }}>⏱ {formatTime(s.timeSpentSeconds)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-bold"
                      style={{ color: s.passed ? NEON : RED }}>
                      {s.score}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                   <div className="text-right">
                    <div className="text-2xl font-bold"
                      style={{ color: s.passed ? NEON : RED }}>
                      {s.score}%
                    </div>
                  </div>
                  <Link href={`/result/${s.sessionId}`}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                  style={{ backgroundColor: `${BLUE}15`, color: BLUE, border: `1px solid ${BLUE}20` }}>
                   Ver →
                 </Link>
                  <Link href={`/review/${s.sessionId}`}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                  style={{ backgroundColor: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}20` }}>
                  📚 Repasar
                 </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

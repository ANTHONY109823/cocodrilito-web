'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useSWRConfig } from 'swr'
import { getApiErrorMessage } from '@/lib/api/errors'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  Clock,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { isTenantAdmin, isSuperAdmin } from '@/lib/auth/roles'
import { DEFAULT_QUESTION_TRACK, resolveUserTrackKey, trackKeyFromValue, trackLabel } from '@/lib/constants/trackTypes'
import {
  defaultHierarchyForTrack,
  hierarchiesForTrack,
  hierarchyLabel,
  resolveUserHierarchyValue,
  trackValueForHierarchy,
} from '@/lib/constants/promotionGrades'
import { TrackSwitchBar } from '@/components/admin/preguntas/TrackSwitchBar'
import { HierarchySwitchBar } from '@/components/admin/preguntas/HierarchySwitchBar'
import { prefetchAscensoQuestionCounts } from '@/lib/api/questionCounts'
import { examsApi } from '@/lib/api/exams'
import { saveExamSessionMeta } from '@/lib/examSession'
import { useExamList } from '@/hooks/useExamList'
import { useCategories } from '@/hooks/useCategories'
import { useQuestionCounts } from '@/hooks/useQuestionCounts'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

const CATEGORY_EMOJI: Record<string, string> = {
  'Ley PNP': '⚖️',
  'Régimen disciplinario': '📋',
  'Derechos humanos': '🕊️',
  'Formación profesional': '🎓',
  'Constitución política': '🏛️',
  'Lucha anticorrupción': '🔍',
}

function categoryIcon(name: string) {
  return CATEGORY_EMOJI[name] || '📚'
}

interface Exam {
  id: string
  title: string
  timeLimitSeconds: number
  passingScore: number
}

export default function ExamsPage() {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { user } = useAuthStore()
  const previewMode = isTenantAdmin(user?.role) || isSuperAdmin(user?.role)
  const backHref = isSuperAdmin(user?.role) ? '/superadmin?tab=inicio' : '/admin'
  const [previewTrack, setPreviewTrack] = useState(DEFAULT_QUESTION_TRACK)
  const [previewHierarchy, setPreviewHierarchy] = useState(() =>
    defaultHierarchyForTrack(DEFAULT_QUESTION_TRACK)
  )
  const studentTrackKey = useMemo(() => resolveUserTrackKey(user), [user])
  const effectiveTrackKey = previewMode
    ? trackKeyFromValue(previewTrack)
    : studentTrackKey
  const categoryHierarchy = previewMode
    ? previewHierarchy
    : resolveUserHierarchyValue(user)
  const categoryTrack = trackValueForHierarchy(categoryHierarchy)
  const { exams, isLoading: examsLoading, error: examsError } = useExamList()
  const { categories, isLoading: catsLoading, error: catsError } = useCategories(
    categoryTrack,
    categoryHierarchy
  )
  const {
    total: totalQuestions,
    byCategory: questionCounts,
    isLoading: countsLoading,
    error: countsError,
  } = useQuestionCounts(
    previewMode ? effectiveTrackKey : null,
    previewMode ? categoryHierarchy : null
  )
  const [starting, setStarting] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCount, setSelectedCount] = useState<25 | 50 | 100>(100)
  const startingRef = useRef(false)

  const loading = examsLoading && exams.length === 0 && countsLoading && totalQuestions === 0

  useEffect(() => {
    if (!previewMode) return
    prefetchAscensoQuestionCounts(mutate)
  }, [previewMode, mutate])

  useEffect(() => {
    const err = examsError || catsError || countsError
    if (!err) return
    if (axios.isAxiosError(err) && err.response?.status === 403) {
      setBlocked(true)
    } else {
      setError(getApiErrorMessage(err, 'Error al cargar simulacros'))
    }
  }, [examsError, catsError, countsError])

  const DURATIONS: Record<25 | 50 | 100, string> = {
    25: '~15 minutos',
    50: '~30 minutos',
    100: '~45 minutos',
  }

  const startExam = async (
    examId: string,
    label: string,
    options?: { mode?: string; category?: string; questionCount?: number }
  ) => {
    if (startingRef.current || !examId) return
    startingRef.current = true
    setStarting(label)
    setError(null)
    try {
      const res = await examsApi.start(examId, {
        ...options,
        track: previewMode ? effectiveTrackKey : undefined,
        hierarchy: previewMode ? categoryHierarchy : undefined,
      })
      const sessionId = res.data?.sessionId ?? res.data?.SessionId
      if (!sessionId) {
        setError('El servidor no devolvió un ID de sesión.')
        return
      }
      saveExamSessionMeta(sessionId, res.data ?? {}, options?.category)
      router.push(`/exam/${sessionId}`)
    } catch (err: unknown) {
      const ax = err as {
        response?: { status?: number; data?: { message?: string; code?: string } }
        message?: string
      }
      const status = ax.response?.status
      const msg = ax.response?.data?.message || ax.message || 'Error al iniciar'

      if (status === 403 || ax.response?.data?.code === 'NO_ACTIVE_SUBSCRIPTION') {
        router.push('/premium?blocked=1')
        return
      }
      setError(status ? `[${status}] ${msg}` : msg)
    } finally {
      startingRef.current = false
      setStarting(null)
    }
  }

  if (blocked && !previewMode) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-4 text-6xl">🔒</div>
        <h2 className="mb-3 text-xl font-bold text-white">Acceso restringido</h2>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Necesitas un plan activo para acceder a los simulacros.
        </p>
        <Link href="/premium?blocked=1">
          <Button size="lg">Ver planes</Button>
        </Link>
      </div>
    )
  }

  const mainExam = exams[0] as Exam | undefined
  const simulacroCount = Math.min(selectedCount, totalQuestions)

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {previewMode && (
        <div className="rounded-xl border border-[var(--color-primary)]/50 bg-[var(--color-primary-bg)] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Modo prueba examen</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Prueba simulacros y repasos sin afectar métricas de alumnos ni ranking.
            </p>
          </div>
          <Link
            href={backHref}
            className="text-xs font-semibold text-[var(--color-text-accent)] hover:underline shrink-0"
          >
            ← Volver al panel
          </Link>
        </div>
      )}

      {previewMode && (
        <TrackSwitchBar
          activeTrackType={previewTrack}
          onChange={(track) => {
            setPreviewTrack(track)
            const valid = hierarchiesForTrack(track).map((h) => h.value)
            setPreviewHierarchy((prev) =>
              valid.includes(prev) ? prev : defaultHierarchyForTrack(track)
            )
          }}
          hint="Prueba el simulacro como lo verían alumnos Oficiales o Suboficiales. No afecta métricas ni ranking."
        />
      )}

      {previewMode && (
        <HierarchySwitchBar
          activeTrackType={previewTrack}
          activeHierarchy={previewHierarchy}
          onChange={setPreviewHierarchy}
          hint="Elige la jerarquía exacta que quieres probar (Subalternos, Superiores, etc.)."
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="hidden sm:block">
          <h1 className="text-xl font-extrabold text-[var(--color-text-primary)] md:text-2xl">
            {previewMode ? 'Modo prueba examen' : 'Centro de Exámenes'}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            {previewMode
              ? 'Simulacro general y repaso por categoría — igual que lo ven tus alumnos'
              : 'Elige tu modalidad de práctica'}
          </p>
        </div>
        <Badge color="green" className="gap-1.5 px-3.5 py-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          {totalQuestions} preguntas · {trackLabel(previewMode ? previewTrack : studentTrackKey)}
          {previewMode ? ` · ${hierarchyLabel(previewHierarchy)}` : user?.promotionGrade ? ` · ${hierarchyLabel(categoryHierarchy)}` : ''}
        </Badge>
      </div>

      {error && (
        <div
          className="rounded-lg border border-[#C0392B]/40 bg-[#C0392B]/10 px-4 py-3 text-sm text-[#e74c3c]"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-[var(--color-text-muted)]">Cargando...</p>
      ) : !mainExam?.id ? (
        <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)] py-16 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No hay examen activo en la base de datos.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-5 rounded-[14px] border border-[var(--color-primary)] bg-[var(--color-surface-card)] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-bg)]">
                <ShieldCheck className="h-7 w-7 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-[17px] font-bold text-[var(--color-text-primary)]">Simulacro General</h2>
              <p className="text-[13px] text-[var(--color-text-muted)]">
                Examen completo con todas las categorías del balotario oficial
              </p>
              <div className="mt-1 flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  {simulacroCount} preguntas
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  {DURATIONS[selectedCount]}
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  Nota mín. {mainExam.passingScore || 65} pts
                </span>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 text-[12px] font-semibold text-[var(--color-text-secondary)]">
                  ¿Cuántas preguntas quieres practicar?
                </p>
                <div className="flex gap-2">
                  {([25, 50, 100] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSelectedCount(n)}
                      className={cn(
                        'rounded-lg border px-4 py-2 text-sm font-bold transition-all',
                        selectedCount === n
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                          : 'border-[var(--color-surface-border)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-primary)]'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {!countsLoading && totalQuestions === 0 && (
                  <p className="mt-2 text-[11px] font-semibold text-[var(--color-warning)]">
                    ⚠ No hay preguntas para tu balotario ({trackLabel(studentTrackKey)}). Contacta a tu administrador.
                  </p>
                )}
              </div>
            </div>
            <Button
              size="lg"
              className="shrink-0 px-7 font-bold"
              loading={starting === 'completo'}
              disabled={!!starting || simulacroCount === 0}
              onClick={() => startExam(mainExam.id, 'completo', { mode: 'simulacro', questionCount: selectedCount })}
            >
              Iniciar Simulacro →
            </Button>
          </div>

          {categories.length > 0 && (
            <>
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                Repaso por categoría
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => {
                  const count = questionCounts[cat.name] || 0
                  const progress = count > 0 ? Math.min(100, (count / totalQuestions) * 100 * 3) : 0
                  return (
                    <div
                      key={cat.id}
                      className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)] p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
                    >
                      <div className="mb-2 text-2xl">{categoryIcon(cat.name)}</div>
                      <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">{cat.name}</div>
                      <div className="mb-2 text-[11px] text-[var(--color-text-muted)]">
                        {count === 0
                          ? 'Sin preguntas'
                          : count > 100
                            ? `${count} preguntas · repaso de 100`
                            : `${count} preguntas`}
                      </div>
                      <ProgressBar
                        value={progress}
                        max={100}
                        color="green"
                        size="sm"
                        animated={false}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        className="mt-3"
                        loading={starting === cat.name}
                        disabled={!!starting || count === 0}
                        onClick={() =>
                          startExam(mainExam.id, cat.name, {
                            mode: 'categoria',
                            category: cat.name,
                          })
                        }
                      >
                        Repasar
                      </Button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

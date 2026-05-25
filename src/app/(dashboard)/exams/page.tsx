'use client'

import { useCallback, useEffect, useState } from 'react'
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
import apiClient from '@/lib/api/client'
import { examsApi } from '@/lib/api/exams'
import { saveExamSessionMeta } from '@/lib/examSession'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui'

const SIMULACRO_SIZE = 100

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

interface Category {
  id: string
  name: string
  color: string
}

export default function ExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({})
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [examsRes, catsRes, countsRes] = await Promise.all([
        apiClient.get('/exams/list'),
        apiClient.get('/categories'),
        examsApi.getQuestionCounts(),
      ])

      const examsData = (Array.isArray(examsRes.data) ? examsRes.data : []).map(
        (e: Exam & { Id?: string }) => ({
          ...e,
          id: e.id || (e as { Id?: string }).Id || '',
        })
      )
      const catsData = Array.isArray(catsRes.data) ? catsRes.data : []
      const byCategory = countsRes.data?.byCategory || []
      const total = countsRes.data?.total ?? 0

      const counts: Record<string, number> = {}
      byCategory.forEach((row: { category: string; count: number }) => {
        counts[row.category] = row.count
      })

      setExams(examsData)
      setCategories(catsData)
      setTotalQuestions(total)
      setQuestionCounts(counts)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setBlocked(true)
      } else {
        setError(getApiErrorMessage(err, 'Error al cargar simulacros'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const startExam = async (
    examId: string,
    label: string,
    options?: { mode?: string; category?: string }
  ) => {
    if (!examId) {
      setError('No hay examen configurado en el servidor.')
      return
    }
    setStarting(label)
    setError(null)
    try {
      const res = await examsApi.start(examId, options)
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
      setStarting(null)
    }
  }

  if (blocked) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-4 text-6xl">🔒</div>
        <h2 className="mb-3 text-xl font-bold text-white">Acceso restringido</h2>
        <p className="mb-6 text-sm text-[#6B8A75]">
          Necesitas un plan activo para acceder a los simulacros.
        </p>
        <Link href="/premium?blocked=1">
          <Button size="lg">Ver planes</Button>
        </Link>
      </div>
    )
  }

  const mainExam = exams[0]
  const simulacroCount = Math.min(SIMULACRO_SIZE, totalQuestions)
  const minutes = Math.floor((mainExam?.timeLimitSeconds || 3600) / 60)

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white md:text-2xl">
            Centro de Exámenes
          </h1>
          <p className="mt-1 text-[13px] text-[#6B8A75]">
            Elige tu modalidad de práctica
          </p>
        </div>
        <Badge color="green" className="gap-1.5 px-3.5 py-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          {totalQuestions} preguntas disponibles
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
        <p className="py-12 text-center text-[#6B8A75]">Cargando...</p>
      ) : !mainExam?.id ? (
        <div className="rounded-xl border border-[rgba(189,255,223,0.12)] bg-[#0D1A10] py-16 text-center">
          <p className="text-sm text-[#6B8A75]">No hay examen activo en la base de datos.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-5 rounded-[14px] border border-[#318F48] bg-[#0D1A10] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-[#318F48]/20">
                <ShieldCheck className="h-7 w-7 text-[#318F48]" />
              </div>
              <h2 className="text-[17px] font-bold text-white">Simulacro General</h2>
              <p className="text-[13px] text-[#6B8A75]">
                Examen completo con todas las categorías del balotario oficial
              </p>
              <div className="mt-1 flex flex-wrap gap-4 text-xs text-[#A8BFB0]">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#318F48]" />
                  {simulacroCount} preguntas
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#318F48]" />
                  {minutes} minutos
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-[#318F48]" />
                  Nota mín. {mainExam.passingScore || 65} pts
                </span>
              </div>
            </div>
            <Button
              size="lg"
              className="shrink-0 px-7 font-bold"
              loading={starting === 'completo'}
              disabled={!!starting || simulacroCount === 0}
              onClick={() => startExam(mainExam.id, 'completo', { mode: 'simulacro' })}
            >
              Iniciar Simulacro →
            </Button>
          </div>

          {categories.length > 0 && (
            <>
              <p className="text-[13px] font-semibold text-[#A8BFB0]">
                Repaso por categoría
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => {
                  const count = questionCounts[cat.name] || 0
                  const progress = count > 0 ? Math.min(100, (count / totalQuestions) * 100 * 3) : 0
                  return (
                    <div
                      key={cat.id}
                      className="rounded-xl border border-[rgba(189,255,223,0.12)] bg-[#0D1A10] p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#318F48]"
                    >
                      <div className="mb-2 text-2xl">{categoryIcon(cat.name)}</div>
                      <div className="text-[13px] font-semibold text-white">{cat.name}</div>
                      <div className="mb-2 text-[11px] text-[#6B8A75]">
                        {count === 0 ? 'Sin preguntas' : `${count} preguntas`}
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

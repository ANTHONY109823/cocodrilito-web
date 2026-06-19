'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { examsApi } from '@/lib/api/exams'
import apiClient from '@/lib/api/client'
import {
  getEffectiveQuestionCount,
  loadExamSessionCache,
  loadExamSessionMeta,
  normalizeExamSessionPayload,
  saveExamSessionCache,
} from '@/lib/examSession'

import {
  NEON,
  POLICE_GREEN_DARK,
  RED_BRIGHT as RED,
  GOLD_BRIGHT as GOLD,
  primaryMix,
  SURFACE,
} from '@/lib/constants/theme'
import { Modal, Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

const ORANGE = '#FF8A3D'

interface AnswerOption {
  id: string
  optionText: string
  optionIndex: number
}

interface Question {
  id: string
  questionText: string
  orderIndex: number
  category: string
  options: AnswerOption[]
}

interface SessionData {
  sessionId: string
  examTitle: string
  practiceCategory: string | null
  totalQuestions: number
  timeLimitSeconds: number
  questions: Question[]
}

export default function ExamPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | null>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [questionTime, setQuestionTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const pendingAnswersRef = useRef<Array<{
    questionId: string
    selectedOptionId: string | null
    timeSpentMs: number
  }>>([])
  const flushInFlightRef = useRef(false)

  const flushAnswers = useCallback(async () => {
    if (flushInFlightRef.current) return
    const batch = pendingAnswersRef.current.splice(0)
    if (batch.length === 0) return
    flushInFlightRef.current = true
    try {
      await examsApi.submitAnswersBatch(sessionId, { answers: batch })
    } catch {
      pendingAnswersRef.current.unshift(...batch)
    } finally {
      flushInFlightRef.current = false
      if (pendingAnswersRef.current.length > 0) {
        await flushAnswers()
      }
    }
  }, [sessionId])

  const queueAnswer = useCallback((answer: {
    questionId: string
    selectedOptionId: string | null
    timeSpentMs: number
  }) => {
    pendingAnswersRef.current.push(answer)
    window.setTimeout(() => { void flushAnswers() }, 1200)
  }, [flushAnswers])

  const handleFinish = useCallback(async () => {
    if (finishing) return
    setFinishing(true)
    await flushAnswers()
    // Race API call vs 8s timeout — redirect regardless so user never waits minutes
    await Promise.race([
      examsApi.finish(sessionId).catch(() => {}),
      new Promise<void>((resolve) => setTimeout(resolve, 8000)),
    ])
    router.push(`/result/${sessionId}`)
  }, [finishing, sessionId, router, flushAnswers])

  const applySessionPayload = useCallback((data: Record<string, unknown>, fallbackId: string) => {
    const meta = normalizeExamSessionPayload(data)
    const cached = loadExamSessionMeta(fallbackId)
    const practiceCategory = meta.practiceCategory ?? cached?.practiceCategory ?? null
    const questionList = ((data.questions || data.Questions) as Array<{
      id: string
      questionText: string
      orderIndex: number
      categoryName?: string
      category?: string
      options?: AnswerOption[]
      answerOptions?: AnswerOption[]
    }> | undefined)?.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      orderIndex: q.orderIndex,
      category: q.categoryName || q.category || '',
      options: (q.options || q.answerOptions || []).map((o: AnswerOption) => ({
        id: o.id,
        optionText: o.optionText,
        optionIndex: o.optionIndex,
      })),
    })) ?? []

    const totalQuestions =
      meta.totalQuestions > 0
        ? meta.totalQuestions
        : cached?.totalQuestions ?? questionList.length

    const examTitle =
      practiceCategory ??
      (meta.examTitle || cached?.examTitle || 'Simulacro')

    setSession({
      sessionId: (data.sessionId as string | undefined) ?? (data.SessionId as string | undefined) ?? fallbackId,
      examTitle,
      practiceCategory,
      totalQuestions,
      timeLimitSeconds: (data.timeLimitSeconds as number | undefined) ?? (data.TimeLimitSeconds as number | undefined) ?? 3600,
      questions: questionList,
    })

    const startedAt = new Date(
      (data.startedAt as string | undefined) ?? (data.StartedAt as string | undefined) ?? Date.now()
    ).getTime()
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    const limit = (data.timeLimitSeconds as number | undefined) ?? (data.TimeLimitSeconds as number | undefined) ?? 3600
    setTimeLeft(Math.max(0, limit - elapsed))
  }, [])

  const loadSession = useCallback(async () => {
    const cached = loadExamSessionCache(sessionId)
    if (cached?.questions.length) {
      applySessionPayload(cached as unknown as Record<string, unknown>, sessionId)
      setLoading(false)
    }

    try {
      const res = await apiClient.get(`/exams/sessions/${sessionId}`)
      const data = res.data as Record<string, unknown>
      const status = (data.status as string | undefined) ?? (data.Status as string | undefined)

      if (status === 'Completed') {
        router.replace(`/result/${sessionId}`)
        return
      }

      applySessionPayload(data, sessionId)
      saveExamSessionCache(sessionId, data)
    } catch {
      if (!cached?.questions.length) {
        router.push('/exams')
      }
    } finally {
      setLoading(false)
    }
  }, [sessionId, router, applySessionPayload])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  useEffect(() => {
    if (!session) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { void handleFinish(); return 0 }
        return prev - 1
      })
      setQuestionTime(prev => prev + 1000)
    }, 1000)
    return () => clearInterval(t)
  }, [session, handleFinish])

  const handleAnswer = (optionId: string) => {
    if (!session) return
    const q = session.questions[currentIdx]
    if (!q) return

    const spentMs = questionTime
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }))

    void queueAnswer({
      questionId: q.id,
      selectedOptionId: optionId,
      timeSpentMs: spentMs,
    })
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const timerColor = timeLeft < 60 ? RED : timeLeft < 300 ? GOLD : NEON
  const total = session?.totalQuestions || 1
  const progress = session ? ((currentIdx + 1) / total) * 100 : 0

  const { categoryQuestions, positionInCategory, sortedOptions, currentQ } = useMemo(() => {
    if (!session) {
      return {
        categoryQuestions: [] as SessionData['questions'],
        positionInCategory: 0,
        sortedOptions: [] as AnswerOption[],
        currentQ: null as SessionData['questions'][number] | null,
      }
    }
    const q = session.questions[currentIdx]
    const cat = q?.category || ''
    const catQs = cat ? session.questions.filter((item) => item.category === cat) : []
    const pos = cat
      ? session.questions.slice(0, currentIdx + 1).filter((item) => item.category === cat).length
      : 0
    const opts = q
      ? [...q.options].sort((a, b) => a.optionIndex - b.optionIndex).slice(0, 4)
      : []
    return { categoryQuestions: catQs, positionInCategory: pos, sortedOptions: opts, currentQ: q ?? null }
  }, [session, currentIdx])

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🐊</div>
          <p className="text-gray-400">Cargando simulacro...</p>
        </div>
      </div>
    )
  }

  const effectiveTotal = getEffectiveQuestionCount(
    session.totalQuestions,
    session.questions.length
  )
  const answeredCount = Object.keys(answers).length
  const unansweredCount = Math.max(0, effectiveTotal - answeredCount)
  const allAnswered = answeredCount >= effectiveTotal
  const isLast = currentIdx === effectiveTotal - 1

  const goPrev = () => {
    setCurrentIdx((prev) => prev - 1)
    setQuestionTime(0)
  }
  const goNext = () => {
    setCurrentIdx((prev) => prev + 1)
    setQuestionTime(0)
  }

  const currentAnswer = currentQ ? answers[currentQ.id] ?? null : null

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(255,82,82,0.4)} 50%{box-shadow:0 0 0 8px rgba(255,82,82,0)} }
        .pulse-red { animation: pulse-red 1s infinite; }
        .exam-option-row-selected {
          background-color: #D1FAE5 !important;
          border-color: #059669 !important;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.18);
        }
        [data-theme='dark'] .exam-option-row-selected {
          background-color: rgba(5, 150, 105, 0.22) !important;
          border-color: #34D399 !important;
        }
        .exam-option-badge-selected {
          background-color: #059669 !important;
          color: #FFFFFF !important;
          border-color: #047857 !important;
        }
        .exam-option-text {
          color: var(--color-text-primary) !important;
        }
      `}</style>

      {/* HEADER */}
      <div className="rounded-2xl p-4 mb-4 flex items-center justify-between"
        style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)' }}>
        <div>
          <div className="text-[var(--color-text-primary)] font-bold text-sm">{session.examTitle}</div>
          {currentQ?.category ? (
            <div className="text-xs mt-0.5 text-[var(--color-text-accent)] font-medium">
              {currentQ.category}
              <span className="text-[var(--color-text-muted)] font-normal">
                {' '}· Pregunta {positionInCategory} de {categoryQuestions.length} en esta categoría
              </span>
            </div>
          ) : null}
          <div className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Pregunta {currentIdx + 1} de {effectiveTotal}
          </div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold tabular-nums ${timeLeft < 60 ? 'pulse-red' : ''}`}
            style={{ color: timerColor, textShadow: `0 0 15px ${timerColor}` }}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">tiempo restante</div>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="w-full h-1.5 rounded-full mb-4" style={{ backgroundColor: 'var(--color-primary-bg)' }}>
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${primaryMix(60)}, ${NEON})` }} />
      </div>

      {/* PREGUNTA */}
      <div className="rounded-2xl p-5 mb-4 fade-in" key={currentIdx}
        style={{ background: 'var(--color-surface-elevated)', border: `1px solid ${primaryMix(15)}` }}>
        <div className="text-xs text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">
          Pregunta {currentIdx + 1}
        </div>
        <p className="text-[var(--color-text-primary)] text-base sm:text-lg font-semibold leading-relaxed mb-6">
          {currentQ?.questionText}
        </p>

        <div className="space-y-3">
        {sortedOptions.map((opt, i) => {
              const isSelected = currentAnswer === opt.id
              const letters = ['A', 'B', 'C', 'D']
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAnswer(opt.id)}
                  className={cn(
                    'w-full text-left rounded-xl p-4 transition-all duration-200 flex items-start gap-3 border-2',
                    isSelected
                      ? 'exam-option-row-selected scale-[1.01]'
                      : 'bg-[var(--color-input-bg)] border-[var(--color-surface-border)] hover:border-emerald-400/80'
                  )}
                >
                  <span
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border',
                      isSelected
                        ? 'exam-option-badge-selected'
                        : 'bg-white text-[#0A0A0A] border-[var(--color-surface-border)] dark:bg-[var(--color-surface-elevated)] dark:text-[var(--color-text-primary)]'
                    )}
                  >
                    {letters[i]}
                  </span>
                  <span className="exam-option-text text-sm sm:text-base leading-relaxed pt-0.5 font-medium">
                    {opt.optionText}
                  </span>
                </button>
              )
            })}
        </div>
      </div>

      {/* FOOTER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: currentIdx === 0 ? SURFACE : 'var(--color-surface-elevated)',
              color: currentIdx === 0 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-surface-border)',
              cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
            }}>
            ← Anterior
          </button>
          <div className="text-xs text-[var(--color-text-muted)]">
            {answeredCount} de {effectiveTotal} respondidas
          </div>
          {isLast ? (
            allAnswered ? (
              <button type="button" onClick={() => setShowFinishModal(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${NEON}, ${POLICE_GREEN_DARK})`, color: '#fff', boxShadow: `0 0 20px ${primaryMix(40)}` }}>
                Ver resultado →
              </button>
            ) : (
              <span className="px-5 py-2.5 text-xs text-[var(--color-text-muted)]">Última pregunta</span>
            )
          ) : (
            <button type="button" onClick={goNext}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', border: '1px solid var(--color-surface-border)' }}>
              Siguiente →
            </button>
          )}
        </div>

        {/* Botón Finalizar: siempre visible, distinto de la navegación */}
        <button
          type="button"
          onClick={() => setShowFinishModal(true)}
          disabled={finishing}
          className="w-full px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: `${ORANGE}1A`, color: ORANGE, border: `1px solid ${ORANGE}55` }}>
          ⏹ Finalizar examen
        </button>
      </div>

      <Modal
        open={showFinishModal}
        onClose={() => { if (!finishing) setShowFinishModal(false) }}
        title={allAnswered ? '✅ Finalizar examen' : '⚠️ Finalizar examen'}
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={finishing} onClick={() => setShowFinishModal(false)}>
              {allAnswered ? 'Revisar respuestas' : 'Seguir respondiendo'}
            </Button>
            <Button variant={allAnswered ? 'primary' : 'danger'} size="sm" loading={finishing} onClick={handleFinish}>
              {allAnswered ? 'Ver resultado' : 'Finalizar'}
            </Button>
          </>
        }
      >
        {allAnswered ? (
          <p>
            Has respondido todas las preguntas ({answeredCount} de {effectiveTotal}). ¿Listo para ver tu
            resultado?
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between"><span>Respondidas:</span><strong className="text-[var(--color-text-primary)]">{answeredCount} de {effectiveTotal}</strong></div>
            <div className="flex justify-between"><span>Sin responder:</span><strong style={{ color: ORANGE }}>{unansweredCount} preguntas</strong></div>
            <p className="pt-2 text-[var(--color-text-muted)]">
              Las preguntas sin responder contarán como incorrectas en tu resultado. ¿Estás seguro de que
              quieres finalizar?
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
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
import { QuizOption } from '@/components/exam/QuizOption'
import { optionLetter } from '@/lib/utils/optionLetter'
import { isBasicoLevel } from '@/lib/constants/examLevels'

const ORANGE = '#FF8A3D'
/** Pausa breve en modo play (todos los niveles) antes del auto-avance. */
const STANDARD_AUTO_ADVANCE_MS = 450

interface AnswerOption {
  id: string
  optionText: string
  optionIndex: number
  /** Solo Básico: viene del API para feedback inmediato. */
  isCorrect?: boolean | null
}

interface Question {
  id: string
  questionText: string
  orderIndex: number
  category: string
  /** Solo Básico: id de la opción correcta para feedback inmediato. */
  correctOptionId?: string | null
  options: AnswerOption[]
}

interface SessionData {
  sessionId: string
  examTitle: string
  practiceCategory: string | null
  difficultyLevel: string
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
  const [finishError, setFinishError] = useState<string | null>(null)
  const [showFinishModal, setShowFinishModal] = useState(false)
  /** Básico: preguntas ya acertadas (bloqueadas). */
  const [lockedQuestions, setLockedQuestions] = useState<Record<string, true>>({})
  /** Básico: última opción incorrecta por pregunta. */
  const [wrongOptions, setWrongOptions] = useState<Record<string, string>>({})
  const [shakeWrong, setShakeWrong] = useState(false)
  const [basicoBusy, setBasicoBusy] = useState(false)
  const [basicoHint, setBasicoHint] = useState<string | null>(null)
  /**
   * Play = auto-avance (Básico tras acertar; Intermedio/Avanzado tras marcar).
   * Pausa = el usuario usa Siguiente.
   */
  const [examAutoplay, setExamAutoplay] = useState(true)
  const pendingAnswersRef = useRef<Array<{
    questionId: string
    selectedOptionId: string | null
    timeSpentMs: number
  }>>([])
  const flushInFlightRef = useRef(false)
  const finishingRef = useRef(false)
  const autoFinishTriggeredRef = useRef(false)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const examAutoplayRef = useRef(examAutoplay)

  useEffect(() => {
    examAutoplayRef.current = examAutoplay
  }, [examAutoplay])

  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
  }, [])

  const scheduleAutoAdvance = useCallback((delayMs: number, lastIndex: number) => {
    clearAutoAdvance()
    if (!examAutoplayRef.current) return
    autoAdvanceRef.current = setTimeout(() => {
      autoAdvanceRef.current = null
      setBasicoHint(null)
      setCurrentIdx((prev) => (prev < lastIndex ? prev + 1 : prev))
      setQuestionTime(0)
    }, delayMs)
  }, [clearAutoAdvance])

  const stopExamTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const goToResult = useCallback(() => {
    // Navegación completa: evita errores removeChild de React al desmontar modal/timer.
    window.location.replace(`/result/${sessionId}`)
  }, [sessionId])

  const waitForFlushSlot = useCallback(async (maxMs = 22_000) => {
    const started = Date.now()
    while (flushInFlightRef.current && Date.now() - started < maxMs) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50))
    }
    if (flushInFlightRef.current) {
      flushInFlightRef.current = false
    }
  }, [])

  const flushAnswers = useCallback(async (opts?: { maxAttempts?: number; throwOnFailure?: boolean }) => {
    const maxAttempts = opts?.maxAttempts ?? 4

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await waitForFlushSlot()

      const batch = pendingAnswersRef.current.splice(0)
      if (batch.length === 0) return

      flushInFlightRef.current = true
      try {
        await examsApi.submitAnswersBatch(sessionId, { answers: batch })
      } catch {
        pendingAnswersRef.current.unshift(...batch)
        if (attempt === maxAttempts - 1) {
          if (opts?.throwOnFailure) {
            throw new Error('No se pudieron guardar las respuestas pendientes.')
          }
          return
        }
        await new Promise<void>((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)))
        continue
      } finally {
        flushInFlightRef.current = false
      }

      if (pendingAnswersRef.current.length > 0) continue
      return
    }
  }, [sessionId, waitForFlushSlot])

  const queueAnswer = useCallback((answer: {
    questionId: string
    selectedOptionId: string | null
    timeSpentMs: number
  }) => {
    pendingAnswersRef.current.push(answer)
    window.setTimeout(() => { void flushAnswers() }, 1200)
  }, [flushAnswers])

  const handleFinish = useCallback(async () => {
    if (finishingRef.current) return
    finishingRef.current = true
    stopExamTimer()
    setFinishing(true)
    setFinishError(null)

    try {
      await flushAnswers({ maxAttempts: 5, throwOnFailure: true })

      const finishRes = await Promise.race([
        examsApi.finish(sessionId),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error('finish_timeout')), 18_000)
        ),
      ])

      try {
        const d = finishRes?.data as Record<string, unknown> | undefined
        if (d && (d.progressPointsEarned != null || d.ProgressPointsEarned != null)) {
          sessionStorage.setItem(
            `progressFlash:${sessionId}`,
            JSON.stringify({
              progressPointsEarned: d.progressPointsEarned ?? d.ProgressPointsEarned,
              progressPointsTotal: d.progressPointsTotal ?? d.ProgressPointsTotal,
              progressRank: d.progressRank ?? d.ProgressRank,
              previousProgressRank: d.previousProgressRank ?? d.PreviousProgressRank,
              progressRankUp: d.progressRankUp ?? d.ProgressRankUp,
            })
          )
        }
      } catch {
        /* ignore */
      }

      goToResult()
    } catch {
      // Si finish tardó o falló, la sesión pudo haberse cerrado igual: ir al resultado.
      try {
        const res = await examsApi.getResult(sessionId)
        const status = (res.data?.status ?? res.data?.Status ?? '').toString().toLowerCase()
        if (status === 'completed' || status === 'timedout') {
          goToResult()
          return
        }
      } catch {
        // ignore
      }

      finishingRef.current = false
      setFinishing(false)
      setFinishError('No se pudo finalizar el examen. Intenta de nuevo.')
    }
  }, [sessionId, flushAnswers, stopExamTimer, goToResult])

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
      correctOptionId?: string | null
      CorrectOptionId?: string | null
      options?: Array<AnswerOption & { isCorrect?: boolean | null; IsCorrect?: boolean | null }>
      answerOptions?: Array<AnswerOption & { isCorrect?: boolean | null; IsCorrect?: boolean | null }>
    }> | undefined)?.map((q) => {
      const options = (q.options || q.answerOptions || []).map((o) => ({
        id: o.id,
        optionText: o.optionText,
        optionIndex: o.optionIndex,
        isCorrect: o.isCorrect ?? o.IsCorrect ?? null,
      }))
      const correctFromOptions = options.find((o) => o.isCorrect === true)?.id ?? null
      return {
        id: q.id,
        questionText: q.questionText,
        orderIndex: q.orderIndex,
        category: q.categoryName || q.category || '',
        correctOptionId: q.correctOptionId ?? q.CorrectOptionId ?? correctFromOptions,
        options,
      }
    }) ?? []

    const totalQuestions =
      meta.totalQuestions > 0
        ? meta.totalQuestions
        : cached?.totalQuestions ?? questionList.length

    const examTitle =
      practiceCategory ??
      (meta.examTitle || cached?.examTitle || 'Simulacro')

    const difficultyLevel =
      (data.difficultyLevel as string | undefined) ??
      (data.DifficultyLevel as string | undefined) ??
      'Intermedio'

    setSession({
      sessionId: (data.sessionId as string | undefined) ?? (data.SessionId as string | undefined) ?? fallbackId,
      examTitle,
      practiceCategory,
      difficultyLevel,
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

      const normalizedStatus = (status ?? '').toString().toLowerCase()
      if (normalizedStatus === 'completed' || normalizedStatus === 'timedout') {
        window.location.replace(`/result/${sessionId}`)
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
    return () => {
      stopExamTimer()
      clearAutoAdvance()
    }
  }, [loadSession, stopExamTimer, clearAutoAdvance])

  useEffect(() => {
    if (!examAutoplay) clearAutoAdvance()
  }, [examAutoplay, clearAutoAdvance])

  useEffect(() => {
    if (!session || finishingRef.current) return
    stopExamTimer()
    timerIntervalRef.current = setInterval(() => {
      if (finishingRef.current) return

      setTimeLeft((prev) => {
        if (prev <= 0) return 0
        if (prev === 1) {
          if (!autoFinishTriggeredRef.current) {
            autoFinishTriggeredRef.current = true
            void handleFinish()
          }
          return 0
        }
        return prev - 1
      })

      if (!finishingRef.current) {
        setQuestionTime((prev) => prev + 1000)
      }
    }, 1000)
    return () => stopExamTimer()
  }, [session, handleFinish, stopExamTimer])

  const isBasico = isBasicoLevel(session?.difficultyLevel)

  const handleAnswer = (optionId: string) => {
    if (!session) return
    const q = session.questions[currentIdx]
    if (!q) return

    if (isBasico) {
      if (lockedQuestions[q.id] || basicoBusy) return
      void handleBasicoAnswer(q, optionId)
      return
    }

    const spentMs = questionTime
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }))

    void queueAnswer({
      questionId: q.id,
      selectedOptionId: optionId,
      timeSpentMs: spentMs,
    })

    const lastIndex = (session.totalQuestions || session.questions.length) - 1
    if (currentIdx < lastIndex) {
      scheduleAutoAdvance(STANDARD_AUTO_ADVANCE_MS, lastIndex)
    } else {
      clearAutoAdvance()
    }
  }

  const applyBasicoFeedback = (
    questionId: string,
    optionId: string,
    correct: boolean,
    explanation?: string | null
  ) => {
    // Un solo lote de estado: evita frame intermedio en verde (selected).
    if (correct) {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
      setLockedQuestions((prev) => ({ ...prev, [questionId]: true }))
      setWrongOptions((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
      setBasicoHint(explanation?.trim() ? explanation : null)
      if (!session) return
      const lastIndex = (session.totalQuestions || session.questions.length) - 1
      scheduleAutoAdvance(STANDARD_AUTO_ADVANCE_MS, lastIndex)
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
      setWrongOptions((prev) => ({ ...prev, [questionId]: optionId }))
      setShakeWrong(true)
      window.setTimeout(() => setShakeWrong(false), 450)
    }
  }

  const resolveBasicoCorrect = (question: Question, optionId: string): boolean | null => {
    const opt = question.options.find((o) => o.id.toLowerCase() === optionId.toLowerCase())
    if (typeof opt?.isCorrect === 'boolean') return opt.isCorrect
    if (question.correctOptionId) {
      return optionId.toLowerCase() === question.correctOptionId.toLowerCase()
    }
    return null
  }

  const handleBasicoAnswer = async (question: Question, optionId: string) => {
    if (!session) return
    setBasicoHint(null)
    const spentMs = questionTime
    const knownCorrect = resolveBasicoCorrect(question, optionId)

    // Feedback inmediato (rojo/verde) sin esperar red.
    if (knownCorrect !== null) {
      applyBasicoFeedback(question.id, optionId, knownCorrect)
      void examsApi
        .submitAnswer(sessionId, {
          questionId: question.id,
          selectedOptionId: optionId,
          timeSpentMs: spentMs,
        })
        .then((res) => {
          if (!knownCorrect) return
          const data = res.data as {
            explanation?: string | null
            Explanation?: string | null
          }
          const explanation = data.explanation ?? data.Explanation
          if (explanation?.trim()) setBasicoHint(explanation)
        })
        .catch(() => {
          if (!knownCorrect) setBasicoHint('No se pudo guardar. Intenta otra vez.')
        })
      return
    }

    // Fallback sesión antigua: no pintar verde mientras valida — solo rojo/verde al final.
    setBasicoBusy(true)
    try {
      const res = await examsApi.submitAnswer(sessionId, {
        questionId: question.id,
        selectedOptionId: optionId,
        timeSpentMs: spentMs,
      })
      const data = res.data as {
        isCorrect?: boolean
        IsCorrect?: boolean
        locked?: boolean
        Locked?: boolean
        explanation?: string | null
        Explanation?: string | null
      }
      const correct = Boolean(data.isCorrect ?? data.IsCorrect)
      applyBasicoFeedback(
        question.id,
        optionId,
        correct,
        data.explanation ?? data.Explanation
      )
      if (Boolean(data.locked ?? data.Locked) && !correct) {
        setLockedQuestions((prev) => ({ ...prev, [question.id]: true }))
      }
    } catch {
      setBasicoHint('No se pudo validar. Intenta otra vez.')
    } finally {
      setBasicoBusy(false)
    }
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
      ? [...q.options].sort((a, b) => a.optionIndex - b.optionIndex)
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

  if (finishing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🐊</div>
          <p className="text-gray-400">Guardando tu resultado...</p>
        </div>
      </div>
    )
  }

  const effectiveTotal = getEffectiveQuestionCount(
    session.totalQuestions,
    session.questions.length
  )
  const answeredCount = isBasico
    ? Object.keys(lockedQuestions).length
    : Object.keys(answers).length
  const unansweredCount = Math.max(0, effectiveTotal - answeredCount)
  const allAnswered = answeredCount >= effectiveTotal
  const isLast = currentIdx === effectiveTotal - 1
  const currentLocked = currentQ ? Boolean(lockedQuestions[currentQ.id]) : false
  const canGoNext = !isBasico || currentLocked

  const goPrev = () => {
    clearAutoAdvance()
    setBasicoHint(null)
    setCurrentIdx((prev) => prev - 1)
    setQuestionTime(0)
  }
  const goNext = () => {
    if (!canGoNext) return
    clearAutoAdvance()
    setBasicoHint(null)
    setCurrentIdx((prev) => prev + 1)
    setQuestionTime(0)
  }

  const toggleExamAutoplay = () => {
    setExamAutoplay((prev) => {
      if (prev) clearAutoAdvance()
      return !prev
    })
  }

  const autoplayTitle = isBasico
    ? examAutoplay
      ? 'Auto-avance tras acertar (play)'
      : 'Auto-avance en pausa — usa Siguiente al acertar'
    : examAutoplay
      ? 'Auto-avance al marcar respuesta (play)'
      : 'Auto-avance en pausa — usa Siguiente'

  const currentAnswer = currentQ ? answers[currentQ.id] ?? null : null
  const currentWrong = currentQ ? wrongOptions[currentQ.id] : undefined

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(255,82,82,0.4)} 50%{box-shadow:0 0 0 8px rgba(255,82,82,0)} }
        .pulse-red { animation: pulse-red 1s infinite; }
        @keyframes pollitoShake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .pollito-shake { animation: pollitoShake 0.4s ease; }
      `}</style>

      {/* HEADER */}
      <div className="rounded-2xl p-4 mb-4 flex items-center justify-between gap-3"
        style={{ background: 'var(--color-surface-elevated)', border: '1px solid var(--color-surface-border)' }}>
        <div className="min-w-0">
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
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleExamAutoplay}
            title={autoplayTitle}
            aria-label={examAutoplay ? 'Pausar auto-avance' : 'Activar auto-avance'}
            aria-pressed={examAutoplay}
            className="flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all hover:opacity-90"
            style={{
              background: examAutoplay ? primaryMix(18) : 'var(--color-surface)',
              border: `1px solid ${examAutoplay ? primaryMix(45) : 'var(--color-surface-border)'}`,
              color: examAutoplay ? NEON : 'var(--color-text-muted)',
            }}
          >
            <span className="text-lg leading-none" aria-hidden>
              {examAutoplay ? '⏸' : '▶'}
            </span>
          </button>
          <div className="text-center">
            <div
              className={`text-2xl font-bold tabular-nums ${timeLeft < 60 ? 'pulse-red' : ''}`}
              style={{ color: timerColor, textShadow: `0 0 15px ${timerColor}` }}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">tiempo restante</div>
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="w-full h-1.5 rounded-full mb-4" style={{ backgroundColor: 'var(--color-primary-bg)' }}>
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${primaryMix(60)}, ${NEON})` }} />
      </div>

      {/* PREGUNTA */}
      <div
        className={`rounded-2xl p-5 mb-4 fade-in ${shakeWrong ? 'pollito-shake' : ''}`}
        key={currentIdx}
        style={{ background: 'var(--color-surface-elevated)', border: `1px solid ${primaryMix(15)}` }}
      >
        <div className="text-xs text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">
          Pregunta {currentIdx + 1}
        </div>
        <p className="text-[var(--color-text-primary)] text-base sm:text-lg font-semibold leading-relaxed mb-6">
          {currentQ?.questionText}
        </p>

        <div className="space-y-3">
        {sortedOptions.map((opt, i) => {
              let variant: 'neutral' | 'selected' | 'correct' | 'wrong' = 'neutral'
              if (isBasico) {
                // En Básico nunca usar "selected" (verde): solo correct / wrong.
                if (currentLocked && currentAnswer === opt.id) variant = 'correct'
                else if (currentWrong === opt.id) variant = 'wrong'
              } else if (currentAnswer === opt.id) {
                variant = 'selected'
              }
              return (
              <QuizOption
                key={opt.id}
                letter={optionLetter(i)}
                text={opt.optionText}
                variant={variant}
                tag={null}
                onClick={isBasico && currentLocked ? undefined : () => handleAnswer(opt.id)}
              />
              )
            })}
        </div>
        {isBasico && basicoHint ? (
          <p
            className="mt-4 text-sm font-medium"
            style={{ color: currentLocked ? NEON : RED }}
          >
            {basicoHint}
          </p>
        ) : null}
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
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                color: canGoNext ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: '1px solid var(--color-surface-border)',
                cursor: canGoNext ? 'pointer' : 'not-allowed',
                opacity: canGoNext ? 1 : 0.55,
              }}
            >
              {isBasico && !canGoNext ? 'Acierta para continuar' : 'Siguiente →'}
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
        {finishError ? (
          <p className="text-sm" style={{ color: RED }}>{finishError}</p>
        ) : null}
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
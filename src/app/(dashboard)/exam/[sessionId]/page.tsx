'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { examsApi } from '@/lib/api/exams'
import apiClient from '@/lib/api/client'
import {
  getEffectiveQuestionCount,
  loadExamSessionMeta,
  normalizeExamSessionPayload,
} from '@/lib/examSession'

import { NEON } from '@/lib/constants/theme'
import { Modal, Button } from '@/components/ui'
const RED = '#FF5252'
const GOLD = '#FFD700'
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const answeringRef = useRef(false)

  const handleFinish = useCallback(async () => {
    if (finishing) return
    setFinishing(true)
    // Race API call vs 8s timeout — redirect regardless so user never waits minutes
    await Promise.race([
      examsApi.finish(sessionId).catch(() => {}),
      new Promise<void>((resolve) => setTimeout(resolve, 8000)),
    ])
    router.push(`/result/${sessionId}`)
  }, [finishing, sessionId, router])

  const loadSession = useCallback(async () => {
    const [resultOutcome, sessionOutcome] = await Promise.allSettled([
      examsApi.getResult(sessionId),
      apiClient.get(`/exams/sessions/${sessionId}`),
    ])

    if (resultOutcome.status === 'fulfilled' && resultOutcome.value.data?.status === 'Completed') {
      router.replace(`/result/${sessionId}`)
      return
    }

    if (sessionOutcome.status !== 'fulfilled') {
      router.push('/exams')
      setLoading(false)
      return
    }

    try {
      const res = sessionOutcome.value
      const data = res.data
      const meta = normalizeExamSessionPayload(data)
      const cached = loadExamSessionMeta(sessionId)

      const practiceCategory = meta.practiceCategory ?? cached?.practiceCategory ?? null
      const questionList = (data.questions || data.Questions || []).map((q: {
        id: string
        questionText: string
        orderIndex: number
        categoryName?: string
        category?: string
        options?: AnswerOption[]
        answerOptions?: AnswerOption[]
      }) => ({
        id: q.id,
        questionText: q.questionText,
        orderIndex: q.orderIndex,
        category: q.categoryName || q.category || '',
        options: (q.options || q.answerOptions || []).map((o: AnswerOption) => ({
          id: o.id,
          optionText: o.optionText,
          optionIndex: o.optionIndex,
        })),
      }))

      const totalQuestions =
        meta.totalQuestions > 0
          ? meta.totalQuestions
          : cached?.totalQuestions ?? questionList.length

      const examTitle =
        practiceCategory ??
        (meta.examTitle || cached?.examTitle || 'Simulacro')

      setSession({
        sessionId: data.sessionId ?? data.SessionId ?? sessionId,
        examTitle,
        practiceCategory,
        totalQuestions,
        timeLimitSeconds: data.timeLimitSeconds ?? data.TimeLimitSeconds ?? 3600,
        questions: questionList,
      })
      const startedAt = new Date(data.startedAt ?? data.StartedAt).getTime()
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const limit = data.timeLimitSeconds ?? data.TimeLimitSeconds ?? 3600
      const remaining = Math.max(0, limit - elapsed)
      setTimeLeft(remaining)
    } catch {
      router.push('/exams')
    } finally {
      setLoading(false)
    }
  }, [sessionId, router])

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
    if (!session || answeringRef.current || selectedOption) return
    answeringRef.current = true

    const q = session.questions[currentIdx]
    const spentMs = questionTime
    setSelectedOption(optionId)
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }))

    void examsApi.submitAnswer(sessionId, {
      questionId: q.id,
      selectedOptionId: optionId,
      timeSpentMs: spentMs,
    }).catch(() => {})

    const total = getEffectiveQuestionCount(session.totalQuestions, session.questions.length)
    const isLast = currentIdx >= total - 1

    window.setTimeout(() => {
      if (!isLast) {
        setCurrentIdx((prev) => prev + 1)
        setQuestionTime(0)
      }
      setSelectedOption(null)
      answeringRef.current = false
    }, 220)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const timerColor = timeLeft < 60 ? RED : timeLeft < 300 ? GOLD : NEON
  const total = session?.totalQuestions || 1
  const progress = session ? ((currentIdx + 1) / total) * 100 : 0

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
  const currentQ = session.questions[currentIdx]
  const answeredCount = Object.keys(answers).length
  const unansweredCount = Math.max(0, effectiveTotal - answeredCount)
  const allAnswered = answeredCount >= effectiveTotal
  const isLast = currentIdx === effectiveTotal - 1

  // Indicador de categoría: posición de la pregunta actual dentro de su categoría.
  const currentCategory = currentQ?.category || ''
  const categoryQuestions = currentCategory
    ? session.questions.filter((q) => q.category === currentCategory)
    : []
  const positionInCategory = currentCategory
    ? session.questions.slice(0, currentIdx + 1).filter((q) => q.category === currentCategory).length
    : 0

  const goPrev = () => {
    setCurrentIdx((prev) => prev - 1)
    setSelectedOption(answers[session.questions[currentIdx - 1]?.id] || null)
    setQuestionTime(0)
  }
  const goNext = () => {
    setCurrentIdx((prev) => prev + 1)
    setSelectedOption(answers[session.questions[currentIdx + 1]?.id] || null)
    setQuestionTime(0)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(255,82,82,0.4)} 50%{box-shadow:0 0 0 8px rgba(255,82,82,0)} }
        .pulse-red { animation: pulse-red 1s infinite; }
      `}</style>

      {/* HEADER */}
      <div className="rounded-2xl p-4 mb-4 flex items-center justify-between"
        style={{ background: 'rgba(0,8,4,0.9)', border: '1px solid #ffffff08' }}>
        <div>
          <div className="text-white font-bold text-sm">{session.examTitle}</div>
          {currentCategory ? (
            <div className="text-xs mt-0.5" style={{ color: NEON }}>
              {currentCategory}
              <span className="text-gray-500">
                {' '}· Pregunta {positionInCategory} de {categoryQuestions.length} en esta categoría
              </span>
            </div>
          ) : null}
          <div className="text-gray-500 text-xs mt-0.5">
            Pregunta {currentIdx + 1} de {effectiveTotal}
          </div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold tabular-nums ${timeLeft < 60 ? 'pulse-red' : ''}`}
            style={{ color: timerColor, textShadow: `0 0 15px ${timerColor}` }}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-gray-600">tiempo restante</div>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="w-full h-1.5 rounded-full mb-4" style={{ backgroundColor: '#ffffff08' }}>
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${NEON}60, ${NEON})` }} />
      </div>

      {/* PREGUNTA */}
      <div className="rounded-2xl p-5 mb-4 fade-in" key={currentIdx}
        style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${NEON}15` }}>
        <div className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          Pregunta {currentIdx + 1}
        </div>
        <p className="text-white text-base font-medium leading-relaxed mb-6">
          {currentQ.questionText}
        </p>

        <div className="space-y-3">
        {currentQ.options
  .sort((a, b) => a.optionIndex - b.optionIndex)
  .slice(0, 4)
  .map((opt, i) => {
              const isSelected = selectedOption === opt.id
              const letters = ['A', 'B', 'C', 'D']
              return (
                <button key={opt.id}
                  onClick={() => !selectedOption && handleAnswer(opt.id)}
                  disabled={!!selectedOption}
                  className="w-full text-left rounded-xl p-4 transition-all flex items-start gap-3"
                  style={{
                    background: isSelected ? 'rgba(74,124,89,0.12)' : 'rgba(0,5,2,0.6)',
                    border: `1px solid ${isSelected ? NEON : '#ffffff10'}`,
                    boxShadow: isSelected ? `0 0 15px ${NEON}20` : 'none',
                    cursor: selectedOption ? 'default' : 'pointer',
                    transform: isSelected ? 'scale(1.01)' : 'scale(1)'
                  }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: isSelected ? NEON : '#ffffff10',
                      color: isSelected ? '#000' : '#9CA3AF'
                    }}>
                    {letters[i]}
                  </span>
                  <span className="text-sm leading-relaxed"
                    style={{ color: isSelected ? '#fff' : '#D1D5DB' }}>
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
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: currentIdx === 0 ? 'rgba(0,5,2,0.3)' : 'rgba(0,8,4,0.8)',
              color: currentIdx === 0 ? '#374151' : '#9CA3AF',
              border: '1px solid #ffffff10',
              cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
            }}>
            ← Anterior
          </button>
          <div className="text-xs text-gray-600">
            {answeredCount} de {effectiveTotal} respondidas
          </div>
          {isLast ? (
            allAnswered ? (
              <button onClick={() => setShowFinishModal(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: '#000', boxShadow: `0 0 20px ${NEON}40` }}>
                Ver resultado →
              </button>
            ) : (
              <span className="px-5 py-2.5 text-xs text-gray-600">Última pregunta</span>
            )
          ) : (
            <button onClick={goNext}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(0,8,4,0.8)', color: '#9CA3AF', border: '1px solid #ffffff10' }}>
              Siguiente →
            </button>
          )}
        </div>

        {/* Botón Finalizar: siempre visible, distinto de la navegación */}
        <button
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
            <div className="flex justify-between"><span>Respondidas:</span><strong className="text-white">{answeredCount} de {effectiveTotal}</strong></div>
            <div className="flex justify-between"><span>Sin responder:</span><strong style={{ color: ORANGE }}>{unansweredCount} preguntas</strong></div>
            <p className="pt-2 text-gray-400">
              Las preguntas sin responder contarán como incorrectas en tu resultado. ¿Estás seguro de que
              quieres finalizar?
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
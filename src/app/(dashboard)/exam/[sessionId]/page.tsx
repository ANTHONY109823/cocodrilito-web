'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { examsApi } from '@/lib/api/exams'
import apiClient from '@/lib/api/client'

const NEON = '#00C87A'
const RED = '#FF5252'
const GOLD = '#FFD700'

interface AnswerOption {
  id: string
  optionText: string
  optionIndex: number
}

interface Question {
  id: string
  questionText: string
  orderIndex: number
  options: AnswerOption[]
}

interface SessionData {
  sessionId: string
  examTitle: string
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

  useEffect(() => {
    loadSession()
  }, [sessionId])

  useEffect(() => {
    if (!session) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleFinish(); return 0 }
        return prev - 1
      })
      setQuestionTime(prev => prev + 1000)
    }, 1000)
    return () => clearInterval(t)
  }, [session])

  const loadSession = async () => {
    try {
      // Verificar si ya está completada
      const resultRes = await examsApi.getResult(sessionId)
      if (resultRes.data?.status === 'Completed') {
        router.replace(`/result/${sessionId}`)
        return
      }
    } catch { }

    try {
      const res = await apiClient.get(`/exams/sessions/${sessionId}`)
      const data = res.data
      // Normalizar estructura
      setSession({
        sessionId: data.sessionId,
        examTitle: data.examTitle,
        totalQuestions: data.questions?.length || 0,
        timeLimitSeconds: data.timeLimitSeconds,
        questions: (data.questions || []).map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          orderIndex: q.orderIndex,
          options: (q.options || q.answerOptions || []).map((o: any) => ({
            id: o.id,
            optionText: o.optionText,
            optionIndex: o.optionIndex
          }))
        }))
      })
      // Calcular tiempo restante basado en cuándo empezó
      const startedAt = new Date(data.startedAt).getTime()
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const remaining = Math.max(0, data.timeLimitSeconds - elapsed)
      setTimeLeft(remaining)
    } catch {
      router.push('/exams')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (optionId: string) => {
    if (!session) return
    setSelectedOption(optionId)
    const q = session.questions[currentIdx]
    setAnswers(prev => ({ ...prev, [q.id]: optionId }))
    try {
      await examsApi.submitAnswer(sessionId, {
        questionId: q.id,
        selectedOptionId: optionId,
        timeSpentMs: questionTime
      })
    } catch { }
    setTimeout(() => {
      if (currentIdx < session.totalQuestions - 1) {
        setCurrentIdx(prev => prev + 1)
        setSelectedOption(null)
        setQuestionTime(0)
      }
    }, 600)
  }

  const handleFinish = useCallback(async () => {
    if (finishing) return
    setFinishing(true)
    try {
      await examsApi.finish(sessionId)
      router.push(`/result/${sessionId}`)
    } catch {
      router.push(`/result/${sessionId}`)
    }
  }, [finishing, sessionId])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const timerColor = timeLeft < 60 ? RED : timeLeft < 300 ? GOLD : NEON
  const progress = session ? (currentIdx / session.totalQuestions) * 100 : 0

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

  const currentQ = session.questions[currentIdx]
  const answeredCount = Object.keys(answers).length

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
          <div className="text-gray-500 text-xs mt-0.5">
            Pregunta {currentIdx + 1} de {session.totalQuestions}
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
                    background: isSelected ? 'rgba(0,200,122,0.12)' : 'rgba(0,5,2,0.6)',
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
   {/* FOOTER */}
<div className="flex items-center justify-between gap-3">
  <div className="flex items-center gap-3">
    <button
      onClick={() => { setCurrentIdx(prev => prev - 1); setSelectedOption(answers[session.questions[currentIdx - 1]?.id] || null); setQuestionTime(0) }}
      disabled={currentIdx === 0}
      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={{
        backgroundColor: currentIdx === 0 ? 'rgba(0,5,2,0.3)' : 'rgba(0,8,4,0.8)',
        color: currentIdx === 0 ? '#374151' : '#9CA3AF',
        border: '1px solid #ffffff10',
        cursor: currentIdx === 0 ? 'not-allowed' : 'pointer'
      }}>
      ← Anterior
    </button>
    <div className="text-xs text-gray-600">
      {answeredCount} de {session.totalQuestions} respondidas
    </div>
  </div>
  {currentIdx === session.totalQuestions - 1 ? (
    <button onClick={handleFinish} disabled={finishing}
      className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${NEON}, #009A5E)`,
        color: '#000', boxShadow: `0 0 20px ${NEON}40`
      }}>
      {finishing ? 'Finalizando...' : 'Finalizar examen ✓'}
    </button>
  ) : (
    <button
      onClick={() => { setCurrentIdx(prev => prev + 1); setSelectedOption(answers[session.questions[currentIdx + 1]?.id] || null); setQuestionTime(0) }}
      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
      style={{ backgroundColor: 'rgba(0,8,4,0.8)', color: '#9CA3AF', border: '1px solid #ffffff10' }}>
      Siguiente →
    </button>
  )}
</div>
    </div>
  )
}
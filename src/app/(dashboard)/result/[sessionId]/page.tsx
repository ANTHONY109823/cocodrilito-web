'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { examsApi } from '@/lib/api/exams'
import Link from 'next/link'
import { ExplanationBlock } from '@/components/exam/ExplanationBlock'

import { NEON } from '@/lib/constants/theme'
const RED = '#FF5252'
const BLUE = '#4FC3F7'
const GOLD = '#FFD700'

interface ResultData {
  sessionId: string
  examTitle: string
  score: number
  correctAnswers: number
  incorrectAnswers: number
  unansweredCount: number
  unansweredQuestions: number
  totalQuestions: number
  timeSpentSeconds: number
  passed: boolean
  passingScore: number
  answers?: QuestionAnswer[]
  questions?: QuestionAnswer[]
}

interface QuestionAnswer {
  questionId: string
  questionText: string
  explanation?: string | null
  selectedOptionId: string | null
  correctOptionId: string
  isCorrect: boolean
  options: { id: string; optionText: string; optionIndex: number }[]
}

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAnswers, setShowAnswers] = useState(false)

  const loadResult = useCallback(async () => {
    try {
      const res = await examsApi.getResult(sessionId)
      setResult(res.data)
    } catch {
      router.push('/exams')
    } finally {
      setLoading(false)
    }
  }, [sessionId, router])

  useEffect(() => {
    void loadResult()
  }, [loadResult])

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🐊</div>
          <p className="text-gray-400">Calculando resultado...</p>
        </div>
      </div>
    )
  }

  if (!result) return null

  const answerList = result.questions ?? result.answers ?? []
  const scoreColor = result.passed ? NEON : RED
  const scoreEmoji = result.score >= 90 ? '🏆' : result.score >= 70 ? '✅' : result.score >= 50 ? '⚠️' : '💀'
  const unanswered = result.unansweredCount ?? result.unansweredQuestions ?? 0
  const incorrect = result.incorrectAnswers ?? Math.max(0, result.totalQuestions - result.correctAnswers - unanswered)

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes countUp { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .count-up { animation: countUp 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
      `}</style>

      {/* BOTÓN VOLVER */}
      <Link href="/exams"
        className="inline-flex items-center gap-1 text-gray-500 hover:text-[var(--color-text-primary)] text-sm mb-6 transition-colors">
        ← Volver a exámenes
      </Link>

      {/* RESULTADO PRINCIPAL */}
      <div className="rounded-2xl p-8 text-center mb-4 fade-in"
        style={{
          background: result.passed ? 'rgba(74,124,89,0.06)' : 'rgba(255,82,82,0.06)',
          border: `1px solid ${scoreColor}25`,
          boxShadow: `0 0 40px ${scoreColor}15`
        }}>
        <div className="text-6xl mb-4 count-up">{scoreEmoji}</div>
        <div className="text-7xl font-bold mb-2 count-up"
          style={{ color: scoreColor, textShadow: `0 0 30px ${scoreColor}` }}>
          {result.score}%
        </div>
        <div className="text-xl font-bold mb-1"
          style={{ color: scoreColor }}>
          {result.passed ? '¡Aprobado!' : 'No aprobado'}
        </div>
        <div className="text-gray-500 text-sm">{result.examTitle}</div>
        {!result.passed && result.passingScore != null && (
          <div className="text-xs text-gray-600 mt-1">
            Necesitas {result.passingScore}% para aprobar
          </div>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 fade-in">
        {[
          { label: '✅ Correctas', value: result.correctAnswers, color: NEON, bg: 'rgba(74,124,89,0.06)', border: 'rgba(74,124,89,0.15)' },
          { label: '❌ Incorrectas', value: incorrect, color: RED, bg: 'rgba(255,82,82,0.06)', border: 'rgba(255,82,82,0.15)' },
          { label: '⬜ Sin responder', value: unanswered, color: GOLD, bg: 'rgba(255,215,0,0.06)', border: 'rgba(255,215,0,0.15)' },
          { label: '📋 Total', value: result.totalQuestions, color: BLUE, bg: 'rgba(79,195,247,0.06)', border: 'rgba(79,195,247,0.15)' },
        ].map((item, i) => (
          <div key={i} className="rounded-2xl p-4 text-center"
            style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-gray-500 text-xs mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-3">
        <span>⏱ Tiempo: {formatTime(result.timeSpentSeconds)}</span>
      </div>

      {unanswered > 0 && (
        <div className="rounded-xl px-4 py-2.5 text-xs mb-4 text-center"
          style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: GOLD }}>
          Las preguntas sin responder cuentan como incorrectas.
        </div>
      )}

      {/* ACCIONES */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={() => setShowAnswers(!showAnswers)}
          className="py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            backgroundColor: showAnswers ? `${BLUE}15` : 'rgba(0,8,4,0.8)',
            color: showAnswers ? BLUE : '#9CA3AF',
            border: `1px solid ${showAnswers ? BLUE : '#ffffff10'}20`
          }}>
          {showAnswers ? 'Ocultar respuestas' : 'Ver respuestas'}
        </button>
        <Link href="/exams"
          className="py-3 rounded-xl text-sm font-bold text-center transition-all hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`,
            color: '#000', boxShadow: `0 0 15px ${NEON}30`
          }}>
          Otro examen →
        </Link>
      </div>

      <Link href="/ranking"
        className="block py-3 rounded-xl text-sm font-medium text-center mb-4 transition-all"
        style={{ backgroundColor: 'rgba(0,8,4,0.8)', color: '#6B7280', border: '1px solid #ffffff08' }}>
        Ver mi posición en el ranking →
      </Link>

      {/* REVISIÓN DE RESPUESTAS */}
      {showAnswers && (
        <div className="space-y-3 fade-in">
          <h3 className="text-white font-bold text-base">Revisión de respuestas</h3>
          {answerList.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No hay detalle de respuestas disponible para esta sesión.
            </p>
          ) : answerList.map((ans, i) => {
            const letters = ['A', 'B', 'C', 'D']
            return (
              <div key={ans.questionId} className="rounded-2xl p-4"
                style={{
                  background: 'rgba(0,5,2,0.9)',
                  border: `1px solid ${ans.isCorrect ? NEON : RED}20`
                }}>
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-lg shrink-0">{ans.isCorrect ? '✅' : '❌'}</span>
                  <p className="text-white text-sm font-medium leading-relaxed">
                    {i + 1}. {ans.questionText}
                  </p>
                </div>
                <div className="space-y-2">
                  {ans.options
                    .sort((a, b) => a.optionIndex - b.optionIndex)
                    .map((opt, j) => {
                      const isCorrect = opt.id === ans.correctOptionId
                      const isSelected = opt.id === ans.selectedOptionId
                      const isWrong = isSelected && !isCorrect
                      return (
                        <div key={opt.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                          style={{
                            backgroundColor: isCorrect ? `${NEON}12` : isWrong ? `${RED}12` : 'transparent',
                            border: `1px solid ${isCorrect ? `${NEON}30` : isWrong ? `${RED}30` : 'transparent'}`
                          }}>
                          <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                            style={{
                              backgroundColor: isCorrect ? NEON : isWrong ? RED : '#ffffff10',
                              color: (isCorrect || isWrong) ? '#000' : '#6B7280'
                            }}>
                            {letters[j]}
                          </span>
                          <span style={{ color: isCorrect ? '#fff' : isWrong ? '#fff' : '#6B7280' }}>
                            {opt.optionText}
                          </span>
                          {isCorrect && <span className="ml-auto text-xs font-bold" style={{ color: NEON }}>✓ correcta</span>}
                          {isWrong && <span className="ml-auto text-xs font-bold" style={{ color: RED }}>✗ tu respuesta</span>}
                        </div>
                      )
                    })}
                </div>
                {!ans.isCorrect && (
                  <ExplanationBlock explanation={ans.explanation} className="mt-3" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
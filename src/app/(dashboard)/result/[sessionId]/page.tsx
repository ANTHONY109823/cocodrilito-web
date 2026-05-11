'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { examsApi } from '@/lib/api/exams'
import Link from 'next/link'

interface QuestionResult {
  questionId: string
  questionText: string
  explanation?: string
  selectedOptionId?: string
  correctOptionId: string
  isCorrect: boolean
  pointsEarned: number
  options: { id: string; optionText: string; optionIndex: number }[]
}

interface ExamResult {
  sessionId: string
  examTitle: string
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpentSeconds: number
  status: string
  passed: boolean
  questions: QuestionResult[]
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    loadResult()
  }, [])

  const loadResult = async () => {
    try {
      const res = await examsApi.getResult(sessionId)
      setResult(res.data)
    } catch {
      router.push('/exams')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🐊</div>
          <div className="text-white">Calculando resultado...</div>
        </div>
      </div>
    )
  }

  if (!result) return null

  const scoreColor = result.passed ? '#1D9E75' : '#D85A30'
  const scoreEmoji = result.score === 100 ? '🏆' :
    result.score >= 80 ? '🐊' :
    result.passed ? '✅' : '💀'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center mb-6">
        <div className="text-6xl mb-4">{scoreEmoji}</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: scoreColor }}>
          {result.score}%
        </h1>
        <div className="text-xl font-semibold text-white mb-1">
          {result.passed ? '¡Aprobado!' : 'No aprobado'}
        </div>
        <p className="text-gray-400 text-sm">{result.examTitle}</p>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6"
          style={{ borderTop: '1px solid #1A2E24' }}>
          <div>
            <div className="text-2xl font-bold text-white">
              {result.correctAnswers}/{result.totalQuestions}
            </div>
            <div className="text-gray-500 text-xs mt-1">Correctas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {formatTime(result.timeSpentSeconds)}
            </div>
            <div className="text-gray-500 text-xs mt-1">Tiempo</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: scoreColor }}>
              {result.status === 'Completed' ? 'Completado' : result.status}
            </div>
            <div className="text-gray-500 text-xs mt-1">Estado</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Link href="/exams" className="btn-primary text-center">
          Hacer otro examen
        </Link>
        <button
          onClick={() => setShowDetail(!showDetail)}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            backgroundColor: '#1A2E24',
            color: '#1D9E75',
            border: '1px solid #1D9E75'
          }}>
          {showDetail ? 'Ocultar' : 'Ver'} respuestas
        </button>
      </div>

      {showDetail && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Revisión de respuestas</h3>
          {result.questions.map((q, i) => (
            <div key={q.questionId} className="card">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-lg">{q.isCorrect ? '✅' : '❌'}</span>
                <p className="text-white text-sm font-medium">
                  {i + 1}. {q.questionText}
                </p>
              </div>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const letters = ['A', 'B', 'C', 'D', 'E']
                  const isCorrect = opt.id === q.correctOptionId
                  const isWrong = opt.id === q.selectedOptionId && !isCorrect
                  return (
                    <div key={opt.id}
                      className="flex items-center gap-2 p-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: isCorrect ? '#1A3D2E' : isWrong ? '#3D1A1A' : 'transparent',
                        border: isCorrect ? '1px solid #1D9E75' : isWrong ? '1px solid #D85A30' : '1px solid transparent'
                      }}>
                      <span className="font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: isCorrect ? '#1D9E75' : isWrong ? '#D85A30' : '#1A2E24',
                          color: '#fff'
                        }}>
                        {letters[opt.optionIndex]}
                      </span>
                      <span style={{ color: isCorrect ? '#1D9E75' : isWrong ? '#D85A30' : '#6B7280' }}>
                        {opt.optionText}
                      </span>
                      {isCorrect && (
                        <span className="ml-auto text-xs" style={{ color: '#1D9E75' }}>✓ correcta</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {q.explanation && (
                <div className="mt-3 p-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#0F1A14', color: '#9CA3AF' }}>
                  💡 {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
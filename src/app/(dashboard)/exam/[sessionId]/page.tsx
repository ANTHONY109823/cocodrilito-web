'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { examsApi } from '@/lib/api/exams'

interface Option {
  id: string
  optionText: string
  optionIndex: number
}

interface Question {
  id: string
  questionText: string
  imageUrl?: string
  orderIndex: number
  points: number
  options: Option[]
}

export default function ExamPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [examTitle, setExamTitle] = useState('')

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer)
          handleFinish()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const loadSession = async () => {
    try {
      const examId = searchParams.get('examId')
      if (!examId) return
      const res = await examsApi.start(examId)
      setQuestions(res.data.questions)
      setTimeLeft(res.data.timeLimitSeconds)
      setExamTitle(res.data.examTitle)
    } catch {
      router.push('/exams')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIndex].id]: optionId,
    }))
  }

  const handleFinish = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await examsApi.finish(sessionId)
      router.push(`/result/${sessionId}`)
    } catch {
      router.push('/exams')
    }
  }, [sessionId, submitting])

  const handleNext = async () => {
    const question = questions[currentIndex]
    const selectedOptionId = answers[question.id] || null
    try {
      await examsApi.submitAnswer(sessionId, {
        questionId: question.id,
        selectedOptionId,
        timeSpentMs: 0,
      })
    } catch {
      console.error('Error enviando respuesta')
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      handleFinish()
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const timeColor = timeLeft < 300 ? '#D85A30' : timeLeft < 600 ? '#EF9F27' : '#1D9E75'
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🐊</div>
          <div className="text-white">Cargando examen...</div>
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  const selectedOption = answers[question?.id]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-semibold">{examTitle}</h1>
          <p className="text-gray-500 text-sm">Pregunta {currentIndex + 1} de {questions.length}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color: timeColor }}>
            ⏱ {formatTime(timeLeft)}
          </div>
          <div className="text-gray-500 text-xs">tiempo restante</div>
        </div>
      </div>

      <div className="w-full h-2 rounded-full mb-6" style={{ backgroundColor: '#1A2E24' }}>
        <div className="h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: '#1D9E75' }} />
      </div>

      <div className="card mb-6">
        <div className="flex items-start gap-3 mb-6">
          <span className="px-2 py-1 rounded text-xs font-bold"
            style={{ backgroundColor: '#1A2E24', color: '#1D9E75', minWidth: '32px', textAlign: 'center' }}>
            {currentIndex + 1}
          </span>
          <p className="text-white text-lg leading-relaxed">{question?.questionText}</p>
        </div>
        <div className="space-y-3">
          {question?.options.map((option, i) => {
            const letters = ['A', 'B', 'C', 'D', 'E']
            const isSelected = selectedOption === option.id
            return (
              <button key={option.id} onClick={() => handleAnswer(option.id)}
                className="w-full text-left p-4 rounded-xl transition-all duration-200 flex items-start gap-3"
                style={{
                  backgroundColor: isSelected ? '#1A3D2E' : '#0F1A14',
                  border: isSelected ? '2px solid #1D9E75' : '2px solid #1A2E24',
                  color: isSelected ? '#fff' : '#9CA3AF',
                }}>
                <span className="font-bold text-sm min-w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: isSelected ? '#1D9E75' : '#1A2E24',
                    color: isSelected ? '#fff' : '#6B7280',
                  }}>
                  {letters[i]}
                </span>
                <span className="leading-relaxed">{option.optionText}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            backgroundColor: currentIndex === 0 ? '#0F1A14' : '#1A2E24',
            color: currentIndex === 0 ? '#374151' : '#9CA3AF',
            border: '1px solid #1A2E24'
          }}>
          ← Anterior
        </button>

        <div className="flex gap-2">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentIndex(i)}
              className="w-8 h-8 rounded-full text-xs font-bold transition-all"
              style={{
                backgroundColor: answers[questions[i]?.id] ? '#1D9E75' : i === currentIndex ? '#1A3D2E' : '#1A2E24',
                color: answers[questions[i]?.id] ? '#fff' : i === currentIndex ? '#1D9E75' : '#6B7280',
                border: i === currentIndex ? '2px solid #1D9E75' : '2px solid transparent'
              }}>
              {i + 1}
            </button>
          ))}
        </div>

        {currentIndex < questions.length - 1 ? (
          <button onClick={handleNext}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: '#1D9E75', color: '#fff' }}>
            Siguiente →
          </button>
        ) : (
          <button onClick={handleNext} disabled={submitting}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ backgroundColor: '#EF9F27', color: '#000' }}>
            {submitting ? 'Enviando...' : '✅ Terminar examen'}
          </button>
        )}
      </div>
    </div>
  )
}
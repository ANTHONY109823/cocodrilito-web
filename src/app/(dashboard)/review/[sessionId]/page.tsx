'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { examsApi } from '@/lib/api/exams'
import Link from 'next/link'
import { ExplanationBlock } from '@/components/exam/ExplanationBlock'
import { QuizOption } from '@/components/exam/QuizOption'
import { optionLetter } from '@/lib/utils/optionLetter'

import { NEON, SURFACE, primaryMix } from '@/lib/constants/theme'

interface ReviewQuestion {
  id: string
  questionText: string
  category: string
  explanation: string
  options: {
    id: string
    optionText: string
    optionIndex: number
    isCorrect: boolean
  }[]
}

interface ReviewData {
  sessionId: string
  totalToReview: number
  questions: ReviewQuestion[]
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [review, setReview] = useState<ReviewData | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await examsApi.getReviewSession(sessionId)
        if (!cancelled) setReview(res.data)
      } catch {
        if (!cancelled) router.push('/history')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🐊</div>
          <p className="text-gray-400">Cargando repaso...</p>
        </div>
      </div>
    )
  }

  if (!review || review.questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">¡Sin errores que repasar!</h2>
        <p className="text-[var(--color-text-muted)] text-sm mb-6">Respondiste todo correctamente en este simulacro.</p>
        <Link href="/history"
          className="inline-flex px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: 'var(--color-text-primary)' }}>
          Volver al historial
        </Link>
      </div>
    )
  }

  const currentQ = review.questions[currentIdx]
  const isLast = currentIdx === review.questions.length - 1

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/history" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-sm transition-colors">
          ← Historial
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Modo repaso 📚</h1>
          <p className="text-[var(--color-text-muted)] text-sm">{review.totalToReview} preguntas incorrectas para repasar</p>
        </div>
      </div>

      {/* PROGRESO */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary-bg)' }}>
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${((currentIdx + 1) / review.questions.length) * 100}%`,
              background: `linear-gradient(90deg, ${primaryMix(60)}, ${NEON})`
            }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">
          {currentIdx + 1} / {review.questions.length}
        </span>
      </div>

      {/* PREGUNTA */}
      <div className="rounded-2xl p-5 mb-4 fade-in" key={currentIdx}
        style={{ background: 'var(--color-surface-elevated)', border: `1px solid ${primaryMix(15)}` }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${primaryMix(15)}`, color: NEON }}>
            {currentQ.category}
          </span>
          <span className="text-xs text-gray-600">Pregunta {currentIdx + 1}</span>
        </div>

        <p className="text-[var(--color-text-primary)] text-base font-medium leading-relaxed mb-5">
          {currentQ.questionText}
        </p>

        <div className="space-y-2">
          {currentQ.options
            .sort((a, b) => a.optionIndex - b.optionIndex)
            .map((opt, i) => (
              <QuizOption
                key={opt.id}
                letter={optionLetter(i)}
                text={opt.optionText}
                variant={revealed && opt.isCorrect ? 'correct' : 'neutral'}
                tag={revealed && opt.isCorrect ? '✓ correcta' : null}
              />
            ))}
        </div>

        {/* EXPLICACIÓN */}
        {revealed && (
          <ExplanationBlock explanation={currentQ.explanation} className="mt-4 fade-in" />
        )}
      </div>

      {/* ACCIONES */}
      <div className="flex gap-3">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: 'var(--color-text-primary)' }}>
            Ver respuesta correcta
          </button>
        ) : isLast ? (
          <Link href="/history"
            className="flex-1 py-3 rounded-xl font-bold text-sm text-center transition-all hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: 'var(--color-text-primary)' }}>
            ✅ Repaso completado
          </Link>
        ) : (
          <button
            onClick={() => { setCurrentIdx(prev => prev + 1); setRevealed(false) }}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: 'var(--color-text-primary)' }}>
            Siguiente pregunta →
          </button>
        )}

        {revealed && !isLast && (
          <Link href="/history"
            className="px-5 py-3 rounded-xl text-sm font-medium text-center"
            style={{ backgroundColor: SURFACE, color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
            Salir
          </Link>
        )}
      </div>
    </div>
  )
}
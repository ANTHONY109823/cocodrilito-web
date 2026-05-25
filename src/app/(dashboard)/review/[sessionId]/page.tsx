'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { examsApi } from '@/lib/api/exams'
import Link from 'next/link'

import { NEON } from '@/lib/constants/theme'
const BLUE = '#4FC3F7'

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
        <h2 className="text-xl font-bold text-white mb-3">¡Sin errores que repasar!</h2>
        <p className="text-gray-400 text-sm mb-6">Respondiste todo correctamente en este simulacro.</p>
        <Link href="/history"
          className="inline-flex px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000' }}>
          Volver al historial
        </Link>
      </div>
    )
  }

  const currentQ = review.questions[currentIdx]
  const letters = ['A', 'B', 'C', 'D']
  const isLast = currentIdx === review.questions.length - 1

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/history" className="text-gray-500 hover:text-white text-sm transition-colors">
          ← Historial
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Modo repaso 📚</h1>
          <p className="text-gray-500 text-sm">{review.totalToReview} preguntas incorrectas para repasar</p>
        </div>
      </div>

      {/* PROGRESO */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#ffffff08' }}>
          <div className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${((currentIdx + 1) / review.questions.length) * 100}%`,
              background: `linear-gradient(90deg, ${NEON}60, ${NEON})`
            }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">
          {currentIdx + 1} / {review.questions.length}
        </span>
      </div>

      {/* PREGUNTA */}
      <div className="rounded-2xl p-5 mb-4 fade-in" key={currentIdx}
        style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${NEON}15` }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${NEON}15`, color: NEON }}>
            {currentQ.category}
          </span>
          <span className="text-xs text-gray-600">Pregunta {currentIdx + 1}</span>
        </div>

        <p className="text-white text-base font-medium leading-relaxed mb-5">
          {currentQ.questionText}
        </p>

        <div className="space-y-2">
          {currentQ.options
            .sort((a, b) => a.optionIndex - b.optionIndex)
            .map((opt, i) => {
              const isCorrect = opt.isCorrect
              let borderColor = '#ffffff10'
              let bgColor = 'rgba(0,5,2,0.6)'
              let textColor = '#D1D5DB'

              if (revealed) {
                if (isCorrect) {
                  borderColor = NEON
                  bgColor = 'rgba(74,124,89,0.12)'
                  textColor = '#fff'
                }
              }

              return (
                <div key={opt.id}
                  className="rounded-xl p-3 flex items-start gap-3 transition-all"
                  style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: revealed && isCorrect ? NEON : '#ffffff10',
                      color: revealed && isCorrect ? '#000' : '#9CA3AF'
                    }}>
                    {letters[i]}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: textColor }}>
                    {opt.optionText}
                  </span>
                  {revealed && isCorrect && (
                    <span className="ml-auto text-xs font-bold shrink-0" style={{ color: NEON }}>
                      ✓ correcta
                    </span>
                  )}
                </div>
              )
            })}
        </div>

        {/* EXPLICACIÓN */}
        {revealed && currentQ.explanation && (
          <div className="mt-4 rounded-xl p-3 fade-in"
            style={{ backgroundColor: `${BLUE}08`, border: `1px solid ${BLUE}20` }}>
            <div className="text-xs font-semibold mb-1" style={{ color: BLUE }}>💡 Explicación</div>
            <p className="text-gray-300 text-sm leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}
      </div>

      {/* ACCIONES */}
      <div className="flex gap-3">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000' }}>
            Ver respuesta correcta
          </button>
        ) : isLast ? (
          <Link href="/history"
            className="flex-1 py-3 rounded-xl font-bold text-sm text-center transition-all hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000' }}>
            ✅ Repaso completado
          </Link>
        ) : (
          <button
            onClick={() => { setCurrentIdx(prev => prev + 1); setRevealed(false) }}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
            style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000' }}>
            Siguiente pregunta →
          </button>
        )}

        {revealed && !isLast && (
          <Link href="/history"
            className="px-5 py-3 rounded-xl text-sm font-medium text-center"
            style={{ backgroundColor: 'rgba(0,5,2,0.5)', color: '#6B7280', border: '1px solid #ffffff10' }}>
            Salir
          </Link>
        )}
      </div>
    </div>
  )
}
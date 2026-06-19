'use client'

import { hasUsableExplanation, needsExplanationReview } from '@/lib/utils/explanation'

interface ExplanationBlockProps {
  explanation?: string | null
  className?: string
}

export function ExplanationBlock({ explanation, className = '' }: ExplanationBlockProps) {
  if (hasUsableExplanation(explanation)) {
    return (
      <div className={`quiz-explain-box ${className}`}>
        <div className="quiz-explain-title">💡 Explicación</div>
        <p className="quiz-explain-body">{explanation}</p>
      </div>
    )
  }

  if (needsExplanationReview(explanation)) {
    return (
      <div
        className={`rounded-xl border border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] p-3 ${className}`}
      >
        <div className="mb-1 text-xs font-semibold text-[var(--color-warning)]">
          ⚠️ Pendiente de revisión editorial
        </div>
        <p className="quiz-explain-muted">
          Esta pregunta está marcada para revisión por el equipo de contenido. Consulta con tu
          instructor mientras se completa la explicación oficial.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-input-bg)] p-3 ${className}`}
    >
      <div className="mb-1 text-xs font-semibold text-[var(--color-text-muted)]">
        📋 Sin explicación oficial
      </div>
      <p className="quiz-explain-muted">
        Esta pregunta aún no tiene explicación curada en el banco. Anótala y consúltala con tu
        instructor o material de estudio.
      </p>
    </div>
  )
}

'use client'

import { hasUsableExplanation, needsExplanationReview } from '@/lib/utils/explanation'

interface ExplanationBlockProps {
  explanation?: string | null
  className?: string
}

export function ExplanationBlock({ explanation, className = '' }: ExplanationBlockProps) {
  if (hasUsableExplanation(explanation)) {
    return (
      <div
        className={`rounded-xl border border-[rgba(79,195,247,0.2)] bg-[rgba(79,195,247,0.06)] p-3 ${className}`}
      >
        <div className="mb-1 text-xs font-semibold text-[#4FC3F7]">💡 Explicación</div>
        <p className="text-sm leading-relaxed text-gray-300">{explanation}</p>
      </div>
    )
  }

  if (needsExplanationReview(explanation)) {
    return (
      <div
        className={`rounded-xl border border-[rgba(201,148,58,0.25)] bg-[rgba(201,148,58,0.08)] p-3 ${className}`}
      >
        <div className="mb-1 text-xs font-semibold text-[#C9943A]">⚠️ Pendiente de revisión editorial</div>
        <p className="text-sm leading-relaxed text-gray-400">
          Esta pregunta está marcada para revisión por el equipo de contenido. Consulta con tu
          instructor mientras se completa la explicación oficial.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border border-[rgba(189,255,223,0.12)] bg-[rgba(255,255,255,0.03)] p-3 ${className}`}
    >
      <div className="mb-1 text-xs font-semibold text-[#6B8A75]">📋 Sin explicación oficial</div>
      <p className="text-sm leading-relaxed text-gray-500">
        Esta pregunta aún no tiene explicación curada en el banco. Anótala y consúltala con tu
        instructor o material de estudio.
      </p>
    </div>
  )
}

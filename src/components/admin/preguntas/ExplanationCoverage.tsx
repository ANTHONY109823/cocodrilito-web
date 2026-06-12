'use client'

import { NEON } from '@/lib/constants/theme'

interface ExplanationCoverageBannerProps {
  total: number
  withExplanation: number
  withoutExplanation: number
  needsReview: number
}

export function ExplanationCoverageBanner({
  total,
  withExplanation,
  withoutExplanation,
  needsReview,
}: ExplanationCoverageBannerProps) {
  if (total === 0) return null

  const coveragePct = Math.round((withExplanation / total) * 100)
  const hasGaps = withoutExplanation > 0 || needsReview > 0

  return (
    <div
      className="rounded-xl px-4 py-3 mb-4 text-xs"
      style={{
        background: hasGaps ? 'rgba(201,148,58,0.08)' : 'rgba(74,124,89,0.08)',
        border: `1px solid ${hasGaps ? 'rgba(201,148,58,0.25)' : 'rgba(74,124,89,0.25)'}`,
      }}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-gray-300 font-medium">
          Cobertura de explicaciones:{' '}
          <span style={{ color: hasGaps ? '#C9943A' : NEON }}>{coveragePct}%</span>
        </span>
        <span className="text-gray-500">
          {withExplanation} con explicación · {withoutExplanation} sin explicación
          {needsReview > 0 ? ` · ${needsReview} pendientes de revisión` : ''}
        </span>
      </div>
      {hasGaps && (
        <p className="text-gray-500 mt-1.5">
          Completa la columna <strong className="text-gray-400">Explicacion</strong> en el CSV o edita
          las preguntas desde el modal. Usa <code className="text-gray-400">[REVISAR]</code> solo como
          marcador temporal.
        </p>
      )}
    </div>
  )
}

interface ExplanationFilterBarProps {
  filter: 'all' | 'missing' | 'needsReview'
  onChange: (filter: 'all' | 'missing' | 'needsReview') => void
  withoutExplanation: number
  needsReview: number
}

export function ExplanationFilterBar({
  filter,
  onChange,
  withoutExplanation,
  needsReview,
}: ExplanationFilterBarProps) {
  const options = [
    { key: 'all' as const, label: 'Todas' },
    { key: 'missing' as const, label: `Sin explicación (${withoutExplanation})` },
    ...(needsReview > 0
      ? [{ key: 'needsReview' as const, label: `Pendientes (${needsReview})` }]
      : []),
  ]

  return (
    <div className="flex gap-2 mb-3 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            backgroundColor: filter === opt.key ? `${NEON}18` : 'rgba(255,255,255,0.04)',
            color: filter === opt.key ? NEON : '#6B7280',
            border: `1px solid ${filter === opt.key ? `${NEON}40` : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

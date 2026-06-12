/** Indica si la pregunta tiene explicación editorial utilizable para el alumno. */
export function hasUsableExplanation(explanation?: string | null): boolean {
  const text = explanation?.trim()
  if (!text) return false
  if (needsExplanationReview(text)) return false
  return true
}

/** Marcadores de revisión editorial en CSV o carga manual. */
export function needsExplanationReview(explanation?: string | null): boolean {
  const text = explanation?.trim() ?? ''
  if (!text) return false
  return /\[REVISAR\]|\[PENDIENTE\]/i.test(text)
}

export type ExplanationFilter = 'all' | 'missing' | 'needsReview'

export function matchesExplanationFilter(
  explanation: string | null | undefined,
  filter: ExplanationFilter
): boolean {
  if (filter === 'all') return true
  if (filter === 'missing') return !hasUsableExplanation(explanation)
  return needsExplanationReview(explanation)
}

/** Balotarios / procesos de preparación PNP. */
export const QUESTION_TRACK_OPTIONS = [
  { value: 1, key: 'AscensosSuboficiales', label: 'Ascenso Suboficiales' },
  { value: 2, key: 'AscensosOficiales', label: 'Ascenso Oficiales' },
  { value: 3, key: 'PostulantesSuboficiales', label: 'Postulantes Suboficiales' },
  { value: 4, key: 'PostulantesOficiales', label: 'Postulantes Oficiales' },
] as const

/** Balotario principal cargado hoy (400 → 3000 preguntas). */
export const DEFAULT_QUESTION_TRACK = 1

export const ASCENSO_TRACK_OPTIONS = QUESTION_TRACK_OPTIONS.filter((t) =>
  t.key === 'AscensosSuboficiales' || t.key === 'AscensosOficiales'
)

export function trackLabel(value: number | string | null | undefined): string {
  if (value == null) return '—'
  const num = typeof value === 'number' ? value : Number(value)
  const byValue = QUESTION_TRACK_OPTIONS.find((t) => t.value === num)
  if (byValue) return byValue.label
  const byKey = QUESTION_TRACK_OPTIONS.find((t) => t.key === value)
  return byKey?.label ?? String(value)
}

export function trackKeyFromValue(value: number): string {
  return QUESTION_TRACK_OPTIONS.find((t) => t.value === value)?.key ?? 'AscensosSuboficiales'
}

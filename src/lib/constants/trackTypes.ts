/** Balotarios de ascenso PNP (único enfoque de la plataforma). */
export const QUESTION_TRACK_OPTIONS = [
  { value: 1, key: 'AscensosSuboficiales', label: 'Ascenso Suboficiales' },
  { value: 2, key: 'AscensosOficiales', label: 'Ascenso Oficiales' },
] as const

/** Alias explícito para selectores de UI. */
export const ASCENSO_TRACK_OPTIONS = QUESTION_TRACK_OPTIONS

/** Balotario principal cargado hoy (400 → 3000 preguntas). */
export const DEFAULT_QUESTION_TRACK = 1

const LEGACY_TRACK_LABELS: Record<string, string> = {
  PostulantesSuboficiales: 'Ascenso Suboficiales',
  PostulantesOficiales: 'Ascenso Oficiales',
  '3': 'Ascenso Suboficiales',
  '4': 'Ascenso Oficiales',
}

export function trackLabel(value: number | string | null | undefined): string {
  if (value == null) return '—'
  const raw = String(value).trim()
  const legacy = LEGACY_TRACK_LABELS[raw]
  if (legacy) return legacy
  const num = typeof value === 'number' ? value : Number(value)
  const byValue = QUESTION_TRACK_OPTIONS.find((t) => t.value === num)
  if (byValue) return byValue.label
  const byKey = QUESTION_TRACK_OPTIONS.find((t) => t.key === value)
  return byKey?.label ?? String(value)
}

export function trackKeyFromValue(value: number): string {
  return QUESTION_TRACK_OPTIONS.find((t) => t.value === value)?.key ?? 'AscensosSuboficiales'
}

/** Track efectivo del alumno: activeTrackType del perfil o primer balotario permitido. */
export function resolveUserTrackKey(
  user?: { activeTrackType?: string | null; allowedTrackTypes?: string[] } | null
): string {
  const active = user?.activeTrackType?.trim()
  if (active) return normalizeTrackKey(active) ?? active
  const allowed = user?.allowedTrackTypes?.find((t) => t?.trim())
  if (allowed) return normalizeTrackKey(allowed) ?? allowed.trim()
  return 'AscensosSuboficiales'
}

function normalizeTrackKey(value: string): string | null {
  const trimmed = value.trim()
  const legacy = LEGACY_TRACK_LABELS[trimmed]
  if (legacy) {
    const match = QUESTION_TRACK_OPTIONS.find((t) => t.label === legacy)
    return match?.key ?? null
  }
  const byValue = QUESTION_TRACK_OPTIONS.find((t) => String(t.value) === trimmed)
  if (byValue) return byValue.key
  const byKey = QUESTION_TRACK_OPTIONS.find((t) => t.key === trimmed)
  return byKey?.key ?? null
}

/** Balotario por defecto al crear alumno según lo habilitado en la agencia. */
export function resolveDefaultStudentTrack(
  user?: { allowedTrackTypes?: string[] } | null
): number {
  const allowed = (user?.allowedTrackTypes ?? [])
    .map((t) => normalizeTrackKey(String(t)))
    .filter((t): t is string => Boolean(t))

  const hasOfficials = allowed.includes('AscensosOficiales')
  const hasSubofficials = allowed.includes('AscensosSuboficiales')

  if (hasOfficials && !hasSubofficials) return 2
  if (hasSubofficials) return 1
  if (hasOfficials) return 2
  return DEFAULT_QUESTION_TRACK
}

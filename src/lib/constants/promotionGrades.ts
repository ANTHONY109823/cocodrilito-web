/** Jerarquías del balotario. Oficiales: 2 bancos. Suboficiales: banco unificado (value 5). */
import { trackLabel } from './trackTypes'

/** Opciones activas en UI (tabs). Valores 3/4 deprecados se normalizan a 5. */
export const PROMOTION_HIERARCHY_OPTIONS = [
  { value: 2, key: 'OficialesSuperiores', label: 'Oficiales Superiores', trackValue: 2 },
  { value: 1, key: 'OficialesSubalternos', label: 'Oficiales Subalternos', trackValue: 2 },
  { value: 5, key: 'Suboficiales', label: 'Suboficiales', trackValue: 1 },
] as const

/** Alias legacy (3/4) → banco unificado Suboficiales (5). */
const LEGACY_SUBOFICIAL_HIERARCHIES = new Set([3, 4])

export type PromotionHierarchyKey = (typeof PROMOTION_HIERARCHY_OPTIONS)[number]['key']

/**
 * Grados al que postula el alumno (meta de ascenso). Ordenado por jerarquía, mayor a menor.
 * Alférez y Suboficial de 3.ª son grados actuales, no metas de postulación.
 * Todos los grados Suboficiales usan hierarchy 5 (banco unificado).
 */
export const PROMOTION_GRADE_OPTIONS = [
  { value: 6, key: 'Coronel', label: 'Coronel', hierarchy: 2, trackValue: 2, postulationTarget: true },
  { value: 5, key: 'Comandante', label: 'Comandante', hierarchy: 2, trackValue: 2, postulationTarget: true },
  { value: 4, key: 'Mayor', label: 'Mayor', hierarchy: 2, trackValue: 2, postulationTarget: true },
  { value: 3, key: 'Capitan', label: 'Capitán', hierarchy: 1, trackValue: 2, postulationTarget: true },
  { value: 2, key: 'Teniente', label: 'Teniente', hierarchy: 1, trackValue: 2, postulationTarget: true },
  { value: 1, key: 'Alferez', label: 'Alférez', hierarchy: 1, trackValue: 2, postulationTarget: false },
  { value: 7, key: 'SuboficialSuperior', label: 'Suboficial Superior', hierarchy: 5, trackValue: 1, postulationTarget: true },
  { value: 8, key: 'SuboficialBrigadier', label: 'Suboficial Brigadier', hierarchy: 5, trackValue: 1, postulationTarget: true },
  { value: 9, key: 'SuboficialTecnicoPrimera', label: 'Suboficial Técnico de 1.ª', hierarchy: 5, trackValue: 1, postulationTarget: true },
  { value: 10, key: 'SuboficialTecnicoSegunda', label: 'Suboficial Técnico de 2.ª', hierarchy: 5, trackValue: 1, postulationTarget: true },
  { value: 11, key: 'SuboficialTecnicoTercera', label: 'Suboficial Técnico de 3.ª', hierarchy: 5, trackValue: 1, postulationTarget: true },
  { value: 12, key: 'SuboficialPrimera', label: 'Suboficial de 1.ª', hierarchy: 5, trackValue: 1, postulationTarget: true },
  { value: 13, key: 'SuboficialSegunda', label: 'Suboficial de 2.ª', hierarchy: 5, trackValue: 1, postulationTarget: true },
  { value: 14, key: 'SuboficialTercera', label: 'Suboficial de 3.ª', hierarchy: 5, trackValue: 1, postulationTarget: false },
] as const

/** Grado actual PNP → grado al que postula. Oficiales Generales no implementados. */
const POSTULATION_BY_CURRENT: Record<number, number> = {
  1: 2, // Alférez → Teniente
  2: 3, // Teniente → Capitán
  3: 4, // Capitán → Mayor
  4: 5, // Mayor → Comandante
  5: 6, // Comandante → Coronel
  14: 13, // SO 3.ª → SO 2.ª
  13: 12, // SO 2.ª → SO 1.ª
  12: 11, // SO 1.ª → ST 3.ª
  11: 10, // ST 3.ª → ST 2.ª
  10: 9, // ST 2.ª → ST 1.ª
  9: 8, // ST 1.ª → Brigadier
  8: 7, // Brigadier → SO Superior
}

export function normalizeHierarchyValue(value: number): number {
  return LEGACY_SUBOFICIAL_HIERARCHIES.has(value) ? 5 : value
}

export function hierarchyLabel(value: number | string | null | undefined): string {
  if (value == null) return '—'
  if (typeof value === 'string') {
    const byKey = PROMOTION_HIERARCHY_OPTIONS.find((h) => h.key === value)
    if (byKey) return byKey.label
    if (value === 'SuboficialesSuperiores' || value === 'SuboficialesTecnicos') return 'Suboficiales'
    const num = Number(value)
    if (!Number.isNaN(num)) return hierarchyLabel(num)
    return value
  }
  const normalized = normalizeHierarchyValue(value)
  const byValue = PROMOTION_HIERARCHY_OPTIONS.find((h) => h.value === normalized)
  return byValue?.label ?? String(value)
}

export function promotionGradeLabel(value: number | string | null | undefined): string {
  if (value == null) return '—'
  const num = typeof value === 'number' ? value : Number(value)
  const byValue = PROMOTION_GRADE_OPTIONS.find((g) => g.value === num)
  if (byValue) return byValue.label
  const byKey = PROMOTION_GRADE_OPTIONS.find((g) => g.key === value)
  return byKey?.label ?? String(value)
}

export function hierarchiesForTrack(trackValue: number) {
  return PROMOTION_HIERARCHY_OPTIONS.filter((h) => h.trackValue === trackValue)
}

export function hierarchyFromGrade(gradeValue: number) {
  return PROMOTION_GRADE_OPTIONS.find((g) => g.value === gradeValue)?.hierarchy ?? null
}

/** Jerarquía del balotario según grado al que postula (determina las preguntas). */
export function hierarchyLabelFromPostulationGrade(gradeValue: number): string {
  const hierarchy = hierarchyFromGrade(gradeValue)
  return hierarchy != null ? hierarchyLabel(hierarchy) : '—'
}

/** Categoría PNP según balotario. */
export function categoryLabelFromTrack(trackValue: number): string {
  return trackValue === 2 ? 'Oficiales de Armas' : 'Suboficiales de Armas'
}

/** Clasificación completa desde grado de postulación. */
export function studentClassificationFromPostulationGrade(promotionGrade: number | null | undefined) {
  if (promotionGrade == null) return null
  const trackType = trackFromGrade(promotionGrade)
  return {
    promotionGrade,
    trackType,
    postulationLabel: promotionGradeLabel(promotionGrade),
    hierarchyLabel: hierarchyLabelFromPostulationGrade(promotionGrade),
    categoryLabel: categoryLabelFromTrack(trackType),
    trackLabel: trackLabel(trackType),
  }
}

/** Clasificación desde grado PNP actual (alta/edición admin). */
export function studentClassificationFromCurrentGrade(currentGrade: number | null | undefined) {
  if (currentGrade == null) return null
  const applied = applyCurrentGradeSelection(currentGrade)
  if (!applied) return null
  return {
    currentGrade,
    rankLabel: applied.rank,
    ...studentClassificationFromPostulationGrade(applied.promotionGrade),
  }
}

export function trackFromGrade(gradeValue: number) {
  return PROMOTION_GRADE_OPTIONS.find((g) => g.value === gradeValue)?.trackValue ?? 1
}

export function defaultHierarchyForTrack(trackValue: number): number {
  // Fallback conservador: jerarquía base del balotario (Subalternos / Suboficiales).
  return trackValue === 2 ? 1 : 5
}

export function parseGradeKey(value: string | null | undefined): number | null {
  if (!value) return null
  const byKey = PROMOTION_GRADE_OPTIONS.find((g) => g.key === value)
  if (byKey) return byKey.value
  const num = Number(value)
  return PROMOTION_GRADE_OPTIONS.some((g) => g.value === num) ? num : null
}

export function parseHierarchyKey(value: string | null | undefined): number | null {
  if (!value) return null
  if (value === 'SuboficialesSuperiores' || value === 'SuboficialesTecnicos') return 5
  const byKey = PROMOTION_HIERARCHY_OPTIONS.find((h) => h.key === value)
  if (byKey) return byKey.value
  const num = Number(value)
  if (Number.isNaN(num)) return null
  if (LEGACY_SUBOFICIAL_HIERARCHIES.has(num)) return 5
  return PROMOTION_HIERARCHY_OPTIONS.some((h) => h.value === num) ? num : null
}

function normalizeGradeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/º|°/g, '.')
}

/** Parsea grado PNP actual desde texto libre (ej. ALFEREZ PNP). */
export function parseCurrentGradeFromText(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const normalized = normalizeGradeText(value.trim())
  if (normalized.includes('teniente general') || (normalized.includes('general') && !normalized.includes('suboficial'))) {
    return null
  }
  for (const g of PROMOTION_GRADE_OPTIONS) {
    const label = normalizeGradeText(g.label)
    if (normalized === label || normalized.includes(label) || label.includes(normalized)) {
      return g.value
    }
  }
  return null
}

/** Grado actual → grado al que postula. */
export function postulationGradeFromCurrent(currentGradeValue: number): number | null {
  return POSTULATION_BY_CURRENT[currentGradeValue] ?? null
}

/** Grados PNP actuales en menú desplegable (orden descendente). */
export const CURRENT_GRADE_SELECT_OPTIONS = [
  { value: 6, label: 'CORONEL' },
  { value: 5, label: 'COMANDANTE' },
  { value: 4, label: 'MAYOR' },
  { value: 3, label: 'CAPITAN' },
  { value: 2, label: 'TENIENTE' },
  { value: 1, label: 'ALFEREZ' },
  { value: 7, label: 'SUPERIOR' },
  { value: 8, label: 'BRIGADIER' },
  { value: 9, label: 'TECNICO DE 1RA' },
  { value: 10, label: 'TECNICO DE 2DA' },
  { value: 11, label: 'TECNICO DE 3RA' },
  { value: 12, label: 'SUBOFICIAL DE 1RA' },
  { value: 13, label: 'SUBOFICIAL DE 2DA' },
  { value: 14, label: 'SUBOFICIAL DE 3RA' },
] as const

/** Grado actual → meta de postulación y balotario (Coronel/Superior = tope de escalera). */
export function resolvePostulationFromCurrentGrade(currentGradeValue: number): number | null {
  const next = postulationGradeFromCurrent(currentGradeValue)
  if (next != null) return next
  const grade = PROMOTION_GRADE_OPTIONS.find((g) => g.value === currentGradeValue)
  if (grade?.postulationTarget) return currentGradeValue
  return null
}

export function rankLabelFromCurrentGrade(currentGradeValue: number): string {
  return promotionGradeLabel(currentGradeValue)
}

export function applyCurrentGradeSelection(currentGradeValue: number) {
  const postulation = resolvePostulationFromCurrentGrade(currentGradeValue)
  if (postulation == null) return null
  return {
    currentGrade: currentGradeValue,
    rank: rankLabelFromCurrentGrade(currentGradeValue),
    promotionGrade: postulation,
    trackType: trackFromGrade(postulation),
  }
}

/** Infiere grado actual a partir del grado de postulación (edición de usuarios). */
export function inferCurrentGradeFromPostulation(postulationValue: number): number | null {
  for (const [currentStr, next] of Object.entries(POSTULATION_BY_CURRENT)) {
    if (next === postulationValue) return Number(currentStr)
  }
  const grade = PROMOTION_GRADE_OPTIONS.find((g) => g.value === postulationValue)
  if (grade?.postulationTarget) return postulationValue
  return null
}

export function postulationGradeFromCurrentRankText(rank: string | null | undefined): number | null {
  const current = parseCurrentGradeFromText(rank)
  if (current == null) return null
  return postulationGradeFromCurrent(current)
}

/** Jerarquía del balotario para exámenes y preguntas según perfil del alumno. */
export function resolveUserHierarchyValue(user?: {
  promotionHierarchy?: string | null
  promotionGrade?: string | null
  rank?: string | null
  activeTrackType?: string | null
} | null): number {
  const fromHierarchy = parseHierarchyKey(user?.promotionHierarchy ?? null)
  if (fromHierarchy) return normalizeHierarchyValue(fromHierarchy)

  const grade = parseGradeKey(user?.promotionGrade ?? null)
  if (grade) {
    const h = hierarchyFromGrade(grade)
    if (h) return h
  }

  const postulationFromRank = postulationGradeFromCurrentRankText(user?.rank)
  if (postulationFromRank != null) {
    const h = hierarchyFromGrade(postulationFromRank)
    if (h) return h
  }

  const trackValue =
    user?.activeTrackType === 'AscensosOficiales' || user?.activeTrackType === '2' ? 2 : 1
  return defaultHierarchyForTrack(trackValue)
}

export function resolveUserClassificationLabels(user?: {
  promotionHierarchy?: string | null
  promotionGrade?: string | null
  rank?: string | null
  activeTrackType?: string | null
} | null) {
  const hierarchyValue = resolveUserHierarchyValue(user)
  const trackValue = trackValueForHierarchy(hierarchyValue)
  const grade = parseGradeKey(user?.promotionGrade ?? null)
  return {
    hierarchyLabel: hierarchyLabel(hierarchyValue),
    categoryLabel: categoryLabelFromTrack(trackValue),
    postulationLabel: grade != null ? promotionGradeLabel(grade) : '—',
    trackLabel: trackLabel(trackValue),
  }
}

export function trackValueForHierarchy(hierarchyValue: number): number {
  const normalized = normalizeHierarchyValue(hierarchyValue)
  return PROMOTION_HIERARCHY_OPTIONS.find((h) => h.value === normalized)?.trackValue ?? 1
}

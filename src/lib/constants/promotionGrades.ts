/** Jerarquías del balotario (~1500 preguntas c/u). Orden: mayor a menor jerarquía. */
export const PROMOTION_HIERARCHY_OPTIONS = [
  { value: 2, key: 'OficialesSuperiores', label: 'Oficiales Superiores', trackValue: 2 },
  { value: 1, key: 'OficialesSubalternos', label: 'Oficiales Subalternos', trackValue: 2 },
  { value: 3, key: 'SuboficialesSuperiores', label: 'Suboficiales Superiores', trackValue: 1 },
  { value: 4, key: 'SuboficialesTecnicos', label: 'Suboficiales Técnicos', trackValue: 1 },
  { value: 5, key: 'Suboficiales', label: 'Suboficiales', trackValue: 1 },
] as const

export type PromotionHierarchyKey = (typeof PROMOTION_HIERARCHY_OPTIONS)[number]['key']

/**
 * Grados al que postula el alumno (meta de ascenso). Ordenado por jerarquía, mayor a menor.
 * Alférez y Suboficial de 3.ª son grados actuales, no metas de postulación.
 */
export const PROMOTION_GRADE_OPTIONS = [
  { value: 6, key: 'Coronel', label: 'Coronel', hierarchy: 2, trackValue: 2, postulationTarget: true },
  { value: 5, key: 'Comandante', label: 'Comandante', hierarchy: 2, trackValue: 2, postulationTarget: true },
  { value: 4, key: 'Mayor', label: 'Mayor', hierarchy: 2, trackValue: 2, postulationTarget: true },
  { value: 3, key: 'Capitan', label: 'Capitán', hierarchy: 1, trackValue: 2, postulationTarget: true },
  { value: 2, key: 'Teniente', label: 'Teniente', hierarchy: 1, trackValue: 2, postulationTarget: true },
  { value: 1, key: 'Alferez', label: 'Alférez', hierarchy: 1, trackValue: 2, postulationTarget: false },
  { value: 7, key: 'SuboficialSuperior', label: 'Suboficial Superior', hierarchy: 3, trackValue: 1, postulationTarget: true },
  { value: 8, key: 'SuboficialBrigadier', label: 'Suboficial Brigadier', hierarchy: 3, trackValue: 1, postulationTarget: true },
  { value: 9, key: 'SuboficialTecnicoPrimera', label: 'Suboficial Técnico de 1.ª', hierarchy: 4, trackValue: 1, postulationTarget: true },
  { value: 10, key: 'SuboficialTecnicoSegunda', label: 'Suboficial Técnico de 2.ª', hierarchy: 4, trackValue: 1, postulationTarget: true },
  { value: 11, key: 'SuboficialTecnicoTercera', label: 'Suboficial Técnico de 3.ª', hierarchy: 4, trackValue: 1, postulationTarget: true },
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

export function hierarchyLabel(value: number | string | null | undefined): string {
  if (value == null) return '—'
  const num = typeof value === 'number' ? value : Number(value)
  const byValue = PROMOTION_HIERARCHY_OPTIONS.find((h) => h.value === num)
  if (byValue) return byValue.label
  const byKey = PROMOTION_HIERARCHY_OPTIONS.find((h) => h.key === value)
  return byKey?.label ?? String(value)
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

export function gradesForTrack(trackValue: number) {
  return PROMOTION_GRADE_OPTIONS.filter((g) => g.trackValue === trackValue && g.postulationTarget)
}

export function gradesForHierarchy(hierarchyValue: number) {
  return PROMOTION_GRADE_OPTIONS.filter(
    (g) => g.hierarchy === hierarchyValue && g.postulationTarget
  )
}

export function hierarchyFromGrade(gradeValue: number) {
  return PROMOTION_GRADE_OPTIONS.find((g) => g.value === gradeValue)?.hierarchy ?? null
}

export function trackFromGrade(gradeValue: number) {
  return PROMOTION_GRADE_OPTIONS.find((g) => g.value === gradeValue)?.trackValue ?? 1
}

export function defaultHierarchyForTrack(trackValue: number): number {
  // Fallback conservador: jerarquía base del balotario (Subalternos / Suboficiales).
  return trackValue === 2 ? 1 : 5
}

export function defaultPostulationGradeForTrack(trackValue: number): number {
  return trackValue === 2 ? 2 : 13 // Teniente / Suboficial de 2.ª
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
  const byKey = PROMOTION_HIERARCHY_OPTIONS.find((h) => h.key === value)
  if (byKey) return byKey.value
  const num = Number(value)
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

export function postulationGradeFromCurrentRankText(rank: string | null | undefined): number | null {
  const current = parseCurrentGradeFromText(rank)
  if (current == null) return null
  return postulationGradeFromCurrent(current)
}

/** Jerarquía del balotario para listar categorías según perfil del alumno. */
export function resolveUserHierarchyValue(user?: {
  promotionHierarchy?: string | null
  promotionGrade?: string | null
  activeTrackType?: string | null
} | null): number {
  const fromHierarchy = parseHierarchyKey(user?.promotionHierarchy ?? null)
  if (fromHierarchy) return fromHierarchy

  const grade = parseGradeKey(user?.promotionGrade ?? null)
  if (grade) {
    const h = hierarchyFromGrade(grade)
    if (h) return h
  }

  const trackValue =
    user?.activeTrackType === 'AscensosOficiales' || user?.activeTrackType === '2' ? 2 : 1
  return defaultHierarchyForTrack(trackValue)
}

export function trackValueForHierarchy(hierarchyValue: number): number {
  return PROMOTION_HIERARCHY_OPTIONS.find((h) => h.value === hierarchyValue)?.trackValue ?? 1
}

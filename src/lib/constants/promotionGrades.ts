/** Jerarquías del balotario (~1500 preguntas c/u). */
export const PROMOTION_HIERARCHY_OPTIONS = [
  { value: 1, key: 'OficialesSubalternos', label: 'Oficiales Subalternos', trackValue: 2 },
  { value: 2, key: 'OficialesSuperiores', label: 'Oficiales Superiores', trackValue: 2 },
  { value: 3, key: 'SuboficialesSuperiores', label: 'Suboficiales Superiores', trackValue: 1 },
  { value: 4, key: 'SuboficialesTecnicos', label: 'Suboficiales Técnicos', trackValue: 1 },
  { value: 5, key: 'Suboficiales', label: 'Suboficiales', trackValue: 1 },
] as const

export type PromotionHierarchyKey = (typeof PROMOTION_HIERARCHY_OPTIONS)[number]['key']

/** Grados al que postula el alumno (determina jerarquía del balotario). */
export const PROMOTION_GRADE_OPTIONS = [
  { value: 1, key: 'Alferez', label: 'Alférez', hierarchy: 1, trackValue: 2 },
  { value: 2, key: 'Teniente', label: 'Teniente', hierarchy: 1, trackValue: 2 },
  { value: 3, key: 'Capitan', label: 'Capitán', hierarchy: 1, trackValue: 2 },
  { value: 4, key: 'Mayor', label: 'Mayor', hierarchy: 2, trackValue: 2 },
  { value: 5, key: 'Comandante', label: 'Comandante', hierarchy: 2, trackValue: 2 },
  { value: 6, key: 'Coronel', label: 'Coronel', hierarchy: 2, trackValue: 2 },
  { value: 7, key: 'SuboficialSuperior', label: 'Suboficial Superior', hierarchy: 3, trackValue: 1 },
  { value: 8, key: 'SuboficialBrigadier', label: 'Suboficial Brigadier', hierarchy: 3, trackValue: 1 },
  { value: 9, key: 'SuboficialTecnicoPrimera', label: 'Suboficial Técnico de 1.ª', hierarchy: 4, trackValue: 1 },
  { value: 10, key: 'SuboficialTecnicoSegunda', label: 'Suboficial Técnico de 2.ª', hierarchy: 4, trackValue: 1 },
  { value: 11, key: 'SuboficialTecnicoTercera', label: 'Suboficial Técnico de 3.ª', hierarchy: 4, trackValue: 1 },
  { value: 12, key: 'SuboficialPrimera', label: 'Suboficial de 1.ª', hierarchy: 5, trackValue: 1 },
  { value: 13, key: 'SuboficialSegunda', label: 'Suboficial de 2.ª', hierarchy: 5, trackValue: 1 },
  { value: 14, key: 'SuboficialTercera', label: 'Suboficial de 3.ª', hierarchy: 5, trackValue: 1 },
] as const

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
  return PROMOTION_GRADE_OPTIONS.filter((g) => g.trackValue === trackValue)
}

export function gradesForHierarchy(hierarchyValue: number) {
  return PROMOTION_GRADE_OPTIONS.filter((g) => g.hierarchy === hierarchyValue)
}

export function hierarchyFromGrade(gradeValue: number) {
  return PROMOTION_GRADE_OPTIONS.find((g) => g.value === gradeValue)?.hierarchy ?? null
}

export function trackFromGrade(gradeValue: number) {
  return PROMOTION_GRADE_OPTIONS.find((g) => g.value === gradeValue)?.trackValue ?? 1
}

export function defaultHierarchyForTrack(trackValue: number): number {
  return hierarchiesForTrack(trackValue)[0]?.value ?? 1
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

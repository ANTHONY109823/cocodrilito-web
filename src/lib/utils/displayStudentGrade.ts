import { parseCurrentGradeFromText, promotionGradeLabel } from '@/lib/constants/promotionGrades'

/** Grado PNP actual del alumno para mostrar en UI (ej. Alférez, Suboficial de 3.ª). */
export function displayStudentGrade(rank?: string | null): string {
  const trimmed = rank?.trim()
  if (!trimmed) return 'Estudiante'

  const parsed = parseCurrentGradeFromText(trimmed)
  if (parsed != null) {
    const label = promotionGradeLabel(parsed)
    if (label !== '—') return label
  }

  return trimmed
}

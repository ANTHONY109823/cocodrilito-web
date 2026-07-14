export type ExamLevelKey = 'Basico' | 'Intermedio' | 'Avanzado'

export const EXAM_LEVELS = [
  {
    key: 'Basico' as const,
    label: 'BÁSICO',
    subtitle: 'Entrena con feedback · +1 pt/acierto',
    counts: [15, 25, 50] as const,
    defaultCount: 25,
  },
  {
    key: 'Intermedio' as const,
    label: 'INTERMEDIO',
    subtitle: 'Simulacro oficial: sin revelar · +2 pts/acierto',
    counts: [25, 50, 100] as const,
    defaultCount: 100,
  },
  {
    key: 'Avanzado' as const,
    label: 'AVANZADO',
    subtitle: 'Mezcla total · +5 pts/acierto',
    counts: [25, 50, 100] as const,
    defaultCount: 100,
  },
] as const

export function countsForLevel(level: ExamLevelKey): readonly number[] {
  return EXAM_LEVELS.find((l) => l.key === level)?.counts ?? [25, 50, 100]
}

export function defaultCountForLevel(level: ExamLevelKey): number {
  return EXAM_LEVELS.find((l) => l.key === level)?.defaultCount ?? 100
}

/** Nivel entrenamiento (antes Pollito): feedback inmediato; sí suma progreso. */
export function isBasicoLevel(level?: string | null): boolean {
  const v = (level ?? '').toLowerCase()
  return (
    v === 'basico' ||
    v === 'básico' ||
    v === 'pollito' ||
    v === 'easy' ||
    v === 'facil' ||
    v === 'fácil'
  )
}

/** @deprecated usar isBasicoLevel */
export function isPollitoLevel(level?: string | null): boolean {
  return isBasicoLevel(level)
}

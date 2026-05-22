export interface ExamSessionMeta {
  practiceCategory?: string | null
  totalQuestions: number
  examTitle: string
}

export function saveExamSessionMeta(sessionId: string, data: Record<string, unknown>, category?: string) {
  const practiceCategory =
    (data.practiceCategory as string | undefined) ??
    (data.PracticeCategory as string | undefined) ??
    category ??
    null

  const rawTotal = data.totalQuestions ?? data.TotalQuestions
  const questions = (data.questions ?? data.Questions) as unknown[] | undefined
  const totalQuestions =
    typeof rawTotal === 'number'
      ? rawTotal
      : Array.isArray(questions)
        ? questions.length
        : 0

  const meta: ExamSessionMeta = {
    practiceCategory,
    totalQuestions,
    examTitle: buildExamDisplayTitle(practiceCategory, data.examTitle ?? data.ExamTitle, totalQuestions),
  }

  try {
    sessionStorage.setItem(`exam_meta_${sessionId}`, JSON.stringify(meta))
  } catch {
    /* ignore quota */
  }
}

export function loadExamSessionMeta(sessionId: string): ExamSessionMeta | null {
  try {
    const raw = sessionStorage.getItem(`exam_meta_${sessionId}`)
    if (!raw) return null
    return JSON.parse(raw) as ExamSessionMeta
  } catch {
    return null
  }
}

export function buildExamDisplayTitle(
  practiceCategory: string | null | undefined,
  examTitle: unknown,
  totalQuestions: number
): string {
  if (practiceCategory) return practiceCategory

  const title = typeof examTitle === 'string' ? examTitle : ''
  if (title.toLowerCase().includes('simulacro') || title.toLowerCase().includes('examen general'))
    return title

  return `Examen General — Simulacro (${totalQuestions} preguntas)`
}

export function getEffectiveQuestionCount(totalQuestions: number, loadedCount: number): number {
  if (totalQuestions > 0 && loadedCount > 0) return Math.min(totalQuestions, loadedCount)
  return totalQuestions || loadedCount
}

export function normalizeExamSessionPayload(data: Record<string, unknown>): ExamSessionMeta {
  const practiceCategory =
    (data.practiceCategory as string | undefined) ??
    (data.PracticeCategory as string | undefined) ??
    null

  const questions = (data.questions ?? data.Questions) as unknown[] | undefined
  const rawTotal = data.totalQuestions ?? data.TotalQuestions
  const fromList = Array.isArray(questions) ? questions.length : 0
  const totalQuestions = typeof rawTotal === 'number' && rawTotal > 0 ? rawTotal : fromList

  return {
    practiceCategory,
    totalQuestions,
    examTitle: buildExamDisplayTitle(practiceCategory, data.examTitle ?? data.ExamTitle, totalQuestions),
  }
}

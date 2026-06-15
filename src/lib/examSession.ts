export interface ExamSessionMeta {
  practiceCategory?: string | null
  totalQuestions: number
  examTitle: string
}

export interface CachedExamSession {
  sessionId: string
  examTitle: string
  practiceCategory: string | null
  totalQuestions: number
  timeLimitSeconds: number
  startedAt: string
  status?: string
  questions: {
    id: string
    questionText: string
    orderIndex: number
    category: string
    options: { id: string; optionText: string; optionIndex: number }[]
  }[]
}

function mapQuestionsFromPayload(data: Record<string, unknown>) {
  const raw = (data.questions ?? data.Questions) as Array<{
    id: string
    questionText: string
    orderIndex: number
    categoryName?: string
    category?: string
    options?: { id: string; optionText: string; optionIndex: number }[]
    answerOptions?: { id: string; optionText: string; optionIndex: number }[]
  }> | undefined

  return (raw ?? []).map((q) => ({
    id: q.id,
    questionText: q.questionText,
    orderIndex: q.orderIndex,
    category: q.categoryName || q.category || '',
    options: (q.options || q.answerOptions || []).map((o) => ({
      id: o.id,
      optionText: o.optionText,
      optionIndex: o.optionIndex,
    })),
  }))
}

export function saveExamSessionCache(sessionId: string, data: Record<string, unknown>) {
  const questions = mapQuestionsFromPayload(data)
  if (questions.length === 0) return

  const meta = normalizeExamSessionPayload(data)
  const cache: CachedExamSession = {
    sessionId,
    examTitle: meta.examTitle,
    practiceCategory: meta.practiceCategory ?? null,
    totalQuestions: meta.totalQuestions,
    timeLimitSeconds:
      (data.timeLimitSeconds as number | undefined) ??
      (data.TimeLimitSeconds as number | undefined) ??
      3600,
    startedAt:
      (data.startedAt as string | undefined) ??
      (data.StartedAt as string | undefined) ??
      new Date().toISOString(),
    status: (data.status as string | undefined) ?? (data.Status as string | undefined),
    questions,
  }

  try {
    sessionStorage.setItem(`exam_cache_${sessionId}`, JSON.stringify(cache))
  } catch {
    /* ignore quota */
  }
}

export function loadExamSessionCache(sessionId: string): CachedExamSession | null {
  try {
    const raw = sessionStorage.getItem(`exam_cache_${sessionId}`)
    if (!raw) return null
    return JSON.parse(raw) as CachedExamSession
  } catch {
    return null
  }
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

  saveExamSessionCache(sessionId, data)
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

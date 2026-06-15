import type { Question } from '@/components/admin/preguntas/types'

/** Acepta respuestas camelCase o PascalCase del API .NET. */
export function normalizeQuestion(raw: Record<string, unknown>): Question {
  const answerOptions = raw.answerOptions ?? raw.AnswerOptions
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    questionText: String(raw.questionText ?? raw.QuestionText ?? ''),
    category: String(raw.category ?? raw.Category ?? ''),
    difficulty: Number(raw.difficulty ?? raw.Difficulty ?? 1),
    status: String(raw.status ?? raw.Status ?? ''),
    yearValuation: Number(raw.yearValuation ?? raw.YearValuation ?? 0),
    trackType:
      raw.trackType != null
        ? String(raw.trackType)
        : raw.TrackType != null
          ? String(raw.TrackType)
          : null,
    tenantId:
      raw.tenantId != null
        ? String(raw.tenantId)
        : raw.TenantId != null
          ? String(raw.TenantId)
          : null,
    explanation:
      raw.explanation != null
        ? String(raw.explanation)
        : raw.Explanation != null
          ? String(raw.Explanation)
          : null,
    answerOptions: Array.isArray(answerOptions)
      ? answerOptions.map((opt) => {
          const o = opt as Record<string, unknown>
          return {
            id: String(o.id ?? o.Id ?? ''),
            optionText: String(o.optionText ?? o.OptionText ?? ''),
            isCorrect: Boolean(o.isCorrect ?? o.IsCorrect),
            optionIndex: Number(o.optionIndex ?? o.OptionIndex ?? 0),
          }
        })
      : undefined,
  }
}

export function parseQuestionsResponse(data: unknown): Question[] {
  if (Array.isArray(data)) return data.map((row) => normalizeQuestion(row as Record<string, unknown>))
  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>
    const items = payload.items ?? payload.Items
    if (Array.isArray(items)) {
      return items.map((row) => normalizeQuestion(row as Record<string, unknown>))
    }
  }
  return []
}

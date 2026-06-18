import type { ScopedMutator } from 'swr'
import { ASCENSO_TRACK_OPTIONS } from '@/lib/constants/trackTypes'
import { defaultHierarchyForTrack } from '@/lib/constants/promotionGrades'
import { swrFetcher } from '@/lib/swr/fetcher'
import type { QuestionCountsData } from '@/hooks/useQuestionCounts'

/** Precarga conteos por balotario y jerarquía por defecto (cambio instantáneo en preview). */
export function prefetchAscensoQuestionCounts(mutate: ScopedMutator) {
  for (const track of ASCENSO_TRACK_OPTIONS) {
    const hierarchy = defaultHierarchyForTrack(track.value)
    const key = `/exams/question-counts?track=${encodeURIComponent(track.key)}&hierarchy=${hierarchy}`
    void mutate(key, () => swrFetcher<QuestionCountsData>(key), { revalidate: false })
  }
}

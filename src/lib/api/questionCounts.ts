import type { ScopedMutator } from 'swr'
import { ASCENSO_TRACK_OPTIONS } from '@/lib/constants/trackTypes'
import { swrFetcher } from '@/lib/swr/fetcher'
import type { QuestionCountsData } from '@/hooks/useQuestionCounts'

/** Precarga conteos Suboficiales + Oficiales para cambio instantáneo de balotario. */
export function prefetchAscensoQuestionCounts(mutate: ScopedMutator) {
  for (const track of ASCENSO_TRACK_OPTIONS) {
    const key = `/exams/question-counts?track=${encodeURIComponent(track.key)}`
    void mutate(key, () => swrFetcher<QuestionCountsData>(key), { revalidate: false })
  }
}

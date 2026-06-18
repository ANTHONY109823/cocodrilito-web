'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'

export interface QuestionCountsData {
  total: number
  track?: string
  withExplanation?: number
  withoutExplanation?: number
  needsReview?: number
  byCategory: { category: string; count: number; missingExplanation?: number }[]
}

export interface UseQuestionCountsOptions {
  /** Evita mostrar totales de otra jerarquía/balotario mientras carga. */
  keepPreviousData?: boolean
}

export function useQuestionCounts(
  track?: string | null,
  hierarchy?: string | number | null,
  options?: UseQuestionCountsOptions
) {
  const trackKey = track?.trim() || null
  const hierarchyKey = hierarchy != null && hierarchy !== '' ? String(hierarchy) : null
  const swrKey = trackKey
    ? hierarchyKey
      ? `/exams/question-counts?track=${encodeURIComponent(trackKey)}&hierarchy=${encodeURIComponent(hierarchyKey)}`
      : `/exams/question-counts?track=${encodeURIComponent(trackKey)}`
    : '/exams/question-counts'

  const { data, error, isLoading, isValidating, mutate } = useSWR<QuestionCountsData>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: options?.keepPreviousData ?? true,
      revalidateOnFocus: false,
      dedupingInterval: 120_000,
      revalidateIfStale: false,
    }
  )

  const counts: Record<string, number> = {}
  const missingByCategory: Record<string, number> = {}
  ;(data?.byCategory ?? []).forEach((row) => {
    counts[row.category] = row.count
    if (row.missingExplanation != null) {
      missingByCategory[row.category] = row.missingExplanation
    }
  })

  return {
    total: data?.total ?? 0,
    byCategory: counts,
    missingByCategory,
    withExplanation: data?.withExplanation ?? 0,
    withoutExplanation: data?.withoutExplanation ?? 0,
    needsReview: data?.needsReview ?? 0,
    isLoading: isLoading && !data,
    isValidating,
    error,
    refresh: mutate,
  }
}

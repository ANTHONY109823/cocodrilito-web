'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'

export interface QuestionCountsData {
  total: number
  track?: string
  byCategory: { category: string; count: number }[]
}

export function useQuestionCounts(track?: string | null) {
  const trackKey = track?.trim() || null
  const swrKey = trackKey
    ? `/exams/question-counts?track=${encodeURIComponent(trackKey)}`
    : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<QuestionCountsData>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
    }
  )

  const counts: Record<string, number> = {}
  ;(data?.byCategory ?? []).forEach((row) => {
    counts[row.category] = row.count
  })

  return {
    total: data?.total ?? 0,
    byCategory: counts,
    isLoading: isLoading && !data,
    isValidating,
    error,
    refresh: mutate,
  }
}

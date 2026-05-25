'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'

export interface QuestionCountsData {
  total: number
  byCategory: { category: string; count: number }[]
}

export function useQuestionCounts() {
  const { data, error, isLoading, mutate } = useSWR<QuestionCountsData>(
    '/exams/question-counts',
    swrFetcher
  )
  const counts: Record<string, number> = {}
  ;(data?.byCategory ?? []).forEach((row) => {
    counts[row.category] = row.count
  })
  return {
    total: data?.total ?? 0,
    byCategory: counts,
    isLoading,
    error,
    refresh: mutate,
  }
}

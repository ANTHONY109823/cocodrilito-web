'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'

export interface RankingEntry {
  rank: number
  userId: string
  fullName: string
  score: number
  examsCompleted?: number
}

export function useRanking(period = 'weekly') {
  const { data, error, isLoading, mutate } = useSWR<RankingEntry[]>(
    `/rankings/global?period=${period}`,
    swrFetcher
  )
  return {
    ranking: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

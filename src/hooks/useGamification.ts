'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'

export interface GamificationStatus {
  level?: number
  xp?: number
  streak?: number
  league?: string
  badges?: string[]
}

export function useGamification() {
  const { data, error, isLoading, mutate } = useSWR<GamificationStatus>(
    '/gamification/me',
    swrFetcher
  )
  return {
    status: data ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}

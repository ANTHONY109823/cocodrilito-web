'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'

export function useStudentDashboard() {
  const swrOpts = {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  }

  const { data: gami, error: gamiError, isLoading: gamiLoading } = useSWR(
    '/gamification/me',
    swrFetcher,
    swrOpts
  )
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR(
    '/exams/sessions/stats',
    swrFetcher,
    swrOpts
  )
  const { data: latest, error: latestError, isLoading: latestLoading } = useSWR(
    '/exams/sessions/latest',
    swrFetcher,
    swrOpts
  )
  const { data: history, error: historyError } = useSWR(
    '/exams/sessions/history?limit=7',
    swrFetcher,
    swrOpts
  )
  const { data: ranking, error: rankingError } = useSWR(
    '/rankings/me?period=weekly',
    swrFetcher,
    swrOpts
  )

  const historyItems = Array.isArray(history) ? history : (history as { items?: unknown[] })?.items ?? []
  const chartScores = historyItems
    .slice(0, 7)
    .reverse()
    .map((entry: { score: number }) => entry.score)

  const loading = gamiLoading && statsLoading && latestLoading && !gami && !stats && !latest
  const error = gamiError || statsError || latestError || historyError || rankingError

  return {
    gami,
    stats,
    latest,
    myRanking: ranking,
    chartScores,
    loading,
    error,
  }
}

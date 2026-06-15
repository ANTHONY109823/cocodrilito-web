'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'
import { getLeague } from '@/lib/utils/league'

export interface RankingEntry {
  position: number
  userId: string
  fullName: string
  rank: string
  unit: string
  averageScore: number
  examsCompleted: number
  bestScore: number
  currentLeague: string
}

export interface MyRanking {
  position: number
  averageScore: number
  examsCompleted: number
  bestScore: number
  currentLeague: string
}

interface GlobalRankingResponse {
  entries?: ApiRankingEntry[]
  Entries?: ApiRankingEntry[]
}

interface ApiRankingEntry {
  position?: number
  Position?: number
  userId?: string
  UserId?: string
  fullName?: string
  FullName?: string
  rank?: string
  Rank?: string
  unit?: string
  Unit?: string
  averageScore?: number
  AverageScore?: number
  examsCompleted?: number
  ExamsCompleted?: number
  bestScore?: number
  BestScore?: number
}

interface MyRankingResponse {
  position?: number
  Position?: number
  averageScore?: number
  AverageScore?: number
  examsCompleted?: number
  ExamsCompleted?: number
  bestScore?: number
  BestScore?: number
}

function mapEntry(raw: ApiRankingEntry): RankingEntry {
  const bestScore = raw.bestScore ?? raw.BestScore ?? 0
  return {
    position: raw.position ?? raw.Position ?? 0,
    userId: String(raw.userId ?? raw.UserId ?? ''),
    fullName: raw.fullName ?? raw.FullName ?? 'Usuario',
    rank: raw.rank ?? raw.Rank ?? '',
    unit: raw.unit ?? raw.Unit ?? '',
    averageScore: raw.averageScore ?? raw.AverageScore ?? 0,
    examsCompleted: raw.examsCompleted ?? raw.ExamsCompleted ?? 0,
    bestScore,
    currentLeague: getLeague(bestScore),
  }
}

function mapMyRanking(raw: MyRankingResponse | null | undefined): MyRanking | null {
  if (!raw) return null
  const bestScore = raw.bestScore ?? raw.BestScore ?? 0
  return {
    position: raw.position ?? raw.Position ?? 0,
    averageScore: raw.averageScore ?? raw.AverageScore ?? 0,
    examsCompleted: raw.examsCompleted ?? raw.ExamsCompleted ?? 0,
    bestScore,
    currentLeague: getLeague(bestScore),
  }
}

function extractEntries(data: GlobalRankingResponse | ApiRankingEntry[] | null | undefined): RankingEntry[] {
  if (!data) return []
  if (Array.isArray(data)) return data.map(mapEntry)
  const entries = data.entries ?? data.Entries ?? []
  return entries.map(mapEntry)
}

export function useRanking(period = 'weekly') {
  const {
    data: globalData,
    error: globalError,
    isLoading: globalLoading,
    mutate: refreshGlobal,
  } = useSWR<GlobalRankingResponse | ApiRankingEntry[]>(
    `/rankings/global?period=${period}`,
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 120_000 }
  )

  const {
    data: myData,
    error: myError,
    isLoading: myLoading,
    mutate: refreshMy,
  } = useSWR<MyRankingResponse>(`/rankings/me?period=${period}`, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120_000,
  })

  const ranking = extractEntries(globalData)
  const myRanking = mapMyRanking(myData)
  const isLoading = globalLoading || myLoading
  const error = globalError ?? myError

  return {
    ranking,
    myRanking,
    isLoading,
    error,
    refresh: () => {
      void refreshGlobal()
      void refreshMy()
    },
  }
}

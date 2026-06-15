'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'

export interface ExamListItem {
  id: string
  title: string
  timeLimitSeconds: number
  passingScore: number
}

export function useExamList() {
  const { data, error, isLoading, mutate } = useSWR<ExamListItem[]>('/exams/list', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120_000,
  })
  const exams = (data ?? []).map((e) => ({
    ...e,
    id: e.id || (e as ExamListItem & { Id?: string }).Id || '',
  }))
  return { exams, isLoading, error, refresh: mutate }
}

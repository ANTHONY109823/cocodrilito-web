'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'

export interface Category {
  id: string
  name: string
  color: string
  orderIndex: number
}

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<Category[]>('/categories', swrFetcher)
  return {
    categories: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

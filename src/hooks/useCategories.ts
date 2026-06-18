'use client'

import useSWR from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'

export interface Category {
  id: string
  name: string
  color: string
  orderIndex: number
  trackType?: number
  promotionHierarchy?: number
}

export function categoriesApiPath(trackType: number, promotionHierarchy: number) {
  return `/categories?trackType=${trackType}&promotionHierarchy=${promotionHierarchy}`
}

export function useCategories(trackType: number, promotionHierarchy: number) {
  const key = categoriesApiPath(trackType, promotionHierarchy)
  const { data, error, isLoading, mutate } = useSWR<Category[]>(key, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120_000,
  })
  return {
    categories: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  }
}

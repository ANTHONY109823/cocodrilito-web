import apiClient from '@/lib/api/client'

export const swrFetcher = <T,>(url: string): Promise<T> =>
  apiClient.get<T>(url).then((res) => res.data)

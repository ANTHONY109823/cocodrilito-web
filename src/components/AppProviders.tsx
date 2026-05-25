'use client'

import { SWRConfig } from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'
import { ToastContainer } from '@/components/Toast'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
      <ToastContainer />
    </SWRConfig>
  )
}

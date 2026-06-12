'use client'

import { SWRConfig } from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'
import { ToastContainer } from '@/components/Toast'
import { TenantFaviconManager } from '@/components/tenant/TenantFaviconManager'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <TenantFaviconManager />
      {children}
      <ToastContainer />
    </SWRConfig>
  )
}

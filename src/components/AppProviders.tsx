'use client'

import { SWRConfig } from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'
import { ToastContainer } from '@/components/Toast'
import { ColorSchemeProvider } from '@/components/ColorSchemeProvider'
import { GlobalThemeToggle } from '@/components/GlobalThemeToggle'
import { TenantFaviconManager } from '@/components/tenant/TenantFaviconManager'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 5_000,
        keepPreviousData: true,
      }}
    >
      <ColorSchemeProvider>
        <TenantFaviconManager />
        {children}
        <GlobalThemeToggle />
        <ToastContainer />
      </ColorSchemeProvider>
    </SWRConfig>
  )
}

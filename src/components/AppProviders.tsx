'use client'

import { SWRConfig } from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'
import { ToastContainer } from '@/components/Toast'
import { ColorSchemeProvider } from '@/components/ColorSchemeProvider'
import { GlobalThemeToggle } from '@/components/GlobalThemeToggle'

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
        {children}
        <GlobalThemeToggle />
        <ToastContainer />
      </ColorSchemeProvider>
    </SWRConfig>
  )
}

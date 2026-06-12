'use client'

import { createContext, useContext } from 'react'
import type { TenantConfig } from '@/lib/api/tenants'

interface TenantLoginBootstrapValue {
  slug: string | null
  initialConfig: TenantConfig | null
}

const TenantLoginBootstrapContext = createContext<TenantLoginBootstrapValue>({
  slug: null,
  initialConfig: null,
})

export function TenantLoginBootstrap({
  slug,
  initialConfig,
  children,
}: {
  slug: string | null
  initialConfig: TenantConfig | null
  children: React.ReactNode
}) {
  return (
    <TenantLoginBootstrapContext.Provider value={{ slug, initialConfig }}>
      {children}
    </TenantLoginBootstrapContext.Provider>
  )
}

export function useTenantLoginBootstrap() {
  return useContext(TenantLoginBootstrapContext)
}

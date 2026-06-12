'use client'

import { Suspense } from 'react'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useTenantConfig } from '@/hooks/useTenantConfig'
import { useTenantFavicon } from '@/hooks/useTenantFavicon'
import { useAuthStore } from '@/lib/store/authStore'

function TenantFaviconInner() {
  const slug = useTenantSlug()
  const { user } = useAuthStore()
  const { config, loading } = useTenantConfig(slug)

  const logoUrl = user?.tenantLogoUrl ?? config?.logoUrl ?? null
  const pending = Boolean(slug) && loading && !logoUrl

  useTenantFavicon(logoUrl, Boolean(slug), pending)

  return null
}

/** Mantiene el favicon de la agencia en login, dashboard y todas las rutas del subdominio. */
export function TenantFaviconManager() {
  return (
    <Suspense fallback={null}>
      <TenantFaviconInner />
    </Suspense>
  )
}

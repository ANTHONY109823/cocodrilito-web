'use client'

import { Suspense, useEffect } from 'react'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useTenantConfig } from '@/hooks/useTenantConfig'
import { useTenantFavicon } from '@/hooks/useTenantFavicon'
import { useAuthStore } from '@/lib/store/authStore'

function TenantFaviconInner() {
  const hostSlug = useTenantSlug()
  const { user, loadFromStorage } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const tenantSlug = user?.tenantSlug ?? hostSlug
  const { config, loading } = useTenantConfig(tenantSlug)

  const logoUrl = user?.tenantLogoUrl ?? config?.logoUrl ?? null
  const pending = Boolean(tenantSlug) && loading && !logoUrl

  useTenantFavicon(logoUrl, Boolean(tenantSlug), pending)

  return null
}

/**
 * Favicon de la agencia/academia en todas las rutas del subdominio:
 * login, admin, dashboard de alumnos, exámenes, historial, ranking, etc.
 */
export function TenantFaviconManager() {
  return (
    <Suspense fallback={null}>
      <TenantFaviconInner />
    </Suspense>
  )
}

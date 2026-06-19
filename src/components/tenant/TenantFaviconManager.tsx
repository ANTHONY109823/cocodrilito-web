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
  const { loading } = useTenantConfig(tenantSlug)
  const pending = Boolean(tenantSlug) && loading

  useTenantFavicon(Boolean(tenantSlug), pending)

  return null
}

/**
 * Favicon de la agencia en todas las rutas del subdominio (login, admin, exámenes, etc.).
 */
export function TenantFaviconManager() {
  return (
    <Suspense fallback={null}>
      <TenantFaviconInner />
    </Suspense>
  )
}

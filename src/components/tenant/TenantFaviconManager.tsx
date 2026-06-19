'use client'

import { Suspense, useEffect } from 'react'
import { useTenantSlug } from '@/hooks/useTenantSlug'
import { useTenantConfig } from '@/hooks/useTenantConfig'
import { useTenantFavicon } from '@/hooks/useTenantFavicon'
import { useAuthStore } from '@/lib/store/authStore'
import { getTenantSlugFromHost, isRootHost } from '@/lib/utils/tenantHost'
import { readTenantSlugCookieClient } from '@/lib/utils/tenantSlugCookie'
import { resolveTenantAssetUrl } from '@/lib/utils/resolveTenantAssetUrl'

function TenantFaviconInner() {
  const hostSlug = useTenantSlug()
  const { user, loadFromStorage } = useAuthStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const tenantSlug = user?.tenantSlug ?? hostSlug ?? readTenantSlugCookieClient()
  const onTenantHost =
    Boolean(hostSlug) ||
    Boolean(readTenantSlugCookieClient()) ||
    (!isRootHost() && Boolean(getTenantSlugFromHost()))

  const { config, loading } = useTenantConfig(tenantSlug)
  const logoHref = resolveTenantAssetUrl(config?.logoUrl)

  useTenantFavicon(tenantSlug, logoHref, onTenantHost, Boolean(tenantSlug) && loading)

  return null
}

/** Refuerza favicon de agencia tras login y en navegación SPA del dashboard. */
export function TenantFaviconManager() {
  return (
    <Suspense fallback={null}>
      <TenantFaviconInner />
    </Suspense>
  )
}

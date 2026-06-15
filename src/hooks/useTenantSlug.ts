'use client'

import { getTenantSlugFromHost, isRootHost } from '@/lib/utils/tenantHost'

/**
 * Slug del tenant según subdominio (ej. jraasecurity.simulacros.pe).
 * Resolución síncrona en el primer render (sin useSearchParams / Suspense).
 */
export function useTenantSlug(): string | null {
  if (typeof window === 'undefined') return null

  if (isRootHost(window.location.hostname)) {
    return null
  }

  const fromHost = getTenantSlugFromHost()
  if (fromHost) return fromHost

  return new URLSearchParams(window.location.search).get('tenant_slug')
}

'use client'

import { getTenantSlugFromHost, isRootHost } from '@/lib/utils/tenantHost'
import { readTenantSlugCookieClient } from '@/lib/utils/tenantSlugCookie'

/**
 * Slug del tenant según subdominio, cookie (dominio custom) o query param.
 */
export function useTenantSlug(): string | null {
  if (typeof window === 'undefined') return null

  if (isRootHost(window.location.hostname)) {
    return readTenantSlugCookieClient()
  }

  const fromHost = getTenantSlugFromHost()
  if (fromHost) return fromHost

  const fromCookie = readTenantSlugCookieClient()
  if (fromCookie) return fromCookie

  return new URLSearchParams(window.location.search).get('tenant_slug')
}

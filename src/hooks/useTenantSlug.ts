'use client'

import { getTenantSlugFromHost, isRootHost } from '@/lib/utils/tenantHost'
import { readTenantSlugCookieClient } from '@/lib/utils/tenantSlugCookie'
import { useTenantLoginBootstrap } from '@/components/tenant/TenantLoginBootstrap'

/**
 * Slug del tenant según bootstrap SSR, subdominio, cookie o query.
 * Usa el slug del servidor cuando window aún no está disponible (evita React #418).
 */
export function useTenantSlug(): string | null {
  const { slug: bootstrapSlug } = useTenantLoginBootstrap()

  if (typeof window === 'undefined') {
    return bootstrapSlug
  }

  if (isRootHost(window.location.hostname)) {
    return readTenantSlugCookieClient() ?? bootstrapSlug
  }

  const fromHost = getTenantSlugFromHost()
  if (fromHost) return fromHost

  const fromCookie = readTenantSlugCookieClient()
  if (fromCookie) return fromCookie

  return new URLSearchParams(window.location.search).get('tenant_slug') ?? bootstrapSlug
}

'use client'

import { useSearchParams } from 'next/navigation'
import { getTenantSlugFromHost, isRootHost } from '@/lib/utils/tenantHost'

/**
 * Slug del tenant según subdominio (ej. jraasecurity.simulacros.pe).
 * Resolución síncrona en el primer render (sin esperar useEffect).
 */
export function useTenantSlug(): string | null {
  const searchParams = useSearchParams()

  if (typeof window !== 'undefined' && isRootHost(window.location.hostname)) {
    return null
  }

  const fromHost = typeof window !== 'undefined' ? getTenantSlugFromHost() : null
  if (fromHost) return fromHost

  return searchParams.get('tenant_slug')
}

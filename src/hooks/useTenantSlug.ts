'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getTenantSlugFromHost, isRootHost } from '@/lib/utils/tenantHost'

/**
 * Slug del tenant según subdominio (ej. jraasecurity.simulacros.pe).
 * En simulacros.pe (raíz) siempre null — solo SuperAdmin.
 */
export function useTenantSlug(): string | null {
  const [slug, setSlug] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== 'undefined' && isRootHost(window.location.hostname)) {
      setSlug(null)
      return
    }

    const fromHost = getTenantSlugFromHost()
    if (fromHost) {
      setSlug(fromHost)
      return
    }

    const fromMiddleware = searchParams.get('tenant_slug')
    if (fromMiddleware) {
      setSlug(fromMiddleware)
      return
    }

    setSlug(null)
  }, [searchParams])

  return slug
}

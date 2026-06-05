'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export function useTenantSlug(): string | null {
  const [slug, setSlug] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const fromMiddleware = searchParams.get('tenant_slug')
    if (fromMiddleware) {
      setSlug(fromMiddleware)
      return
    }

    const agencia = searchParams.get('agencia')
    const academia = searchParams.get('academia')
    if (agencia) {
      setSlug(agencia)
      return
    }
    if (academia) {
      setSlug(academia)
      return
    }

    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (hostname.endsWith('.simulacros.pe')) {
        const extracted = hostname.replace('.simulacros.pe', '')
        if (extracted && extracted !== 'www') {
          setSlug(extracted)
          return
        }
      }
      if (hostname.includes('.localhost')) {
        const extracted = hostname.replace('.localhost', '')
        if (extracted) {
          setSlug(extracted)
          return
        }
      }
    }

    setSlug(null)
  }, [searchParams])

  return slug
}

'use client'

import { useEffect, useState } from 'react'
import { fetchTenantConfig, type TenantConfig } from '@/lib/api/tenants'
import { useTenantSlug } from './useTenantSlug'

export function useTenantConfig(overrideSlug?: string | null) {
  const autoSlug = useTenantSlug()
  const slug = overrideSlug ?? autoSlug
  const [config, setConfig] = useState<TenantConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchTenantConfig(slug)
      .then((data) => {
        if (cancelled) return
        if (!data) {
          setError('Tenant no encontrado')
          setConfig(null)
        } else {
          setConfig(data)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Error al cargar configuración')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return {
    config: slug ? config : null,
    loading: slug ? loading : false,
    error: slug ? error : null,
  }
}

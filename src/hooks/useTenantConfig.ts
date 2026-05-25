'use client'

import { useEffect, useState } from 'react'
import { fetchTenantConfig, type TenantConfig } from '@/lib/api/tenants'

export function useTenantConfig(slug: string | null) {
  const [config, setConfig] = useState<TenantConfig | null>(null)
  const [loading, setLoading] = useState(Boolean(slug))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setConfig(null)
      setLoading(false)
      return
    }

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

  return { config, loading, error }
}

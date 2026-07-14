'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchTenantConfig, type TenantConfig } from '@/lib/api/tenants'
import { useTenantLoginBootstrap } from '@/components/tenant/TenantLoginBootstrap'
import { useTenantSlug } from './useTenantSlug'

const CACHE_PREFIX = 'tenant:config:'
const CACHE_TTL_MS = 10 * 60 * 1000

function readCachedConfig(slug: string): TenantConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${slug}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { savedAt: number; config: TenantConfig }
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null
    return parsed.config
  } catch {
    return null
  }
}

function writeCachedConfig(slug: string, config: TenantConfig) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      `${CACHE_PREFIX}${slug}`,
      JSON.stringify({ savedAt: Date.now(), config })
    )
  } catch {
    /* quota / private mode */
  }
}

function resolveSeedConfig(
  slug: string | null,
  bootstrapSlug: string | null,
  initialConfig: TenantConfig | null
): TenantConfig | null {
  if (!slug) return null
  if (bootstrapSlug === slug && initialConfig) return initialConfig
  return readCachedConfig(slug)
}

function hasSsrBootstrap(
  slug: string,
  bootstrapSlug: string | null,
  initialConfig: TenantConfig | null
): boolean {
  return bootstrapSlug === slug && Boolean(initialConfig)
}

export function useTenantConfig(overrideSlug?: string | null) {
  const autoSlug = useTenantSlug()
  const { initialConfig, slug: bootstrapSlug } = useTenantLoginBootstrap()
  const slug =
    overrideSlug !== undefined ? overrideSlug : (autoSlug ?? bootstrapSlug)

  const seedConfig = useMemo(
    () => resolveSeedConfig(slug, bootstrapSlug, initialConfig),
    [slug, bootstrapSlug, initialConfig]
  )

  const [config, setConfig] = useState<TenantConfig | null>(seedConfig)
  const [loading, setLoading] = useState(Boolean(slug && !seedConfig))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setConfig(null)
      setLoading(false)
      setError(null)
      return
    }

    const seed = seedConfig
    const fromSsr = hasSsrBootstrap(slug, bootstrapSlug, initialConfig)

    if (seed) {
      setConfig(seed)
      setLoading(false)
      writeCachedConfig(slug, seed)
    }

    let cancelled = false

    const refreshConfig = async (showLoading: boolean) => {
      if (showLoading) setLoading(true)

      try {
        const data = await fetchTenantConfig(slug)
        if (cancelled) return

        if (!data) {
          if (!seed) {
            setError('Tenant no encontrado')
            setConfig(null)
          }
          setLoading(false)
          return
        }

        setConfig(data)
        setError(null)
        setLoading(false)
        writeCachedConfig(slug, data)
      } catch {
        if (cancelled) return
        if (!seed) setError('Error al cargar configuración')
        setLoading(false)
      }
    }

    if (!seed) {
      void refreshConfig(true)
    } else if (!fromSsr && !readCachedConfig(slug)) {
      void refreshConfig(false)
    }

    return () => {
      cancelled = true
    }
  }, [slug, bootstrapSlug, initialConfig, seedConfig])

  return {
    config: slug ? config : null,
    loading: slug ? loading : false,
    error: slug ? error : null,
    brandingReady: true,
  }
}

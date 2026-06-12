'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchTenantConfig, type TenantConfig } from '@/lib/api/tenants'
import { useTenantLoginBootstrap } from '@/components/tenant/TenantLoginBootstrap'
import { preloadBrandingImages } from '@/lib/utils/preloadBrandingImages'
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

export function useTenantConfig(overrideSlug?: string | null) {
  const autoSlug = useTenantSlug()
  const slug = overrideSlug ?? autoSlug
  const { initialConfig, slug: bootstrapSlug } = useTenantLoginBootstrap()

  const seedConfig = useMemo(
    () => resolveSeedConfig(slug, bootstrapSlug, initialConfig),
    [slug, bootstrapSlug, initialConfig]
  )

  const [config, setConfig] = useState<TenantConfig | null>(seedConfig)
  const [loading, setLoading] = useState(Boolean(slug && !seedConfig))
  const [error, setError] = useState<string | null>(null)
  const [brandingReady, setBrandingReady] = useState(
    () => !seedConfig?.loginBackgroundUrl
  )

  useEffect(() => {
    if (!slug) {
      setConfig(null)
      setLoading(false)
      setError(null)
      setBrandingReady(true)
      return
    }

    if (seedConfig) {
      setConfig(seedConfig)
      setLoading(false)
      setBrandingReady(!seedConfig.loginBackgroundUrl)
    }

    let cancelled = false

    const loadBranding = async (data: TenantConfig) => {
      if (!data.loginBackgroundUrl && !data.logoUrl) {
        if (!cancelled) setBrandingReady(true)
        return
      }

      try {
        await preloadBrandingImages([data.loginBackgroundUrl, data.logoUrl])
      } finally {
        if (!cancelled) setBrandingReady(true)
      }
    }

    const load = async () => {
      if (!seedConfig) setLoading(true)

      try {
        const data = await fetchTenantConfig(slug)
        if (cancelled) return

        if (!data) {
          if (!seedConfig) {
            setError('Tenant no encontrado')
            setConfig(null)
          }
          setLoading(false)
          setBrandingReady(true)
          return
        }

        setConfig(data)
        setError(null)
        setLoading(false)
        writeCachedConfig(slug, data)

        if (data.loginBackgroundUrl) {
          void loadBranding(data)
        } else {
          setBrandingReady(true)
        }
      } catch {
        if (cancelled) return
        if (!seedConfig) setError('Error al cargar configuración')
        setLoading(false)
        setBrandingReady(true)
      }
    }

    if (seedConfig?.loginBackgroundUrl) {
      void loadBranding(seedConfig)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug, seedConfig])

  return {
    config: slug ? config : null,
    loading: slug ? loading : false,
    error: slug ? error : null,
    brandingReady: slug ? brandingReady : true,
  }
}

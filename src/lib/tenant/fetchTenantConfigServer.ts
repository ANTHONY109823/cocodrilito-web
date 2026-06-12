import { cache } from 'react'
import type { TenantConfig } from '@/lib/api/tenants'

function getServerApiBase(): string | null {
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!base) return null
  return base.replace(/\/$/, '')
}

async function fetchTenantConfigUncached(slug: string): Promise<TenantConfig | null> {
  const apiBase = getServerApiBase()
  if (!apiBase) return null

  try {
    const res = await fetch(`${apiBase}/tenants/${encodeURIComponent(slug)}/config`, {
      next: { revalidate: 600 },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    return (await res.json()) as TenantConfig
  } catch {
    return null
  }
}

/** Una sola petición SSR por slug y request (metadata + layout). */
export const fetchTenantConfigServer = cache(fetchTenantConfigUncached)

import { headers } from 'next/headers'
import { parseTenantSlugFromCookie } from '@/lib/utils/tenantSlugCookie'
import { getTenantSlugFromHost, isRootHost, normalizeHostname } from '@/lib/utils/tenantHost'

async function resolveCustomDomainSlug(host: string): Promise<string | null> {
  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!apiBase) return null

  const base = apiBase.replace(/\/$/, '')
  const url = `${base}/tenants/resolve-host/${encodeURIComponent(host)}`

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const data = (await res.json()) as { slug?: string }
    return data.slug?.trim() || null
  } catch {
    return null
  }
}

/** Slug del tenant en SSR: header middleware, cookie, subdominio o dominio custom. */
export async function resolveTenantSlugFromHeaders(): Promise<string | null> {
  const h = await headers()

  const fromHeader = h.get('x-tenant-slug')?.trim()
  if (fromHeader) return fromHeader

  const fromCookie = parseTenantSlugFromCookie(h.get('cookie'))
  if (fromCookie) return fromCookie

  const host = normalizeHostname(h.get('host') || '')
  const fromSubdomain = getTenantSlugFromHost(host)
  if (fromSubdomain) return fromSubdomain

  if (
    host &&
    !isRootHost(host) &&
    !host.endsWith('.simulacros.pe') &&
    !host.endsWith('.localhost')
  ) {
    return resolveCustomDomainSlug(host)
  }

  return null
}

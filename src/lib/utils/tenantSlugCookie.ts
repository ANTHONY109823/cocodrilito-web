import { headers } from 'next/headers'

export const TENANT_SLUG_COOKIE = 'tenant_slug'

export function parseTenantSlugFromCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${TENANT_SLUG_COOKIE}=([^;]+)`))
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1]).trim() || null
  } catch {
    return null
  }
}

export function readTenantSlugCookieClient(): string | null {
  if (typeof document === 'undefined') return null
  return parseTenantSlugFromCookie(document.cookie)
}

/** Slug del tenant en SSR (header middleware o cookie). */
export async function resolveRequestTenantSlug(): Promise<string | null> {
  const h = await headers()
  return h.get('x-tenant-slug') ?? parseTenantSlugFromCookie(h.get('cookie'))
}

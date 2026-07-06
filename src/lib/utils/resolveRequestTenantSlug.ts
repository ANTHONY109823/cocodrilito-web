import { headers } from 'next/headers'
import { parseTenantSlugFromCookie } from '@/lib/utils/tenantSlugCookie'

/** Slug del tenant en SSR (header middleware o cookie). Solo servidor. */
export async function resolveRequestTenantSlug(): Promise<string | null> {
  const h = await headers()
  return h.get('x-tenant-slug') ?? parseTenantSlugFromCookie(h.get('cookie'))
}

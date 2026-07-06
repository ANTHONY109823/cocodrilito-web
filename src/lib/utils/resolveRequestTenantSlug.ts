import { resolveTenantSlugFromHeaders } from '@/lib/tenant/resolveTenantSlugFromHeaders'

/** Slug del tenant en SSR (header middleware, cookie, subdominio o dominio custom). Solo servidor. */
export async function resolveRequestTenantSlug(): Promise<string | null> {
  return resolveTenantSlugFromHeaders()
}

import { resolveTenantSlugFromHeaders } from '@/lib/tenant/resolveTenantSlugFromHeaders'

/** Slug del tenant en SSR (header middleware o cookie). Solo servidor. */
export async function resolveRequestTenantSlug(): Promise<string | null> {
  return resolveTenantSlugFromHeaders()
}

export const TENANT_BASE_DOMAIN =
  process.env.NEXT_PUBLIC_TENANT_DOMAIN ?? 'simulacros.pe'

export function getTenantAccessUrl(slug: string, customDomain?: string | null): string {
  if (customDomain?.trim()) {
    const host = customDomain.trim().replace(/^https?:\/\//, '').split('/')[0]
    return `https://${host}`
  }
  return `https://${slug}.${TENANT_BASE_DOMAIN}`
}

export function getTenantAccessHost(slug: string, customDomain?: string | null): string {
  if (customDomain?.trim()) {
    return customDomain.trim().replace(/^https?:\/\//, '').split('/')[0]
  }
  return `${slug}.${TENANT_BASE_DOMAIN}`
}

export async function copyTenantAccessUrl(slug: string, customDomain?: string | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getTenantAccessUrl(slug, customDomain))
    return true
  } catch {
    return false
  }
}

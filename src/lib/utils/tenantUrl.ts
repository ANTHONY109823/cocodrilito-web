export const TENANT_BASE_DOMAIN =
  process.env.NEXT_PUBLIC_TENANT_DOMAIN ?? 'simulacros.pe'

export function getTenantAccessUrl(slug: string): string {
  return `https://${slug}.${TENANT_BASE_DOMAIN}`
}

export function getTenantAccessHost(slug: string): string {
  return `${slug}.${TENANT_BASE_DOMAIN}`
}

export async function copyTenantAccessUrl(slug: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getTenantAccessUrl(slug))
    return true
  } catch {
    return false
  }
}

import type { TenantConfig } from '@/lib/api/tenants'

function getServerApiBase(): string | null {
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!base) return null
  return base.replace(/\/$/, '')
}

export async function fetchTenantConfigServer(slug: string): Promise<TenantConfig | null> {
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

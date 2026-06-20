import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { resolveTenantSlugFromHeaders } from '@/lib/tenant/resolveTenantSlugFromHeaders'
import { resolveTenantAssetUrl } from '@/lib/utils/resolveTenantAssetUrl'

export function iconMimeType(href: string): string {
  if (href.endsWith('.svg')) return 'image/svg+xml'
  if (href.endsWith('.png')) return 'image/png'
  if (href.endsWith('.webp')) return 'image/webp'
  if (href.startsWith('/uploads/')) return 'image/png'
  return 'image/jpeg'
}

export type TenantIconLinks = {
  slug: string | null
  iconHref: string
  appleHref: string
  type?: string
}

/** URLs de favicon para la petición actual (SSR). */
export async function getTenantIconLinksForRequest(): Promise<TenantIconLinks> {
  const slug = await resolveTenantSlugFromHeaders()
  if (!slug) {
    return { slug: null, iconHref: '/favicon.svg', appleHref: '/favicon.svg' }
  }

  const config = await fetchTenantConfigServer(slug)
  const logoHref = resolveTenantAssetUrl(config?.logoUrl)
  if (logoHref) {
    return {
      slug,
      iconHref: logoHref,
      appleHref: logoHref,
      type: iconMimeType(logoHref),
    }
  }

  return { slug, iconHref: '/brand/icon', appleHref: '/brand/apple-icon' }
}

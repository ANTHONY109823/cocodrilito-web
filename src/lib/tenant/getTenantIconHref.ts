import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { resolveTenantSlugFromHeaders } from '@/lib/tenant/resolveTenantSlugFromHeaders'
import {
  APPLE_ICON_WIDTH,
  buildTenantFaviconHref,
  FAVICON_WIDTH,
} from '@/lib/utils/resolveTenantAssetUrl'

export function iconMimeType(href: string): string {
  if (href.includes('/_next/image')) return 'image/png'
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
  const iconHref = buildTenantFaviconHref(config?.logoUrl, FAVICON_WIDTH)
  const appleHref = buildTenantFaviconHref(config?.logoUrl, APPLE_ICON_WIDTH)
  if (iconHref) {
    return {
      slug,
      iconHref,
      appleHref: appleHref ?? iconHref,
      type: iconMimeType(iconHref),
    }
  }

  return { slug, iconHref: '/brand/icon', appleHref: '/brand/apple-icon' }
}

import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { resolveTenantSlugFromHeaders } from '@/lib/tenant/resolveTenantSlugFromHeaders'
import {
  buildTenantDynamicIconMetadata,
  buildTenantIconMetadata,
  resolveTenantAssetUrl,
} from '@/lib/utils/resolveTenantAssetUrl'

function iconType(href: string): string {
  if (href.endsWith('.svg')) return 'image/svg+xml'
  if (href.endsWith('.png')) return 'image/png'
  if (href.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

/** Enlaces explícitos de favicon en SSR (más fiable que solo metadata en rutas del dashboard). */
export async function TenantHeadIcons() {
  const slug = await resolveTenantSlugFromHeaders()
  const config = slug ? await fetchTenantConfigServer(slug) : null
  const logoHref = resolveTenantAssetUrl(config?.logoUrl)
  const meta = logoHref ? buildTenantIconMetadata(config?.logoUrl) : buildTenantDynamicIconMetadata()

  const iconHref = logoHref ?? meta.icon?.[0]?.url ?? '/icon'
  const appleHref = logoHref ?? meta.apple?.[0]?.url ?? '/apple-icon'
  const type = logoHref ? iconType(logoHref) : undefined

  return (
    <>
      <link rel="icon" href={iconHref} sizes="any" {...(type ? { type } : {})} />
      <link rel="shortcut icon" href={iconHref} {...(type ? { type } : {})} />
      <link rel="apple-touch-icon" href={appleHref} {...(type ? { type } : {})} />
    </>
  )
}

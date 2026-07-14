import type { Metadata } from 'next'
import { BRAND_PAGE_TITLE } from '@/lib/constants/brand'
import { TenantLoginBootstrap } from '@/components/tenant/TenantLoginBootstrap'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { buildTenantIconMetadata, resolveTenantAssetUrl } from '@/lib/utils/resolveTenantAssetUrl'
import { resolveRequestTenantSlug } from '@/lib/utils/resolveRequestTenantSlug'
import { preload } from 'react-dom'

export async function generateMetadata(): Promise<Metadata> {
  const slug = await resolveRequestTenantSlug()
  if (!slug) return { title: BRAND_PAGE_TITLE }

  const config = await fetchTenantConfigServer(slug)
  if (!config?.name) return { title: BRAND_PAGE_TITLE }

  return {
    title: `${config.name} — Iniciar sesión`,
    icons: buildTenantIconMetadata(config.logoUrl),
  }
}

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const slug = await resolveRequestTenantSlug()
  const initialConfig = slug ? await fetchTenantConfigServer(slug) : null
  const backgroundUrl = resolveTenantAssetUrl(initialConfig?.loginBackgroundUrl)

  // Solo precargar el fondo (CSS background-image usa la misma URL).
  // El logo va por next/image (/_next/image?...): precargarlo dispara el warning
  // "preloaded but not used".
  if (backgroundUrl) preload(backgroundUrl, { as: 'image', fetchPriority: 'high' })

  return (
    <TenantLoginBootstrap slug={slug} initialConfig={initialConfig}>
      {children}
    </TenantLoginBootstrap>
  )
}

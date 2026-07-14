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
  const logoUrl = resolveTenantAssetUrl(initialConfig?.logoUrl)
  const backgroundUrl = resolveTenantAssetUrl(initialConfig?.loginBackgroundUrl)

  // Precarga vía React (no <link> sueltos en el body → evita mismatch de hidratación).
  if (backgroundUrl) preload(backgroundUrl, { as: 'image', fetchPriority: 'high' })
  if (logoUrl) preload(logoUrl, { as: 'image', fetchPriority: 'high' })

  return (
    <TenantLoginBootstrap slug={slug} initialConfig={initialConfig}>
      {children}
    </TenantLoginBootstrap>
  )
}

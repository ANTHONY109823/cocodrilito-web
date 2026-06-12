import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { BRAND_PAGE_TITLE } from '@/lib/constants/brand'
import { TenantLoginBootstrap } from '@/components/tenant/TenantLoginBootstrap'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { buildFaviconMetadata, resolveTenantAssetUrl } from '@/lib/utils/resolveTenantAssetUrl'

export async function generateMetadata(): Promise<Metadata> {
  const slug = (await headers()).get('x-tenant-slug')
  if (!slug) return { title: BRAND_PAGE_TITLE }

  const config = await fetchTenantConfigServer(slug)
  if (!config?.name) return { title: BRAND_PAGE_TITLE }

  return {
    title: `${config.name} — Iniciar sesión`,
    icons: buildFaviconMetadata(config.logoUrl),
  }
}

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const slug = requestHeaders.get('x-tenant-slug')
  const initialConfig = slug ? await fetchTenantConfigServer(slug) : null
  const logoUrl = resolveTenantAssetUrl(initialConfig?.logoUrl)
  const backgroundUrl = resolveTenantAssetUrl(initialConfig?.loginBackgroundUrl)

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {backgroundUrl ? (
        <link rel="preload" as="image" href={backgroundUrl} fetchPriority="high" />
      ) : null}
      {logoUrl ? (
        <link rel="preload" as="image" href={logoUrl} fetchPriority="high" />
      ) : null}
      <TenantLoginBootstrap slug={slug} initialConfig={initialConfig}>
        {children}
      </TenantLoginBootstrap>
    </>
  )
}

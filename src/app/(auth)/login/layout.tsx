import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { BRAND_PAGE_TITLE } from '@/lib/constants/brand'
import { TenantLoginBootstrap } from '@/components/tenant/TenantLoginBootstrap'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'

export async function generateMetadata(): Promise<Metadata> {
  const slug = (await headers()).get('x-tenant-slug')
  if (!slug) return { title: BRAND_PAGE_TITLE }

  const config = await fetchTenantConfigServer(slug)
  if (!config?.name) return { title: BRAND_PAGE_TITLE }

  return { title: `${config.name} — Iniciar sesión` }
}

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const slug = requestHeaders.get('x-tenant-slug')
  const initialConfig = slug ? await fetchTenantConfigServer(slug) : null

  return (
    <>
      {initialConfig?.loginBackgroundUrl ? (
        <link rel="preload" as="image" href={initialConfig.loginBackgroundUrl} fetchPriority="high" />
      ) : null}
      {initialConfig?.logoUrl ? (
        <link rel="preload" as="image" href={initialConfig.logoUrl} fetchPriority="high" />
      ) : null}
      <TenantLoginBootstrap slug={slug} initialConfig={initialConfig}>
        {children}
      </TenantLoginBootstrap>
    </>
  )
}

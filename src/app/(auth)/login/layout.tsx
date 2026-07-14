import type { Metadata } from 'next'
import { BRAND_PAGE_TITLE } from '@/lib/constants/brand'
import { TenantLoginBootstrap } from '@/components/tenant/TenantLoginBootstrap'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { buildTenantDynamicIconMetadata } from '@/lib/utils/resolveTenantAssetUrl'
import { resolveRequestTenantSlug } from '@/lib/utils/resolveRequestTenantSlug'

export async function generateMetadata(): Promise<Metadata> {
  const slug = await resolveRequestTenantSlug()
  if (!slug) return { title: BRAND_PAGE_TITLE }

  const config = await fetchTenantConfigServer(slug)
  if (!config?.name) return { title: BRAND_PAGE_TITLE }

  return {
    title: `${config.name} — Iniciar sesión`,
    icons: buildTenantDynamicIconMetadata(),
  }
}

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const slug = await resolveRequestTenantSlug()
  const initialConfig = slug ? await fetchTenantConfigServer(slug) : null

  // Sin preload manual: next/Image y CSS cargan cuando se usan (evita warning F12).

  return (
    <TenantLoginBootstrap slug={slug} initialConfig={initialConfig}>
      {children}
    </TenantLoginBootstrap>
  )
}

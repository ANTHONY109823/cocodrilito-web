import type { Metadata } from 'next'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { buildTenantDynamicIconMetadata } from '@/lib/utils/resolveTenantAssetUrl'
import { resolveRequestTenantSlug } from '@/lib/utils/resolveRequestTenantSlug'
import { DashboardClientLayout } from '@/components/layout/DashboardClientLayout'

export async function generateMetadata(): Promise<Metadata> {
  const slug = await resolveRequestTenantSlug()
  if (!slug) return {}

  const config = await fetchTenantConfigServer(slug)

  return {
    ...(config?.name ? { title: config.name } : {}),
    icons: buildTenantDynamicIconMetadata(),
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>
}

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { buildTenantIconMetadata } from '@/lib/utils/resolveTenantAssetUrl'
import { resolveRequestTenantSlug } from '@/lib/utils/resolveRequestTenantSlug'
import { DashboardClientLayout } from '@/components/layout/DashboardClientLayout'

export async function generateMetadata(): Promise<Metadata> {
  const slug = await resolveRequestTenantSlug()
  if (!slug) return {}

  const config = await fetchTenantConfigServer(slug)
  if (!config?.name) return {}

  return {
    title: config.name,
    icons: buildTenantIconMetadata(config.logoUrl),
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>
}

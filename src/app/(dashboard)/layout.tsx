import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { buildFaviconMetadata } from '@/lib/utils/resolveTenantAssetUrl'
import { DashboardClientLayout } from '@/components/layout/DashboardClientLayout'

export async function generateMetadata(): Promise<Metadata> {
  const slug = (await headers()).get('x-tenant-slug')
  if (!slug) return {}

  const config = await fetchTenantConfigServer(slug)
  if (!config?.name) return {}

  return {
    title: config.name,
    icons: buildFaviconMetadata(config.logoUrl) ?? undefined,
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>
}

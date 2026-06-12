import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import { AppProviders } from '@/components/AppProviders'
import { BRAND_DESCRIPTION, BRAND_PAGE_TITLE } from '@/lib/constants/brand'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { buildFaviconMetadata } from '@/lib/utils/resolveTenantAssetUrl'

const PLATFORM_ICONS: Metadata['icons'] = {
  icon: [{ url: '/icon', type: 'image/svg+xml', sizes: 'any' }],
  apple: [{ url: '/apple-icon', type: 'image/svg+xml' }],
  shortcut: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
}

export async function generateMetadata(): Promise<Metadata> {
  const slug = (await headers()).get('x-tenant-slug')

  if (slug) {
    const config = await fetchTenantConfigServer(slug)
    const tenantIcons = buildFaviconMetadata(config?.logoUrl)

    if (config?.name && tenantIcons) {
      return {
        title: config.name,
        description: BRAND_DESCRIPTION,
        icons: tenantIcons,
      }
    }

    if (config?.name) {
      return {
        title: config.name,
        description: BRAND_DESCRIPTION,
        icons: PLATFORM_ICONS,
      }
    }
  }

  return {
    title: BRAND_PAGE_TITLE,
    description: BRAND_DESCRIPTION,
    icons: PLATFORM_ICONS,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}

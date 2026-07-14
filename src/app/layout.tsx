import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/AppProviders'
import { BRAND_DESCRIPTION, BRAND_PAGE_TITLE } from '@/lib/constants/brand'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { buildTenantDynamicIconMetadata } from '@/lib/utils/resolveTenantAssetUrl'
import { resolveRequestTenantSlug } from '@/lib/utils/resolveRequestTenantSlug'
import { TenantHeadIcons } from '@/components/tenant/TenantHeadIcons'

const PLATFORM_ICONS: Metadata['icons'] = {
  icon: [{ url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' }],
  apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  shortcut: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
}

export async function generateMetadata(): Promise<Metadata> {
  const slug = await resolveRequestTenantSlug()

  if (slug) {
    const config = await fetchTenantConfigServer(slug)
    // Favicon estable vía /brand/icon (TenantHeadIcons pinnea el logo real).
    // Evita /_next/image sobre PNGs grandes que fallan o pelean con el head.
    const tenantIcons = buildTenantDynamicIconMetadata()

    if (config?.name) {
      return {
        title: config.name,
        description: BRAND_DESCRIPTION,
        icons: tenantIcons,
      }
    }

    return {
      title: BRAND_PAGE_TITLE,
      description: BRAND_DESCRIPTION,
      icons: tenantIcons,
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
    <html lang="es" suppressHydrationWarning>
      <head>
        <TenantHeadIcons />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('simulacros-color-scheme');var s=t==='light'?'light':'dark';document.documentElement.setAttribute('data-theme',s);document.documentElement.style.colorScheme=s;}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}

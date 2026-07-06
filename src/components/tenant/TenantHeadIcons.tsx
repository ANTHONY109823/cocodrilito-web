import { getTenantIconLinksForRequest } from '@/lib/tenant/getTenantIconHref'
import { buildTenantFaviconGuardScript } from '@/lib/tenant/tenantFaviconGuardScript'

/** Favicon de agencia en SSR + guard que impide que la hidratación lo reemplace. */
export async function TenantHeadIcons() {
  const { slug, iconHref, appleHref, type } = await getTenantIconLinksForRequest()
  const pinTenant = Boolean(slug && iconHref !== '/favicon.svg')

  return (
    <>
      <link
        rel="icon"
        href={iconHref}
        sizes="any"
        data-pinned-tenant-icon={pinTenant ? '1' : undefined}
        {...(type ? { type } : {})}
      />
      <link
        rel="shortcut icon"
        href={iconHref}
        data-pinned-tenant-icon={pinTenant ? '1' : undefined}
        {...(type ? { type } : {})}
      />
      <link
        rel="apple-touch-icon"
        href={appleHref}
        data-pinned-tenant-icon={pinTenant ? '1' : undefined}
        {...(type ? { type } : {})}
      />
      {pinTenant ? (
        <script
          dangerouslySetInnerHTML={{ __html: buildTenantFaviconGuardScript(iconHref, type) }}
        />
      ) : null}
    </>
  )
}

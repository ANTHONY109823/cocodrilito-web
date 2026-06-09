import { getTenantAccessUrl } from '@/lib/utils/tenantUrl'
import { isSuperAdmin, isTenantAdmin } from '@/lib/auth/roles'

const ROOT_HOSTS = [
  'simulacros.pe',
  'www.simulacros.pe',
  'localhost',
  'cocodrilito-web.vercel.app',
]

export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(':3000', '').replace(':443', '')
}

export function isRootHost(hostname?: string): boolean {
  const h = normalizeHostname(
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')
  )
  return ROOT_HOSTS.includes(h)
}

export function getTenantSlugFromHost(hostname?: string): string | null {
  if (typeof window === 'undefined' && !hostname) return null
  const h = normalizeHostname(hostname ?? window.location.hostname)

  if (isRootHost(h)) return null

  if (h.endsWith('.simulacros.pe')) {
    const slug = h.replace('.simulacros.pe', '')
    return slug && slug !== 'www' ? slug : null
  }

  if (h.endsWith('.localhost')) {
    const slug = h.replace('.localhost', '')
    return slug || null
  }

  return null
}

export function getPlatformOrigin(): string {
  if (typeof window === 'undefined') return 'https://simulacros.pe'
  const { protocol, port } = window.location
  if (window.location.hostname === 'localhost') {
    return `${protocol}//localhost${port ? `:${port}` : ''}`
  }
  return 'https://simulacros.pe'
}

/** Redirige si el usuario está en un host incorrecto para su rol. Devuelve true si redirigió. */
export function enforceTenantHostAccess(
  role?: string | null,
  tenantSlug?: string | null,
  impersonating?: boolean,
  pathname = '/'
): boolean {
  if (typeof window === 'undefined' || !role) return false

  const hostSlug = getTenantSlugFromHost()

  if (isSuperAdmin(role) && !impersonating && hostSlug) {
    window.location.href = `${getPlatformOrigin()}/superadmin?tab=inicio`
    return true
  }

  if (impersonating) return false

  const needsTenantHost = isTenantAdmin(role) || Boolean(tenantSlug)

  if (needsTenantHost && tenantSlug && !hostSlug) {
    const base = getTenantAccessUrl(tenantSlug)
    const dest = isTenantAdmin(role) ? '/admin' : pathname
    window.location.href = `${base}${dest}`
    return true
  }

  if (tenantSlug && hostSlug && hostSlug !== tenantSlug) {
    const base = getTenantAccessUrl(tenantSlug)
    window.location.href = `${base}${pathname}`
    return true
  }

  return false
}

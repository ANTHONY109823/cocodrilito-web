import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TENANT_SLUG_COOKIE } from '@/lib/utils/tenantSlugCookie'

const ROOT_DOMAINS = [
  'simulacros.pe',
  'www.simulacros.pe',
  'cocodrilito-web.vercel.app',
  'localhost:3000',
  'localhost',
]

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/superadmin',
  '/exams',
  '/exam/',
  '/result/',
  '/review/',
  '/history',
  '/ranking',
  '/premium',
  '/profile',
  '/cambiar-clave',
]

function normalizeHost(hostname: string): string {
  return hostname.replace(':3000', '').replace(':443', '').toLowerCase()
}

function isRootDomain(host: string): boolean {
  return ROOT_DOMAINS.some((d) => host === d)
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  )
}

function hasAuthSession(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get('access_token')?.value ||
      request.cookies.get('session_active')?.value
  )
}

function applyTenantHeaders(response: NextResponse, slug: string, hostname: string) {
  response.headers.set('x-tenant-slug', slug)
  response.headers.set('x-tenant-host', hostname)
}

function setTenantSlugCookie(response: NextResponse, slug: string, hostname: string) {
  response.cookies.set(TENANT_SLUG_COOKIE, slug, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    secure: !hostname.includes('localhost'),
  })
}

function clearTenantSlugCookie(response: NextResponse) {
  response.cookies.delete(TENANT_SLUG_COOKIE)
}

function withTenantContext(
  response: NextResponse,
  slug: string,
  hostname: string,
  opts?: { customDomain?: string }
) {
  applyTenantHeaders(response, slug, hostname)
  setTenantSlugCookie(response, slug, hostname)
  if (opts?.customDomain) {
    response.headers.set('x-tenant-custom-domain', opts.customDomain)
  }
  return response
}

async function resolveCustomDomainHost(host: string): Promise<string | null> {
  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!apiBase) return null

  const base = apiBase.replace(/\/$/, '')
  const url = `${base}/tenants/resolve-host/${encodeURIComponent(host)}`

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return null
    const data = (await res.json()) as { slug?: string }
    return data.slug ?? null
  } catch {
    return null
  }
}

async function resolveSlugForHost(host: string): Promise<string | null> {
  if (!isRootDomain(host) && host.endsWith('.simulacros.pe')) {
    const slug = host.replace('.simulacros.pe', '')
    if (slug && slug !== 'www') return slug
  }

  if (!isRootDomain(host) && host.endsWith('.localhost')) {
    const slug = host.replace('.localhost', '')
    if (slug) return slug
  }

  if (!isRootDomain(host) && !host.endsWith('.simulacros.pe') && !host.endsWith('.localhost')) {
    return resolveCustomDomainHost(host)
  }

  return null
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const host = normalizeHost(hostname)
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api') || pathname.startsWith('/uploads')) {
    return NextResponse.next()
  }

  const tenantSlug = await resolveSlugForHost(host)

  const isIconRequest = pathname === '/brand/icon' || pathname === '/brand/apple-icon'

  if (isIconRequest && tenantSlug) {
    const customDomain =
      !host.endsWith('.simulacros.pe') && !host.endsWith('.localhost') ? host : undefined
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-slug', tenantSlug)
    requestHeaders.set('x-tenant-host', hostname)
    if (customDomain) requestHeaders.set('x-tenant-custom-domain', customDomain)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    return withTenantContext(response, tenantSlug, hostname, { customDomain })
  }

  if (isRootDomain(host) && pathname === '/login') {
    const legacySlug =
      request.nextUrl.searchParams.get('agencia') ??
      request.nextUrl.searchParams.get('academia') ??
      request.nextUrl.searchParams.get('tenant_slug')

    if (legacySlug && legacySlug !== 'www') {
      const loginUrl = request.nextUrl.clone()
      loginUrl.searchParams.delete('agencia')
      loginUrl.searchParams.delete('academia')
      loginUrl.searchParams.delete('tenant_slug')
      loginUrl.pathname = '/login'

      if (host === 'localhost') {
        const port = hostname.includes(':') ? hostname.split(':').pop() : '3000'
        loginUrl.host = `${legacySlug}.localhost:${port}`
      } else {
        loginUrl.hostname = `${legacySlug}.simulacros.pe`
        loginUrl.protocol = 'https:'
      }

      return NextResponse.redirect(loginUrl)
    }
  }

  if (isProtectedPath(pathname) && !hasAuthSession(request)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (tenantSlug) {
    const url = request.nextUrl.clone()
    url.searchParams.set('tenant_slug', tenantSlug)
    const response = NextResponse.rewrite(url)
    const customDomain =
      !host.endsWith('.simulacros.pe') && !host.endsWith('.localhost') ? host : undefined
    return withTenantContext(response, tenantSlug, hostname, { customDomain })
  }

  const response = NextResponse.next()
  if (isRootDomain(host)) clearTenantSlugCookie(response)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

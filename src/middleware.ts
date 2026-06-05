import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const host = normalizeHost(hostname)
  const { pathname } = request.nextUrl

  if (isProtectedPath(pathname) && !hasAuthSession(request)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!isRootDomain(host) && host.endsWith('.simulacros.pe')) {
    const slug = host.replace('.simulacros.pe', '')
    if (slug && slug !== 'www') {
      const url = request.nextUrl.clone()
      url.searchParams.set('tenant_slug', slug)
      const response = NextResponse.rewrite(url)
      applyTenantHeaders(response, slug, hostname)
      return response
    }
  }

  if (!isRootDomain(host) && host.endsWith('.localhost')) {
    const slug = host.replace('.localhost', '')
    if (slug) {
      const url = request.nextUrl.clone()
      url.searchParams.set('tenant_slug', slug)
      const response = NextResponse.rewrite(url)
      applyTenantHeaders(response, slug, hostname)
      return response
    }
  }

  if (!isRootDomain(host) && !host.endsWith('.simulacros.pe') && !host.endsWith('.localhost')) {
    const slug = await resolveCustomDomainHost(host)
    if (slug) {
      const url = request.nextUrl.clone()
      url.searchParams.set('tenant_slug', slug)
      const response = NextResponse.rewrite(url)
      applyTenantHeaders(response, slug, hostname)
      response.headers.set('x-tenant-custom-domain', host)
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

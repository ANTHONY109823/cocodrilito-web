import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_DOMAINS = [
  'simulacros.pe',
  'www.simulacros.pe',
  'cocodrilito-web.vercel.app',
  'localhost:3000',
  'localhost',
]

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const host = hostname.replace(':3000', '').replace(':443', '')
  const isRootDomain = ROOT_DOMAINS.some((d) => host === d)

  if (!isRootDomain && host.endsWith('.simulacros.pe')) {
    const slug = host.replace('.simulacros.pe', '')
    if (slug && slug.length > 0 && slug !== 'www') {
      const url = request.nextUrl.clone()
      url.searchParams.set('tenant_slug', slug)
      const response = NextResponse.rewrite(url)
      response.headers.set('x-tenant-slug', slug)
      response.headers.set('x-tenant-host', hostname)
      return response
    }
  }

  // Soporte localhost con subdominio para desarrollo (ej: norte.localhost:3000)
  if (!isRootDomain && host.endsWith('.localhost')) {
    const slug = host.replace('.localhost', '')
    if (slug) {
      const url = request.nextUrl.clone()
      url.searchParams.set('tenant_slug', slug)
      const response = NextResponse.rewrite(url)
      response.headers.set('x-tenant-slug', slug)
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

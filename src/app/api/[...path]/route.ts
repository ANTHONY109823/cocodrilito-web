import { NextRequest, NextResponse } from 'next/server'
import { fetchBackend, getBackendApiBase } from '@/lib/server/apiProxy'

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  // Node fetch descomprime gzip/br; reenviar Content-Encoding rompe descargas CSV/binarias.
  'content-encoding',
])

// Headers internos de infraestructura que el cliente no debe poder inyectar al backend
const BLOCKED_FROM_CLIENT = new Set([
  'x-tenant-slug',
  'x-tenant-host',
  'x-tenant-custom-domain',
  'x-forwarded-for',
  'x-real-ip',
  'x-vercel-ip-country',
  'x-vercel-ip-city',
])

function sanitizeUpstreamCookie(cookie: string): string {
  return cookie.replace(/;\s*Domain=[^;]*/gi, '')
}

function isCacheablePublicGet(pathSegments: string[]): boolean {
  const path = pathSegments.join('/')
  return (
    /^tenants\/[^/]+\/config$/i.test(path) ||
    path.startsWith('tenants/resolve-host/')
  )
}

function resolveClientIp(request: NextRequest): string | null {
  return (
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    null
  )
}

function proxyErrorResponse(status: number, message: string) {
  return NextResponse.json({ message, code: 'PROXY_ERROR' }, { status })
}

async function proxyToBackend(request: NextRequest, pathSegments: string[]) {
  const targetUrl = `${getBackendApiBase()}/${pathSegments.join('/')}${request.nextUrl.search}`
  const cacheableGet = request.method === 'GET' && isCacheablePublicGet(pathSegments)

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (!HOP_BY_HOP.has(lower) && !BLOCKED_FROM_CLIENT.has(lower)) {
      headers.set(key, value)
    }
  })

  const clientIp = resolveClientIp(request)
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp)
  }

  // Evitar respuestas comprimidas upstream que el runtime descomprime al reenviar.
  headers.set('accept-encoding', 'identity')

  const method = request.method.toUpperCase()
  const hasBody = !['GET', 'HEAD'].includes(method)
  const body = hasBody ? await request.arrayBuffer() : undefined

  let upstream: Response
  try {
    upstream = await fetchBackend(targetUrl, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: cacheableGet ? 'force-cache' : 'no-store',
      ...(cacheableGet ? { next: { revalidate: 600 } } : {}),
    })
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError'
    return proxyErrorResponse(
      timedOut ? 504 : 502,
      timedOut
        ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
        : 'No se pudo conectar con el servidor. Intenta de nuevo.'
    )
  }

  let responseBody: ArrayBuffer
  try {
    responseBody = await upstream.arrayBuffer()
  } catch {
    return proxyErrorResponse(502, 'Error al leer la respuesta del servidor.')
  }

  const responseHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') return
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      responseHeaders.append(key, value)
    }
  })

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : upstream.headers.get('set-cookie')
        ? [upstream.headers.get('set-cookie')!]
        : []

  const response = new NextResponse(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })

  for (const cookie of setCookies) {
    response.headers.append('set-cookie', sanitizeUpstreamCookie(cookie))
  }

  if (cacheableGet && upstream.ok) {
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  }

  return response
}

type RouteContext = { params: Promise<{ path: string[] }> }

export const runtime = 'nodejs'
export const maxDuration = 60

async function handle(request: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params
    return await proxyToBackend(request, path)
  } catch (err) {
    console.error('[api proxy]', err)
    return proxyErrorResponse(500, 'Error interno del proxy.')
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle

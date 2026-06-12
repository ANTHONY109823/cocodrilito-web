import { NextRequest, NextResponse } from 'next/server'

function getApiBase(): string {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5034/api'
  return raw.replace(/\/$/, '')
}

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
])

function sanitizeUpstreamCookie(cookie: string): string {
  return cookie.replace(/;\s*Domain=[^;]*/gi, '')
}

async function proxyToBackend(request: NextRequest, pathSegments: string[]) {
  const targetUrl = `${getApiBase()}/${pathSegments.join('/')}${request.nextUrl.search}`

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  const method = request.method.toUpperCase()
  const hasBody = !['GET', 'HEAD'].includes(method)
  const body = hasBody ? await request.arrayBuffer() : undefined

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: 'manual',
    cache: 'no-store',
  })

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

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })

  for (const cookie of setCookies) {
    response.headers.append('set-cookie', sanitizeUpstreamCookie(cookie))
  }

  return response
}

type RouteContext = { params: Promise<{ path: string[] }> }

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxyToBackend(request, path)
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle

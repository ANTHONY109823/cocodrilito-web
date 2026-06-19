import { NextResponse } from 'next/server'
import { fetchBackend, getBackendApiBase } from '@/lib/server/apiProxy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Keep-warm hacia Railway; nunca debe lanzar excepción (evita errores en Vercel Functions). */
export async function GET() {
  try {
    const res = await fetchBackend(`${getBackendApiBase()}/health`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      timeoutMs: 8_000,
    })
    if (res.ok) {
      return NextResponse.json({ status: 'ok', upstream: true })
    }
    return NextResponse.json({ status: 'degraded', upstream: false })
  } catch {
    return NextResponse.json({ status: 'unreachable', upstream: false })
  }
}

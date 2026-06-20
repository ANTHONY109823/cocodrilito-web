import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { headers } from 'next/headers'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { resolveTenantSlugFromHeaders } from '@/lib/tenant/resolveTenantSlugFromHeaders'
import {
  buildTenantFaviconHref,
} from '@/lib/utils/resolveTenantAssetUrl'

async function getRequestOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

async function loadPlatformIconResponse(): Promise<Response> {
  const svg = await readFile(path.join(process.cwd(), 'public/favicon.svg'))
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}

function redirectToFavicon(targetPath: string, origin: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: `${origin}${targetPath}`,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}

/** Icono de pestaña: redirige al logo optimizado (32px) o SVG plataforma. Sin proxy de MB. */
export async function resolveTenantIconResponse(): Promise<Response> {
  const slug = await resolveTenantSlugFromHeaders()
  if (!slug) return loadPlatformIconResponse()

  const config = await fetchTenantConfigServer(slug)
  const faviconHref = buildTenantFaviconHref(config?.logoUrl)
  if (!faviconHref) return loadPlatformIconResponse()

  const origin = await getRequestOrigin()
  return redirectToFavicon(faviconHref, origin)
}

/** Apple touch icon: redirige al logo optimizado (180px). */
export async function resolveTenantAppleIconResponse(): Promise<Response> {
  const slug = await resolveTenantSlugFromHeaders()
  if (!slug) return loadPlatformIconResponse()

  const config = await fetchTenantConfigServer(slug)
  const appleHref =
    buildTenantFaviconHref(config?.logoUrl, 180) ?? buildTenantFaviconHref(config?.logoUrl)
  if (!appleHref) return loadPlatformIconResponse()

  const origin = await getRequestOrigin()
  return redirectToFavicon(appleHref, origin)
}

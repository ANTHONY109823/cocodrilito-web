import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { headers } from 'next/headers'
import { fetchTenantConfigServer } from '@/lib/tenant/fetchTenantConfigServer'
import { resolveTenantAssetUrl } from '@/lib/utils/resolveTenantAssetUrl'

import { parseTenantSlugFromCookie } from '@/lib/utils/tenantSlugCookie'

function getUploadFetchUrl(resolvedPath: string): string {
  if (resolvedPath.startsWith('http')) return resolvedPath

  const apiOrigin = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '')
    .replace(/\/api\/?$/i, '')
    .replace(/\/$/, '')

  if (apiOrigin && resolvedPath.startsWith('/uploads/')) {
    return `${apiOrigin}${resolvedPath}`
  }

  return resolvedPath
}

async function loadPlatformIconResponse(): Promise<Response> {
  const svg = await readFile(path.join(process.cwd(), 'public/favicon.svg'))
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

/** Icono de pestaña según subdominio (agencia) o Simulacros.pe por defecto. */
export async function resolveTenantIconResponse(): Promise<Response> {
  const headerStore = await headers()
  const slug =
    headerStore.get('x-tenant-slug') ??
    parseTenantSlugFromCookie(headerStore.get('cookie'))
  if (!slug) return loadPlatformIconResponse()

  const config = await fetchTenantConfigServer(slug)
  const logoPath = resolveTenantAssetUrl(config?.logoUrl)
  if (!logoPath) return loadPlatformIconResponse()

  try {
    const fetchUrl = getUploadFetchUrl(logoPath)
    const res = await fetch(fetchUrl, { next: { revalidate: 600 } })
    if (!res.ok) return loadPlatformIconResponse()

    const contentType = res.headers.get('content-type') ?? 'image/png'
    return new Response(await res.arrayBuffer(), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400',
      },
    })
  } catch {
    return loadPlatformIconResponse()
  }
}

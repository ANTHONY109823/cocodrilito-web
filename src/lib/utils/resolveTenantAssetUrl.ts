function getApiOrigin(): string | null {
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!base) return null
  return base.replace(/\/api\/?$/i, '').replace(/\/$/, '')
}

function toSameOriginUploadPath(url: string): string | null {
  const match = url.match(/\/uploads\/[\w\-./%]+$/i)
  return match ? match[0] : null
}

/**
 * Resuelve URLs de branding. Las rutas /uploads/* se sirven same-origin vía rewrite
 * en Next (más rápido que ir directo a Railway en cada imagen).
 */
export function resolveTenantAssetUrl(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    const uploadPath = toSameOriginUploadPath(trimmed)
    if (uploadPath) return uploadPath
    return trimmed
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (path.startsWith('/uploads/')) return path

  const origin = getApiOrigin()
  if (!origin) return path

  return `${origin}${path}`
}

const FAVICON_WIDTH = 32
const APPLE_ICON_WIDTH = 180

/**
 * Favicon optimizado vía Next Image (~32px). Evita descargar logos de varios MB en la pestaña.
 */
export function buildTenantFaviconHref(
  assetUrl?: string | null,
  size: number = FAVICON_WIDTH
): string | null {
  const href = resolveTenantAssetUrl(assetUrl)
  if (!href) return null
  if (href.startsWith('/uploads/')) {
    return `/_next/image?url=${encodeURIComponent(href)}&w=${size}&q=75`
  }
  return href
}

export { FAVICON_WIDTH, APPLE_ICON_WIDTH }

export function buildTenantDynamicIconMetadata() {
  return {
    icon: [{ url: '/brand/icon', sizes: 'any' }],
    apple: [{ url: '/brand/apple-icon' }],
    shortcut: [{ url: '/brand/icon' }],
  }
}

/** Favicon estable: logo optimizado same-origin (32px, no proxy server-side). */
export function buildTenantIconMetadata(logoUrl?: string | null) {
  const href = buildTenantFaviconHref(logoUrl, FAVICON_WIDTH)
  const appleHref = buildTenantFaviconHref(logoUrl, APPLE_ICON_WIDTH)
  if (!href) return buildTenantDynamicIconMetadata()

  return {
    icon: [{ url: href, type: 'image/png', sizes: '32x32' }],
    apple: [{ url: appleHref ?? href, type: 'image/png' }],
    shortcut: [{ url: href, type: 'image/png' }],
  }
}

/** @deprecated Use buildTenantIconMetadata */
export function buildFaviconMetadata(logoUrl?: string | null) {
  if (!logoUrl?.trim()) return undefined
  return buildTenantIconMetadata(logoUrl)
}

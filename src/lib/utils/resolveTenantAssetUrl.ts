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

export function buildTenantDynamicIconMetadata() {
  return {
    icon: [{ url: '/icon', sizes: 'any' }],
    apple: [{ url: '/apple-icon' }],
    shortcut: [{ url: '/icon' }],
  }
}

/** @deprecated Use buildTenantDynamicIconMetadata — el logo se resuelve en /icon según subdominio. */
export function buildFaviconMetadata(logoUrl?: string | null) {
  if (!logoUrl?.trim()) return undefined
  return buildTenantDynamicIconMetadata()
}

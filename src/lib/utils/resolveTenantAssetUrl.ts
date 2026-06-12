function getApiOrigin(): string | null {
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
  if (!base) return null
  return base.replace(/\/api\/?$/i, '').replace(/\/$/, '')
}

/** Convierte rutas relativas de uploads del API en URL absoluta usable como favicon. */
export function resolveTenantAssetUrl(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed

  const origin = getApiOrigin()
  if (!origin) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  return trimmed.startsWith('/') ? `${origin}${trimmed}` : `${origin}/${trimmed}`
}

export function buildFaviconMetadata(logoUrl?: string | null) {
  const href = resolveTenantAssetUrl(logoUrl)
  if (!href) return undefined

  const type = href.endsWith('.svg')
    ? 'image/svg+xml'
    : href.endsWith('.png')
      ? 'image/png'
      : href.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg'

  return {
    icon: [{ url: href, type, sizes: 'any' }],
    apple: [{ url: href, type }],
    shortcut: [{ url: href, type }],
  }
}

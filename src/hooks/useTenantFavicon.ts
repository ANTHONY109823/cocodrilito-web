'use client'

import { useEffect } from 'react'

const PLATFORM_FAVICON = '/favicon.svg'
const TENANT_ICON = '/icon'
const TENANT_APPLE_ICON = '/apple-icon'

function upsertFaviconLink(rel: string, href: string, key: string, type?: string) {
  const selector = `link[data-tenant-favicon="${key}"]`
  let link = document.querySelector<HTMLLinkElement>(selector)
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('data-tenant-favicon', key)
    document.head.appendChild(link)
  }
  link.rel = rel
  link.href = href
  if (type) link.type = type
  else link.removeAttribute('type')
}

function detectIconType(href: string): string | undefined {
  if (href.endsWith('.svg')) return 'image/svg+xml'
  if (href.endsWith('.png')) return 'image/png'
  if (href.endsWith('.webp')) return 'image/webp'
  if (href.startsWith('/uploads/')) return 'image/png'
  return undefined
}

/**
 * Mantiene el favicon de la agencia en navegación SPA sin revertir al de plataforma/Vercel.
 */
export function useTenantFavicon(
  tenantSlug: string | null,
  logoHref: string | null,
  onTenantHost: boolean,
  pending = false
) {
  useEffect(() => {
    if (typeof document === 'undefined') return

    // En host de agencia: conservar el favicon SSR hasta tener logo (no tocar mientras carga).
    if (onTenantHost && pending) return

    const hasTenant = Boolean(tenantSlug || onTenantHost)

    if (!hasTenant) {
      upsertFaviconLink('icon', PLATFORM_FAVICON, 'icon', 'image/svg+xml')
      return
    }

    const href = logoHref || TENANT_ICON
    const type = detectIconType(href)
    const appleHref = logoHref || TENANT_APPLE_ICON

    upsertFaviconLink('icon', href, 'icon', type)
    upsertFaviconLink('shortcut icon', href, 'shortcut', type)
    upsertFaviconLink('apple-touch-icon', appleHref, 'apple', detectIconType(appleHref))
  }, [tenantSlug, logoHref, onTenantHost, pending])
}

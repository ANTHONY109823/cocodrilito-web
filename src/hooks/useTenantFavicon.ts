'use client'

import { useEffect } from 'react'

const PLATFORM_FAVICON = '/favicon.svg'
const TENANT_ICON = '/icon'
const TENANT_APPLE_ICON = '/apple-icon'

function upsertFaviconLink(rel: string, href: string, key: string) {
  const selector = `link[data-tenant-favicon="${key}"]`
  let link = document.querySelector<HTMLLinkElement>(selector)
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('data-tenant-favicon', key)
    document.head.appendChild(link)
  }
  link.rel = rel
  link.href = href
  if (href.endsWith('.svg')) link.type = 'image/svg+xml'
  else if (href === TENANT_ICON || href === TENANT_APPLE_ICON) link.removeAttribute('type')
  else link.type = 'image/png'
}

function clearTenantFaviconLinks() {
  document.querySelectorAll('link[data-tenant-favicon]').forEach((node) => {
    try {
      node.remove()
    } catch {
      /* nodo ya desmontado */
    }
  })
}

/**
 * Refuerza el favicon de la agencia en cliente (navegación SPA).
 * Usa /icon del mismo subdominio — el servidor resuelve el logo de la agencia.
 */
export function useTenantFavicon(hasTenant: boolean, pending = false) {
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (!hasTenant || pending) {
      if (!hasTenant) {
        clearTenantFaviconLinks()
        upsertFaviconLink('icon', PLATFORM_FAVICON, 'platform-icon')
      }
      return
    }

    clearTenantFaviconLinks()
    upsertFaviconLink('icon', TENANT_ICON, 'icon')
    upsertFaviconLink('shortcut icon', TENANT_ICON, 'shortcut')
    upsertFaviconLink('apple-touch-icon', TENANT_APPLE_ICON, 'apple')
  }, [hasTenant, pending])
}

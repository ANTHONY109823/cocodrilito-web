'use client'

import { useEffect } from 'react'
import { resolveTenantAssetUrl } from '@/lib/utils/resolveTenantAssetUrl'

const PLATFORM_FAVICON = '/favicon.svg'

function guessIconType(href: string) {
  if (href.endsWith('.svg')) return 'image/svg+xml'
  if (href.endsWith('.png')) return 'image/png'
  if (href.endsWith('.webp')) return 'image/webp'
  return 'image/jpeg'
}

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
  link.type = guessIconType(href)
}

function clearTenantFaviconLinks() {
  document.querySelectorAll('link[data-tenant-favicon]').forEach((node) => node.remove())
}

export function useTenantFavicon(logoUrl?: string | null, enabled = true) {
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (!enabled || !logoUrl) {
      clearTenantFaviconLinks()
      upsertFaviconLink('icon', PLATFORM_FAVICON, 'platform-icon')
      return
    }

    const href = resolveTenantAssetUrl(logoUrl)
    if (!href) return

    document
      .querySelectorAll('link[rel*="icon"]:not([data-tenant-favicon])')
      .forEach((node) => node.remove())

    upsertFaviconLink('icon', href, 'icon')
    upsertFaviconLink('shortcut icon', href, 'shortcut')
    upsertFaviconLink('apple-touch-icon', href, 'apple')

    return () => {
      clearTenantFaviconLinks()
    }
  }, [logoUrl, enabled])
}

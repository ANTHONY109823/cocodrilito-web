'use client'

import { useEffect } from 'react'

export function useTenantFavicon(logoUrl?: string | null, enabled = true) {
  useEffect(() => {
    if (!enabled || !logoUrl || typeof document === 'undefined') return

    const existing = document.querySelector<HTMLLinkElement>('link[data-tenant-favicon="true"]')
    const link = existing ?? document.createElement('link')
    link.rel = 'icon'
    link.setAttribute('data-tenant-favicon', 'true')
    link.href = logoUrl
    if (!existing) document.head.appendChild(link)

    return () => {
      link.remove()
    }
  }, [logoUrl, enabled])
}

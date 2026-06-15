'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useNavigationStore, useNavSearchStore } from '@/lib/store/navigationStore'

/**
 * Enlace único para todo el sistema: Link nativo de Next.js, prefetch activo,
 * sin preventDefault ni router.push manual.
 */
export function AppNavLink({
  href,
  className,
  children,
  trackQuery = false,
}: {
  href: string
  className?: string
  children: ReactNode
  trackQuery?: boolean
}) {
  const pathname = usePathname()
  const search = useNavSearchStore((s) => s.search)
  const setPending = useNavigationStore((s) => s.setPendingHref)
  const applyHref = useNavSearchStore((s) => s.applyHref)
  const syncFromWindow = useNavSearchStore((s) => s.syncFromWindow)

  useEffect(() => {
    syncFromWindow()
    const pending = useNavigationStore.getState().pendingHref
    if (!pending) return

    const [targetPath, targetQuery = ''] = pending.split('?')
    const currentSearch =
      typeof window !== 'undefined' ? window.location.search : search
    const arrived =
      pathname === targetPath &&
      (targetQuery === '' ? true : currentSearch === `?${targetQuery}`)

    if (arrived) setPending(null)
  }, [pathname, search, setPending, syncFromWindow])

  return (
    <Link
      href={href}
      prefetch={true}
      className={className}
      onClick={() => {
        setPending(href)
        if (trackQuery) applyHref(href)
      }}
    >
      {children}
    </Link>
  )
}

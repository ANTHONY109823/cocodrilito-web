'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { useNavigationStore } from '@/lib/store/navigationStore'

export function AppNavLink({
  href,
  className,
  style,
  children,
}: {
  href: string
  className?: string
  style?: CSSProperties
  children: ReactNode
  trackQuery?: boolean
}) {
  const pathname = usePathname()
  const setPending = useNavigationStore((s) => s.setPendingHref)

  useEffect(() => {
    const pending = useNavigationStore.getState().pendingHref
    if (!pending) return
    const targetPath = pending.split('?')[0]
    if (pathname === targetPath) setPending(null)
  }, [pathname, setPending])

  return (
    <Link
      href={href}
      prefetch={true}
      className={className}
      style={style}
      onClick={() => {
        // Same-path navigation (only query params change): pathname won't change so the
        // clearing effect never fires — skip pendingHref entirely for these transitions.
        if (href.split('?')[0] === pathname) return
        setPending(href)
        // Safety: clear after 5 s if the pathname never changed (e.g. navigation aborted)
        setTimeout(() => {
          if (useNavigationStore.getState().pendingHref === href) setPending(null)
        }, 5000)
      }}
    >
      {children}
    </Link>
  )
}

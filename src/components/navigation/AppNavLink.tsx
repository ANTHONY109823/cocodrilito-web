'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useNavigationStore } from '@/lib/store/navigationStore'

export function AppNavLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
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
      onClick={() => setPending(href)}
    >
      {children}
    </Link>
  )
}

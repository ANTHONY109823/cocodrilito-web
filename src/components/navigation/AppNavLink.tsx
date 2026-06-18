'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { useNavigationStore, useNavSearchStore } from '@/lib/store/navigationStore'

function hrefMatchesCurrent(href: string, pathname: string, search: string): boolean {
  const [targetPath, targetQuery = ''] = href.split('?')
  if (pathname !== targetPath) return false
  if (!targetQuery) return true
  const current = search.startsWith('?') ? search.slice(1) : search
  return current === targetQuery
}

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
  const searchParams = useSearchParams()
  const search = searchParams.size > 0 ? `?${searchParams.toString()}` : ''
  const setPending = useNavigationStore((s) => s.setPendingHref)

  useEffect(() => {
    const pending = useNavigationStore.getState().pendingHref
    if (!pending) return
    if (hrefMatchesCurrent(pending, pathname, search)) {
      setPending(null)
    }
  }, [pathname, search, setPending])

  return (
    <Link
      href={href}
      prefetch={true}
      scroll={false}
      className={className}
      style={style}
      onClick={() => {
        if (hrefMatchesCurrent(href, pathname, search)) return
        useNavSearchStore.getState().applyHref(href)
        setPending(href)
        window.setTimeout(() => {
          if (useNavigationStore.getState().pendingHref === href) setPending(null)
        }, 8000)
      }}
    >
      {children}
    </Link>
  )
}

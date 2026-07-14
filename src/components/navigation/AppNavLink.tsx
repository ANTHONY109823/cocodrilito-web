'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { useNavigationStore, useNavSearchStore } from '@/lib/store/navigationStore'

function hrefMatchesCurrent(href: string, pathname: string, search: string): boolean {
  const [targetPath, targetQuery = ''] = href.split('?')
  if (pathname !== targetPath) return false
  if (!targetQuery) return true
  const current = search.startsWith('?') ? search.slice(1) : search
  // Comparar solo params del target (ignora extras del URL actual).
  const want = new URLSearchParams(targetQuery)
  const have = new URLSearchParams(current)
  for (const [k, v] of want.entries()) {
    if (have.get(k) !== v) return false
  }
  return true
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
  const router = useRouter()
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

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (hrefMatchesCurrent(href, pathname, search)) {
      e.preventDefault()
      return
    }
    // Cambios ?tab= en la misma ruta: Link nativo a veces no navega al primer click.
    e.preventDefault()
    useNavSearchStore.getState().applyHref(href)
    setPending(href)
    window.setTimeout(() => {
      if (useNavigationStore.getState().pendingHref === href) setPending(null)
    }, 8000)
    // Sin startTransition: la navegación debe ir con prioridad alta.
    router.push(href)
  }

  return (
    <Link
      href={href}
      prefetch={true}
      scroll={false}
      className={className}
      style={style}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

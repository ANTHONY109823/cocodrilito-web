'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type MouseEvent, type ReactNode, useCallback } from 'react'

type FastNavLinkProps = {
  href: string
  className?: string
  children: ReactNode
  onNavigate?: (href: string) => void
}

/** Navegación inmediata con router.push (un solo clic, sin interferir con el router de Next). */
export function FastNavLink({ href, className, children, onNavigate }: FastNavLinkProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      const currentFull =
        pathname +
        (typeof window !== 'undefined' ? window.location.search : '')

      if (currentFull === href || (currentFull === href.split('?')[0] && !href.includes('?'))) {
        return
      }

      onNavigate?.(href)
      router.push(href)
    },
    [href, onNavigate, pathname, router]
  )

  return (
    <Link href={href} prefetch={false} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}

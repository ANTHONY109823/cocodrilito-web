'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'

/** Enlace nativo de Next.js — un clic, prefetch y transición sin bloquear el router. */
export function StudentNavLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} prefetch={true} className={className}>
      {children}
    </Link>
  )
}

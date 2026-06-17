'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { isNavActive, pageTitleForPath } from '@/lib/navigation'
import { cn } from '@/lib/utils/cn'
import { AppNavLink } from '@/components/navigation/AppNavLink'

export type DashboardNavItem = {
  href: string
  label: string
  mobileLabel?: string
  icon: LucideIcon
}

function navClass(active: boolean) {
  return cn(
    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-75',
    active
      ? 'border-l-[3px] border-[var(--color-primary)] bg-[var(--color-primary-bg)] pl-[7px] text-[var(--color-text-accent)] font-semibold'
      : 'border-l-[3px] border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-primary-bg)] hover:text-[var(--color-text-primary)]'
  )
}

export function DashboardSidebarNav({
  items,
  useQuery,
}: {
  items: DashboardNavItem[]
  useQuery: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = useQuery && searchParams.size > 0 ? `?${searchParams.toString()}` : ''

  return (
    <>
      {items.map((item) => {
        const { href, label, icon: Icon } = item
        const active = isNavActive(pathname, href, useQuery ? search : '')
        return (
          <AppNavLink key={href} href={href} className={navClass(active)}>
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </AppNavLink>
        )
      })}
    </>
  )
}

export function DashboardMobileNav({
  items,
  useQuery,
}: {
  items: DashboardNavItem[]
  useQuery: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = useQuery && searchParams.size > 0 ? `?${searchParams.toString()}` : ''

  return (
    <>
      {items.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = isNavActive(pathname, href, useQuery ? search : '')
        return (
          <AppNavLink
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-1.5 text-[11px] font-semibold min-w-[56px]',
              active
                ? 'text-[var(--color-text-accent)]'
                : 'text-[var(--color-text-muted)]'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {mobileLabel ?? label}
          </AppNavLink>
        )
      })}
    </>
  )
}

export function DashboardPageTitle({
  useQuery,
  pathname,
  role,
}: {
  useQuery: boolean
  pathname: string
  role?: string | null
}) {
  const searchParams = useSearchParams()
  const search = useQuery && searchParams.size > 0 ? `?${searchParams.toString()}` : ''
  return <>{pageTitleForPath(pathname, search, role)}</>
}

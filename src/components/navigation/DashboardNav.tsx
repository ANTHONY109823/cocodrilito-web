'use client'

import { usePathname } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { isNavActive, pageTitleForPath } from '@/lib/navigation'
import { cn } from '@/lib/utils/cn'
import { AppNavLink } from '@/components/navigation/AppNavLink'
import { useNavSearchStore } from '@/lib/store/navigationStore'

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
      ? 'border-l-[3px] border-[#318F48] bg-[rgba(49,143,72,0.12)] pl-[7px] text-[#BDFFDF]'
      : 'border-l-[3px] border-transparent text-[#A8BFB0] hover:bg-[rgba(49,143,72,0.07)] hover:text-white'
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
  const search = useNavSearchStore((s) => s.search)

  return (
    <>
      {items.map((item) => {
        const { href, label, icon: Icon } = item
        const active = isNavActive(pathname, href, useQuery ? search : '')
        return (
          <AppNavLink
            key={href}
            href={href}
            trackQuery={useQuery}
            className={navClass(active)}
          >
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
  const search = useNavSearchStore((s) => s.search)

  return (
    <>
      {items.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = isNavActive(pathname, href, useQuery ? search : '')
        return (
          <AppNavLink
            key={href}
            href={href}
            trackQuery={useQuery}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
              active ? 'text-[#BDFFDF]' : 'text-[#6B8A75]'
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
  const search = useNavSearchStore((s) => (useQuery ? s.search : ''))
  return <>{pageTitleForPath(pathname, search, role)}</>
}

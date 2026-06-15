'use client'

import { Suspense, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { isNavActive } from '@/lib/navigation'
import { cn } from '@/lib/utils/cn'
import { FastNavLink } from '@/components/navigation/FastNavLink'
import { StudentNavLink } from '@/components/navigation/StudentNavLink'

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

function StudentSidebarNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()

  return (
    <>
      {items.map((item) => {
        const { href, label, icon: Icon } = item
        const active = isNavActive(pathname, href, '')
        return (
          <StudentNavLink key={href} href={href} className={navClass(active)}>
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </StudentNavLink>
        )
      })}
    </>
  )
}

function StudentMobileNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()

  return (
    <>
      {items.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = isNavActive(pathname, href, '')
        return (
          <StudentNavLink
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
              active ? 'text-[#BDFFDF]' : 'text-[#6B8A75]'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {mobileLabel ?? label}
          </StudentNavLink>
        )
      })}
    </>
  )
}

function AdminSidebarNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString() ? `?${searchParams.toString()}` : ''

  return (
    <>
      {items.map((item) => {
        const { href, label, icon: Icon } = item
        const active = isNavActive(pathname, href, search)
        return (
          <FastNavLink key={href} href={href} className={navClass(active)}>
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </FastNavLink>
        )
      })}
    </>
  )
}

function AdminSidebarFallback({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()

  return (
    <>
      {items.map((item) => {
        const { href, label, icon: Icon } = item
        const active = isNavActive(pathname, href, '')
        return (
          <FastNavLink key={href} href={href} className={navClass(active)}>
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </FastNavLink>
        )
      })}
    </>
  )
}

function AdminMobileNav({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString() ? `?${searchParams.toString()}` : ''

  return (
    <>
      {items.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = isNavActive(pathname, href, search)
        return (
          <FastNavLink
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
              active ? 'text-[#BDFFDF]' : 'text-[#6B8A75]'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {mobileLabel ?? label}
          </FastNavLink>
        )
      })}
    </>
  )
}

function AdminMobileFallback({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()

  return (
    <>
      {items.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = isNavActive(pathname, href, '')
        return (
          <FastNavLink
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
              active ? 'text-[#BDFFDF]' : 'text-[#6B8A75]'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {mobileLabel ?? label}
          </FastNavLink>
        )
      })}
    </>
  )
}

export function DashboardSidebarNav({
  items,
  useQuery,
}: {
  items: DashboardNavItem[]
  useQuery: boolean
}) {
  if (!useQuery) {
    return <StudentSidebarNav items={items} />
  }

  return (
    <Suspense fallback={<AdminSidebarFallback items={items} />}>
      <AdminSidebarNav items={items} />
    </Suspense>
  )
}

export function DashboardMobileNav({
  items,
  useQuery,
}: {
  items: DashboardNavItem[]
  useQuery: boolean
}) {
  if (!useQuery) {
    return <StudentMobileNav items={items} />
  }

  return (
    <Suspense fallback={<AdminMobileFallback items={items} />}>
      <AdminMobileNav items={items} />
    </Suspense>
  )
}

export function DashboardPageSearch({
  useQuery,
  children,
}: {
  useQuery: boolean
  children: (search: string) => React.ReactNode
}) {
  if (!useQuery) {
    return <>{children('')}</>
  }

  return (
    <Suspense fallback={<>{children('')}</>}>
      <DashboardPageSearchInner>{children}</DashboardPageSearchInner>
    </Suspense>
  )
}

function DashboardPageSearchInner({
  children,
}: {
  children: (search: string) => React.ReactNode
}) {
  const searchParams = useSearchParams()
  const qs = searchParams.toString()
  const search = qs ? `?${qs}` : ''
  return <>{children(search)}</>
}

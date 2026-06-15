'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { type LucideIcon } from 'lucide-react'
import { isNavActive } from '@/lib/navigation'
import { cn } from '@/lib/utils/cn'
import { FastNavLink } from '@/components/navigation/FastNavLink'

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

function resolveActive(
  pathname: string,
  search: string,
  href: string,
  optimisticHref: string | null
): boolean {
  if (optimisticHref === href) return true
  return isNavActive(pathname, href, search)
}

function SidebarNavList({
  items,
  useQuery,
}: {
  items: DashboardNavItem[]
  useQuery: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = useQuery && searchParams.toString() ? `?${searchParams.toString()}` : ''
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null)

  useEffect(() => {
    setOptimisticHref(null)
  }, [pathname, search])

  return (
    <>
      {items.map((item) => {
        const { href, label, icon: Icon } = item
        const active = resolveActive(pathname, search, href, optimisticHref)
        return (
          <FastNavLink
            key={href}
            href={href}
            className={navClass(active)}
            onNavigate={setOptimisticHref}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
          </FastNavLink>
        )
      })}
    </>
  )
}

function SidebarNavFallback({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null)

  useEffect(() => {
    setOptimisticHref(null)
  }, [pathname])

  return (
    <>
      {items.map((item) => {
        const { href, label, icon: Icon } = item
        const active = resolveActive(pathname, '', href, optimisticHref)
        return (
          <FastNavLink
            key={href}
            href={href}
            className={navClass(active)}
            onNavigate={setOptimisticHref}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {label}
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
    return <SidebarNavFallback items={items} />
  }

  return (
    <Suspense fallback={<SidebarNavFallback items={items} />}>
      <SidebarNavList items={items} useQuery />
    </Suspense>
  )
}

function MobileNavList({
  items,
  useQuery,
}: {
  items: DashboardNavItem[]
  useQuery: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = useQuery && searchParams.toString() ? `?${searchParams.toString()}` : ''
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null)

  useEffect(() => {
    setOptimisticHref(null)
  }, [pathname, search])

  return (
    <>
      {items.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = resolveActive(pathname, search, href, optimisticHref)
        return (
          <FastNavLink
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
              active ? 'text-[#BDFFDF]' : 'text-[#6B8A75]'
            )}
            onNavigate={setOptimisticHref}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {mobileLabel ?? label}
          </FastNavLink>
        )
      })}
    </>
  )
}

function MobileNavFallback({ items }: { items: DashboardNavItem[] }) {
  const pathname = usePathname()
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null)

  useEffect(() => {
    setOptimisticHref(null)
  }, [pathname])

  return (
    <>
      {items.map(({ href, label, mobileLabel, icon: Icon }) => {
        const active = resolveActive(pathname, '', href, optimisticHref)
        return (
          <FastNavLink
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
              active ? 'text-[#BDFFDF]' : 'text-[#6B8A75]'
            )}
            onNavigate={setOptimisticHref}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            {mobileLabel ?? label}
          </FastNavLink>
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
  if (!useQuery) {
    return <MobileNavFallback items={items} />
  }

  return (
    <Suspense fallback={<MobileNavFallback items={items} />}>
      <MobileNavList items={items} useQuery />
    </Suspense>
  )
}

export function useDashboardPageSearch(useQuery: boolean): string {
  if (!useQuery) return ''
  const searchParams = useSearchParams()
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
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
  const search = useDashboardPageSearch(true)
  return <>{children(search)}</>
}

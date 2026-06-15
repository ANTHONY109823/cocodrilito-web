'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'
import { useAuthStore } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { getNavContext } from '@/lib/auth/roles'
import { resolveUserTrackKey } from '@/lib/constants/trackTypes'
import {
  STUDENT_NAV,
  SUPERADMIN_NAV,
  TENANT_ADMIN_NAV,
  type NavItem,
} from '@/lib/navigation'
import { useNavSearchStore } from '@/lib/store/navigationStore'

function collectHrefs(navContext: ReturnType<typeof getNavContext>): string[] {
  const items: NavItem[] =
    navContext === 'superadmin'
      ? SUPERADMIN_NAV
      : navContext === 'tenant-admin'
        ? TENANT_ADMIN_NAV
        : STUDENT_NAV

  const hrefs = items.map((i) => i.href)
  if (navContext === 'superadmin') hrefs.push('/exams')
  if (navContext === 'tenant-admin') hrefs.push('/admin/configuracion')
  if (navContext === 'student') hrefs.push('/dashboard')
  return [...new Set(hrefs)]
}

/** Precarga rutas y APIs en segundo plano para todos los roles. */
export function useDashboardRoutePrefetch() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const impersonating = useImpersonationStore((s) => s.active)
  const navContext = getNavContext(user?.role, impersonating)
  const trackKey = resolveUserTrackKey(user)
  const syncFromWindow = useNavSearchStore((s) => s.syncFromWindow)

  useEffect(() => {
    syncFromWindow()
  }, [pathname, syncFromWindow])

  useEffect(() => {
    if (!user) return

    const hrefs = collectHrefs(navContext)
    hrefs.forEach((href) => {
      try {
        router.prefetch(href.split('?')[0])
      } catch {
        /* ignore */
      }
    })

    if (navContext !== 'student') return

    const prefetchData = () => {
      void mutate(
        '/rankings/global?period=weekly',
        () => swrFetcher('/rankings/global?period=weekly'),
        { revalidate: false }
      )
      void mutate(
        '/rankings/me?period=weekly',
        () => swrFetcher('/rankings/me?period=weekly'),
        { revalidate: false }
      )
      void mutate('/exams/list', () => swrFetcher('/exams/list'), { revalidate: false })
      void mutate('/categories', () => swrFetcher('/categories'), { revalidate: false })
      void mutate(
        `/exams/question-counts?track=${encodeURIComponent(trackKey)}`,
        () => swrFetcher(`/exams/question-counts?track=${encodeURIComponent(trackKey)}`),
        { revalidate: false }
      )
    }

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetchData, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }

    const t = window.setTimeout(prefetchData, 200)
    return () => window.clearTimeout(t)
  }, [user, navContext, router, trackKey, impersonating])
}

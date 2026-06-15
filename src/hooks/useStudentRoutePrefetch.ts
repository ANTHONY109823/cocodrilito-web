'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { swrFetcher } from '@/lib/swr/fetcher'
import { useAuthStore } from '@/lib/store/authStore'
import { resolveUserTrackKey } from '@/lib/constants/trackTypes'

const STUDENT_ROUTES = ['/exams', '/ranking', '/history', '/profile'] as const

/**
 * Precarga rutas pesadas y datos SWR en segundo plano (alumno en dashboard).
 */
export function useStudentRoutePrefetch(enabled: boolean) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const trackKey = resolveUserTrackKey(user)

  useEffect(() => {
    if (!enabled) return

    STUDENT_ROUTES.forEach((route) => {
      try {
        router.prefetch(route)
      } catch {
        /* ignore */
      }
    })

    const run = () => {
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
      const id = window.requestIdleCallback(run, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }

    const t = window.setTimeout(run, 300)
    return () => window.clearTimeout(t)
  }, [enabled, router, trackKey])
}

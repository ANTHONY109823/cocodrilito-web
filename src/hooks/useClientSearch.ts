'use client'

import { usePathname } from 'next/navigation'
import { useMemo, useSyncExternalStore } from 'react'

type HistoryWithPatch = History & { __cocodrilitoSearchPatched?: boolean }

const searchListeners = new Set<() => void>()

function notifySearchChange() {
  searchListeners.forEach((listener) => listener())
}

function ensureHistoryPatched() {
  if (typeof window === 'undefined') return
  const historyRef = window.history as HistoryWithPatch
  if (historyRef.__cocodrilitoSearchPatched) return

  const { pushState, replaceState } = historyRef
  historyRef.pushState = function (...args) {
    const result = pushState.apply(this, args)
    notifySearchChange()
    return result
  }
  historyRef.replaceState = function (...args) {
    const result = replaceState.apply(this, args)
    notifySearchChange()
    return result
  }
  historyRef.__cocodrilitoSearchPatched = true
}

function subscribeToSearch(onChange: () => void) {
  ensureHistoryPatched()
  searchListeners.add(onChange)
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', onChange)
  }
  return () => {
    searchListeners.delete(onChange)
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', onChange)
    }
  }
}

function getSearchSnapshot(): string {
  if (typeof window === 'undefined') return ''
  return window.location.search
}

/**
 * Query string reactivo sin useSearchParams (evita Suspense en el shell).
 * Escucha pushState/replaceState para tabs ?tab= en /admin y /superadmin.
 */
export function useClientSearchString(): string {
  usePathname()
  return useSyncExternalStore(subscribeToSearch, getSearchSnapshot, () => '')
}

export function useClientSearchParam(name: string): string | null {
  const search = useClientSearchString()
  return useMemo(() => new URLSearchParams(search).get(name), [search, name])
}

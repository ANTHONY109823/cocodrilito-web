'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

function readSearch(): string {
  if (typeof window === 'undefined') return ''
  return window.location.search
}

/** Lee ?query sin useSearchParams (evita Suspense y parpadeos al navegar). */
export function useClientSearchString(): string {
  const pathname = usePathname()
  const [search, setSearch] = useState(readSearch)

  useEffect(() => {
    setSearch(readSearch())
  }, [pathname])

  return search
}

export function useClientSearchParam(name: string): string | null {
  const search = useClientSearchString()
  return useMemo(() => new URLSearchParams(search).get(name), [search, name])
}

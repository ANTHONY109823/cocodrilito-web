'use client'

import { useEffect } from 'react'
import { useColorSchemeStore } from '@/lib/store/colorSchemeStore'

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useColorSchemeStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return children
}

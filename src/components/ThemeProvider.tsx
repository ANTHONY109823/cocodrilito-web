'use client'

import { createContext, useContext, useEffect, useMemo } from 'react'
import type { TenantConfig } from '@/lib/api/tenants'
import { POLICE_GREEN, POLICE_GREEN_DARK } from '@/lib/constants/theme'

interface ThemeContextValue {
  config: TenantConfig | null
}

const ThemeContext = createContext<ThemeContextValue>({ config: null })

export function useThemeConfig() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  config: TenantConfig | null
  children: React.ReactNode
}

export function ThemeProvider({ config, children }: ThemeProviderProps) {
  const primary = config?.primaryColor || POLICE_GREEN
  const dark = POLICE_GREEN_DARK

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', primary)
    root.style.setProperty('--color-primary-dark', dark)
    root.style.setProperty('--brand-gradient', `linear-gradient(135deg, ${primary}, ${dark})`)

    return () => {
      root.style.setProperty('--color-primary', POLICE_GREEN)
      root.style.setProperty('--color-primary-dark', POLICE_GREEN_DARK)
      root.style.setProperty('--brand-gradient', `linear-gradient(135deg, ${POLICE_GREEN}, ${POLICE_GREEN_DARK})`)
    }
  }, [primary, dark])

  const value = useMemo(() => ({ config }), [config])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

'use client'

import { Moon, Sun } from 'lucide-react'
import { useColorSchemeStore } from '@/lib/store/colorSchemeStore'
import { cn } from '@/lib/utils/cn'

interface ThemeToggleProps {
  className?: string
  /** Solo icono, sin etiqueta de texto */
  compact?: boolean
  /** Etiqueta visible en modo compacto para accesibilidad */
  showLabel?: boolean
}

export function ThemeToggle({ className, compact = false, showLabel = true }: ThemeToggleProps) {
  const scheme = useColorSchemeStore((s) => s.scheme)
  const toggle = useColorSchemeStore((s) => s.toggle)
  const isLight = scheme === 'light'

  const label = isLight ? 'Tema oscuro' : 'Tema claro'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'theme-toggle inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all',
        compact && !showLabel ? 'h-10 w-10 p-0' : 'h-10 px-3.5 text-xs',
        className
      )}
    >
      {isLight ? <Moon className="h-4 w-4 shrink-0" aria-hidden /> : <Sun className="h-4 w-4 shrink-0" aria-hidden />}
      {(!compact || showLabel) && <span>{isLight ? 'Oscuro' : 'Claro'}</span>}
    </button>
  )
}

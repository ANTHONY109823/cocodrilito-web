'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

/** Botón flotante siempre visible (esquina superior izquierda, lejos del WhatsApp) */
export function GlobalThemeToggle() {
  const pathname = usePathname()
  // El login ya incluye su propio toggle junto al formulario
  if (pathname === '/login') return null

  return (
    <div
      className="fixed z-[10000] pointer-events-none"
      style={{
        top: 'max(0.75rem, env(safe-area-inset-top))',
        left: 'max(0.75rem, env(safe-area-inset-left))',
      }}
    >
      <div className="pointer-events-auto">
        <ThemeToggle compact className="shadow-xl" />
      </div>
    </div>
  )
}

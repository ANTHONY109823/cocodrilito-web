'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

const AUTH_ROUTES = new Set(['/login', '/register', '/cambiar-clave'])

/** Botón flotante visible en login y en móvil dentro del dashboard */
export function GlobalThemeToggle() {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.has(pathname)

  return (
    <div
      className={`fixed z-[70] pointer-events-none ${isAuthRoute ? '' : 'lg:hidden'}`}
      style={{
        top: 'max(0.75rem, env(safe-area-inset-top))',
        right: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      <div className="pointer-events-auto">
        <ThemeToggle compact className="shadow-lg backdrop-blur-md" />
      </div>
    </div>
  )
}

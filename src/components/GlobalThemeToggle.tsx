'use client'

import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

const SHELL_ROUTES = [
  '/dashboard',
  '/admin',
  '/exams',
  '/superadmin',
  '/profile',
  '/ranking',
  '/history',
  '/premium',
  '/exam/',
  '/result/',
  '/review/',
  '/cambiar-clave',
  '/login',
  '/register',
]

/** Botón flotante solo en páginas sin shell propio */
export function GlobalThemeToggle() {
  const pathname = usePathname()
  if (SHELL_ROUTES.some((route) => pathname === route || pathname.startsWith(route))) {
    return null
  }

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

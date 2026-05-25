'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Crown,
  FileText,
  History,
  Home,
  LogOut,
  LucideIcon,
  Shield,
  Star,
  Trophy,
  User,
} from 'lucide-react'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/authStore'
import { isAnyAdmin, isSuperAdmin } from '@/lib/auth/roles'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { cn } from '@/lib/utils/cn'

const MAIN_NAV = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/exams', label: 'Exámenes', icon: FileText },
  { href: '/history', label: 'Historial', icon: History },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/premium', label: 'Premium', icon: Star },
] as const

const MOBILE_NAV = MAIN_NAV

function roleLabel(role?: string) {
  if (!role) return 'Estudiante'
  if (isSuperAdmin(role)) return 'SuperAdmin'
  if (role.includes('Academia') || role === 'AdminAcademia' || role === '2') return 'Admin Academia'
  if (role.includes('Agencia') || role === 'AdminAgencia' || role === '1') return 'Admin Agencia'
  if (isAnyAdmin(role)) return 'Admin'
  return 'Estudiante'
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-all duration-150',
        active
          ? 'border-l-[3px] border-[#4A7C59] bg-[#4A7C59]/15 pl-[7px] text-[#4A7C59]'
          : 'border-l-[3px] border-transparent text-[#A8BFB0] hover:bg-[#1E3328] hover:text-white'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      {label}
    </Link>
  )
}

function pageTitle(pathname: string) {
  const map: Record<string, string> = {
    '/dashboard': 'Inicio',
    '/exams': 'Exámenes',
    '/history': 'Historial',
    '/ranking': 'Ranking',
    '/premium': 'Premium',
    '/profile': 'Mi Perfil',
    '/admin': 'Admin',
    '/superadmin': 'SuperAdmin',
  }
  if (pathname.startsWith('/superadmin')) return 'SuperAdmin'
  if (pathname.startsWith('/admin')) return 'Admin'
  return map[pathname] ?? 'Cocodrilito'
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const isAdmin = isAnyAdmin(user?.role)
  const superAdmin = isSuperAdmin(user?.role)
  const brandName = user?.tenantName || 'Cocodrilito'
  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      /* ignore */
    }
    logout()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F0D]">
      <ImpersonationBanner />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar desktop */}
        <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-[#1E3328] bg-[#111A14] px-3.5 py-5">
          <div className="mb-3 flex items-center gap-2 px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4A7C59] text-base">
              🐊
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">{brandName}</div>
              <div className="text-[10px] text-[#6B8A75]">{roleLabel(user?.role)}</div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5">
            {MAIN_NAV.map((item) => (
              <SidebarNavItem key={item.href} {...item} active={isActive(item.href)} />
            ))}
            {(isAdmin || superAdmin) && (
              <div className="my-2 h-px bg-[#1E3328]" />
            )}
            {isAdmin && (
              <SidebarNavItem href="/admin" label="Admin" icon={Shield} active={isActive('/admin')} />
            )}
            {superAdmin && (
              <SidebarNavItem
                href="/superadmin"
                label="SuperAdmin"
                icon={Crown}
                active={isActive('/superadmin')}
              />
            )}
            <div className="my-2 h-px bg-[#1E3328]" />
            <SidebarNavItem href="/profile" label="Mi Perfil" icon={User} active={isActive('/profile')} />
          </nav>

          <div className="mt-auto space-y-2 pt-4">
            <div className="flex items-center gap-2 rounded-[10px] border border-[#1E3328] bg-[#0A0F0D] p-2.5">
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-[11px] font-bold text-[#6B9E7A]">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-white">{user?.fullName}</div>
                <div className="text-[10px] text-[#4A7C59]">{roleLabel(user?.role)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[#A8BFB0] transition-colors hover:bg-[#1E3328] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Área principal */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="hidden lg:flex items-center justify-between border-b border-[#1E3328] bg-[#0A0F0D] px-8 py-4">
            <div>
              <p className="text-xs text-[#6B8A75]">Cocodrilito</p>
              <h1 className="text-lg font-bold text-white">{pageTitle(pathname)}</h1>
            </div>
            <Link
              href="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2D5A3D] text-xs font-bold text-[#6B9E7A] hover:ring-2 hover:ring-[#4A7C59]/40"
            >
              {initials}
            </Link>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      {/* Bottom nav móvil */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#1E3328] bg-[#111A14] px-2 py-2 safe-area-pb">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
                active ? 'text-[#4A7C59]' : 'text-[#6B8A75]'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {label.split(' ')[0]}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

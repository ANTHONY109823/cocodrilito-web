'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, LucideIcon } from 'lucide-react'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { getNavContext, isSuperAdmin } from '@/lib/auth/roles'
import {
  isNavActive,
  pageTitleForPath,
  STUDENT_NAV,
  SUPERADMIN_NAV,
  TENANT_ADMIN_NAV,
} from '@/lib/navigation'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { cn } from '@/lib/utils/cn'
import { BRAND_APP, BRAND_PLATFORM } from '@/lib/constants/brand'
import { redirectToLogin } from '@/lib/auth/logoutRedirect'
import { useTenantConfig } from '@/hooks/useTenantConfig'
import { useClientSearchString } from '@/hooks/useClientSearch'

function roleLabel(role?: string) {
  if (!role) return 'Estudiante'
  if (isSuperAdmin(role)) return 'SuperAdmin'
  if (role.includes('Academia') || role === 'AdminAcademia') return 'Admin Academia'
  if (role.includes('Agencia') || role === 'AdminAgencia') return 'Admin Agencia'
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
      prefetch={true}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-all duration-150',
        active
          ? 'border-l-[3px] border-[#318F48] bg-[rgba(49,143,72,0.12)] pl-[7px] text-[#BDFFDF]'
          : 'border-l-[3px] border-transparent text-[#A8BFB0] hover:bg-[rgba(49,143,72,0.07)] hover:text-white'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      {label}
    </Link>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const search = useClientSearchString()
  const { user, logout } = useAuthStore()
  const { active: impersonating, stopImpersonation } = useImpersonationStore()

  const navContext = getNavContext(user?.role, impersonating)
  const { config: tenantConfig } = useTenantConfig(user?.tenantSlug)
  const brandName = navContext === 'superadmin'
    ? BRAND_APP
    : (user?.tenantName || tenantConfig?.name || BRAND_APP)
  const brandLogo =
    navContext === 'superadmin'
      ? null
      : (user?.tenantLogoUrl ?? tenantConfig?.logoUrl ?? null)

  const navItems =
    navContext === 'superadmin'
      ? SUPERADMIN_NAV
      : navContext === 'tenant-admin'
        ? TENANT_ADMIN_NAV
        : STUDENT_NAV

  const mobileNav = navContext === 'student' ? STUDENT_NAV : navItems.slice(0, 5)

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

  const hideMobileNav =
    pathname.startsWith('/exam/') ||
    pathname.startsWith('/result/') ||
    pathname.startsWith('/review/')

  const handleLogout = () => {
    stopImpersonation()
    logout()
    void authApi.logout().catch(() => {})
    redirectToLogin()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080E0A]">
      <ImpersonationBanner />

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-[rgba(189,255,223,0.12)] bg-[#0D1A10] px-3.5 py-5">
          <div className="mb-3 flex items-center gap-2 px-2.5 py-2">
            {brandLogo ? (
              <Image
                src={brandLogo}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 shrink-0 rounded-lg object-contain bg-white/5"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#318F48] text-base">
                🐊
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-[#BDFFDF] leading-tight">
                {brandName}
              </div>
              <span className="inline-block rounded-full border border-[rgba(49,143,72,0.3)] bg-[rgba(49,143,72,0.15)] px-1.5 py-0.5 text-[10px] text-[#BDFFDF]">
                {roleLabel(user?.role)}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                {...item}
                active={isNavActive(pathname, item.href, search)}
              />
            ))}

            {navContext === 'superadmin' && (
              <>
                <div className="my-2 h-px bg-[rgba(189,255,223,0.12)]" />
                <Link
                  href="/exams"
                  className="px-2.5 py-1.5 text-[10px] text-[#6B8A75] hover:text-[#A8BFB0] transition-colors"
                  title="Probar simulacros sin afectar métricas"
                >
                  Modo prueba examen
                </Link>
              </>
            )}
          </nav>

          <div className="mt-auto space-y-2 pt-4">
            <div className="flex items-center gap-2 rounded-[10px] border border-[rgba(189,255,223,0.12)] bg-[#080E0A] p-2.5">
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#1A5C2E] text-[11px] font-bold text-[#BDFFDF]">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-white">{user?.fullName}</div>
                <div className="text-[10px] text-[#BDFFDF]">{roleLabel(user?.role)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[#A8BFB0] transition-colors hover:bg-[rgba(49,143,72,0.07)] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          <header className="hidden lg:flex items-center justify-between border-b border-[rgba(189,255,223,0.12)] bg-[#080E0A] px-8 py-4">
            <div className="flex items-center gap-3">
              {brandLogo && (
                <Image
                  src={brandLogo}
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded object-contain"
                />
              )}
              <div>
                <p className="text-xs text-[#6B8A75]">
                  {navContext === 'superadmin' ? BRAND_PLATFORM : brandName}
                </p>
                <h1 className="text-lg font-bold text-white">
                  {pageTitleForPath(pathname, search, user?.role)}
                </h1>
              </div>
            </div>
            {navContext === 'tenant-admin' ? (
              <Link
                href="/admin/configuracion"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A5C2E] text-xs font-bold text-[#BDFFDF] hover:ring-2 hover:ring-[#318F48]/40"
              >
                {initials}
              </Link>
            ) : navContext === 'student' ? (
              <Link
                href="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A5C2E] text-xs font-bold text-[#BDFFDF] hover:ring-2 hover:ring-[#318F48]/40"
              >
                {initials}
              </Link>
            ) : null}
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      <nav className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[rgba(189,255,223,0.12)] bg-[#0D1A10] px-2 py-2 safe-area-pb',
        hideMobileNav && 'hidden'
      )}>
        {mobileNav.map(({ href, label, mobileLabel, icon: Icon }) => {
          const active = isNavActive(pathname, href, search)
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium',
                active ? 'text-[#BDFFDF]' : 'text-[#6B8A75]'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {mobileLabel ?? label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

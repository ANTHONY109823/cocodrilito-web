import { BRAND_APP } from '@/lib/constants/brand'
import {
  Building2,
  FileText,
  History,
  Home,
  Library,
  LucideIcon,
  ScrollText,
  Settings,
  Trophy,
  User,
  Users,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  /** Etiqueta corta para bottom nav móvil (380px). Si no se define, se usa `label`. */
  mobileLabel?: string
  icon: LucideIcon
}

export const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/exams', label: 'Exámenes', icon: FileText },
  { href: '/history', label: 'Historial', icon: History },
  { href: '/ranking', label: 'Mi rango', mobileLabel: 'Rango', icon: Trophy },
  { href: '/profile', label: 'Mi Perfil', mobileLabel: 'Perfil', icon: User },
]

export const SUPERADMIN_NAV: NavItem[] = [
  { href: '/superadmin?tab=inicio', label: 'Inicio', icon: Home },
  { href: '/superadmin?tab=agencias', label: 'Agencias', icon: Building2 },
  { href: '/superadmin/preguntas', label: 'Banco de Preguntas', icon: Library },
  { href: '/superadmin?tab=audit', label: 'Audit Log', icon: ScrollText },
]

export const TENANT_ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Inicio', icon: Home },
  { href: '/admin?tab=users&sub=activos', label: 'Usuarios', icon: Users },
  {
    href: '/admin/preguntas',
    label: 'Preguntas de exámenes',
    mobileLabel: 'Preguntas',
    icon: Library,
  },
  {
    href: '/exams',
    label: 'Modo prueba examen',
    mobileLabel: 'Prueba',
    icon: FileText,
  },
  {
    href: '/admin/configuracion',
    label: 'Configuración',
    mobileLabel: 'Config',
    icon: Settings,
  },
]

export function isTenantAdminRole(role?: string | null): boolean {
  return role === 'AdminAgencia' || role === 'AdminAcademia'
}

export function pageTitleForPath(pathname: string, search?: string, role?: string | null): string {
  if (isTenantAdminRole(role)) {
    if (
      pathname === '/exams' ||
      pathname.startsWith('/exam/') ||
      pathname.startsWith('/result/') ||
      pathname.startsWith('/review/')
    ) {
      return 'Modo prueba examen'
    }
  }
  if (pathname.startsWith('/superadmin/preguntas')) return 'Banco de Preguntas de Ascenso'
  if (pathname.startsWith('/superadmin')) {
    const tab = new URLSearchParams(search ?? '').get('tab')
    const map: Record<string, string> = {
      inicio: 'Inicio',
      agencias: 'Agencias',
      academias: 'Agencias',
      audit: 'Audit Log',
    }
    return map[tab ?? ''] ?? 'Inicio'
  }
  if (pathname.startsWith('/admin/configuracion')) return 'Configuración'
  if (pathname.startsWith('/admin/preguntas')) return 'Preguntas de exámenes'
  if (pathname.startsWith('/admin')) {
    const params = new URLSearchParams(search ?? '')
    const tab = params.get('tab')
    const sub = params.get('sub')
    if (tab === 'users') {
      const subMap: Record<string, string> = {
        activos: 'Usuarios activos',
        inactivos: 'Usuarios inactivos',
        crear: 'Crear usuario',
      }
      return subMap[sub ?? 'activos'] ?? 'Usuarios'
    }
    return 'Inicio'
  }
  const map: Record<string, string> = {
    '/dashboard': 'Inicio',
    '/exams': 'Exámenes',
    '/history': 'Historial',
    '/ranking': 'Mi rango',
    '/premium': 'Premium',
    '/profile': 'Mi Perfil',
  }
  return map[pathname] ?? BRAND_APP
}

export function isNavActive(pathname: string, href: string, search?: string): boolean {
  const [path, query] = href.split('?')
  const currentParams = new URLSearchParams(search ?? '')

  if (pathname === '/exams' && path === '/exams') {
    return true
  }
  if (
    (pathname.startsWith('/exam/') || pathname.startsWith('/result/') || pathname.startsWith('/review/')) &&
    path === '/exams'
  ) {
    return true
  }
  if (pathname.startsWith('/admin/preguntas') && path === '/admin/preguntas') {
    return true
  }
  if (pathname.startsWith('/admin/configuracion') && path === '/admin/configuracion') {
    return true
  }

  if (query) {
    const params = new URLSearchParams(query)
    const tab = params.get('tab')
    const sub = params.get('sub')

    if (tab && path === '/superadmin' && pathname === '/superadmin') {
      const currentTab = currentParams.get('tab') ?? 'inicio'
      return currentTab === tab && (sub ? currentParams.get('sub') === sub : true)
    }

    if (tab && pathname.startsWith('/admin')) {
      const currentTab = currentParams.get('tab')
      if (tab === 'users') {
        return currentTab === 'users' ||
          currentTab === 'inactive' ||
          currentTab === 'create' ||
          (currentTab === null && false)
      }
      return currentTab === tab && (sub ? currentParams.get('sub') === sub : true)
    }
  }

  if (path === '/admin' && pathname.startsWith('/admin') &&
      !pathname.includes('/admin/preguntas') &&
      !pathname.includes('/admin/configuracion')) {
    const currentTab = currentParams.get('tab')
    return !currentTab || currentTab === 'dashboard' ||
      currentTab === 'ventas' || currentTab === 'subscriptions' || currentTab === 'plans'
  }

  return pathname === path || (path !== '/exams' && pathname.startsWith(`${path}/`))
}

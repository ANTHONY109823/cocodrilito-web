import { BRAND_APP } from '@/lib/constants/brand'
import {
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  History,
  Home,
  Library,
  LucideIcon,
  ScrollText,
  Settings,
  Shield,
  Star,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/exams', label: 'Exámenes', icon: FileText },
  { href: '/history', label: 'Historial', icon: History },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/premium', label: 'Premium', icon: Star },
]

export const SUPERADMIN_NAV: NavItem[] = [
  { href: '/superadmin?tab=agencias', label: 'Agencias', icon: Building2 },
  { href: '/superadmin?tab=academias', label: 'Academias', icon: GraduationCap },
  { href: '/superadmin/preguntas', label: 'Banco de Preguntas', icon: Library },
  { href: '/superadmin?tab=aprobaciones', label: 'Aprobaciones', icon: ClipboardCheck },
  { href: '/superadmin?tab=audit', label: 'Audit Log', icon: ScrollText },
]

export const TENANT_ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Inicio', icon: Home },
  { href: '/admin?tab=users', label: 'Usuarios', icon: Users },
  { href: '/exams', label: 'Exámenes', icon: FileText },
  { href: '/admin/preguntas', label: 'Banco de Preguntas', icon: Library },
  { href: '/admin?tab=subscriptions', label: 'Ventas', icon: Wallet },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export function pageTitleForPath(pathname: string, search?: string): string {
  if (pathname.startsWith('/superadmin/preguntas')) return 'Banco de Preguntas de Ascenso'
  if (pathname.startsWith('/superadmin')) {
    const tab = new URLSearchParams(search ?? '').get('tab')
    const map: Record<string, string> = {
      agencias: 'Agencias',
      academias: 'Academias',
      aprobaciones: 'Aprobaciones',
      audit: 'Audit Log',
    }
    return map[tab ?? ''] ?? 'SuperAdmin'
  }
  if (pathname.startsWith('/admin/configuracion')) return 'Configuración'
  if (pathname.startsWith('/admin/preguntas')) return 'Banco de Preguntas'
  if (pathname.startsWith('/admin')) {
    const tab = new URLSearchParams(search ?? '').get('tab')
    const map: Record<string, string> = {
      users: 'Usuarios',
      subscriptions: 'Ventas',
      inactive: 'Usuarios inactivos',
      create: 'Crear usuario',
    }
    return map[tab ?? ''] ?? 'Panel Admin'
  }
  const map: Record<string, string> = {
    '/dashboard': 'Inicio',
    '/exams': 'Exámenes',
    '/history': 'Historial',
    '/ranking': 'Ranking',
    '/premium': 'Premium',
    '/profile': 'Mi Perfil',
  }
  return map[pathname] ?? BRAND_APP
}

export function isNavActive(pathname: string, href: string, search?: string): boolean {
  const [path, query] = href.split('?')
  if (query) {
    const params = new URLSearchParams(query)
    const tab = params.get('tab')
    if (tab && pathname.startsWith('/superadmin') || pathname.startsWith('/admin')) {
      return pathname.startsWith(path) && new URLSearchParams(search ?? '').get('tab') === tab
    }
  }
  if (path === '/admin' && pathname.startsWith('/admin') && !pathname.includes('/admin/preguntas') && !pathname.includes('/admin/configuracion')) {
    return !new URLSearchParams(search ?? '').get('tab')
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

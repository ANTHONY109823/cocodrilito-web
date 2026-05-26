export function isAnyAdmin(role?: string | null): boolean {
  if (!role) return false
  return role === 'AdminAgencia' || role === 'AdminAcademia' || role === 'SuperAdmin'
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'SuperAdmin'
}

export function isTenantAdmin(role?: string | null): boolean {
  return role === 'AdminAgencia' || role === 'AdminAcademia'
}

export function isAdminAgencia(role?: string | null, tenantType?: string | null): boolean {
  return role === 'AdminAgencia' || tenantType === 'Agencia'
}

export function isAdminAcademia(role?: string | null, tenantType?: string | null): boolean {
  return role === 'AdminAcademia' || tenantType === 'Academia'
}

export type NavContext = 'student' | 'superadmin' | 'tenant-admin'

/** SuperAdmin real (no impersonando) → panel global. Impersonación → panel de agencia/academia. */
export function getNavContext(
  role?: string | null,
  impersonating?: boolean
): NavContext {
  if (impersonating && isTenantAdmin(role)) return 'tenant-admin'
  if (isSuperAdmin(role)) return 'superadmin'
  if (isTenantAdmin(role)) return 'tenant-admin'
  return 'student'
}

export type TenantBadge = 'AGENCIA' | 'ACADEMIA'

export function getTenantBadge(
  role?: string | null,
  tenantType?: string | null
): TenantBadge | null {
  if (isAdminAgencia(role, tenantType)) return 'AGENCIA'
  if (isAdminAcademia(role, tenantType)) return 'ACADEMIA'
  return null
}

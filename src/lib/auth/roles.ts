export function isAnyAdmin(role?: string | null): boolean {
  if (!role) return false
  return role === 'AdminAgencia' || role === 'AdminAcademia' || role === 'SuperAdmin'
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'SuperAdmin'
}

export function isAdminAgencia(role?: string | null, tenantType?: string | null): boolean {
  return role === 'AdminAgencia' || tenantType === 'Agencia'
}

export function isAdminAcademia(role?: string | null, tenantType?: string | null): boolean {
  return role === 'AdminAcademia' || tenantType === 'Academia'
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

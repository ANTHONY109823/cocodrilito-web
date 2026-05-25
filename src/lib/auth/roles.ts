const ADMIN_ROLES = ['SuperAdmin', 'AdminAgencia', 'AdminAcademia', 'Admin'] as const

export function isAnyAdmin(role?: string | null): boolean {
  if (!role) return false
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'SuperAdmin'
}

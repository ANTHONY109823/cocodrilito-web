import { getPostLoginPath } from '@/lib/auth/roles'

/** Navegación completa tras login para que cookies y middleware reconozcan la sesión. */
export function navigateAfterLogin(
  role?: string | null,
  mustChangePassword?: boolean,
  nextPath?: string | null
) {
  const path = getPostLoginPath(role, mustChangePassword, nextPath)
  window.location.assign(path)
}

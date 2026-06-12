/** Cierra sesión en cliente y navega al login con recarga completa (evita estados colgados). */
export function redirectToLogin() {
  if (typeof window === 'undefined') return
  const loginPath = '/login'
  if (window.location.pathname === loginPath) return
  window.location.replace(loginPath)
}

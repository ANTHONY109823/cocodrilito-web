const PRODUCTION_HOSTS = ['simulacros.pe', 'www.simulacros.pe']

function isProductionBrowserHost(hostname: string): boolean {
  return (
    PRODUCTION_HOSTS.includes(hostname) ||
    hostname.endsWith('.simulacros.pe') ||
    hostname.endsWith('.vercel.app')
  )
}

/**
 * En simulacros.pe las peticiones deben ir a /api (proxy same-origin)
 * para que las cookies httpOnly queden en el dominio del frontend.
 */
export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (isProductionBrowserHost(window.location.hostname)) {
      return '/api'
    }
  }

  return process.env.NEXT_PUBLIC_API_URL || '/api'
}

const PRODUCTION_HOSTS = ['simulacros.pe', 'www.simulacros.pe']

function isProductionBrowserHost(hostname: string): boolean {
  return (
    PRODUCTION_HOSTS.includes(hostname) ||
    hostname.endsWith('.simulacros.pe') ||
    hostname.endsWith('.vercel.app')
  )
}

/**
 * En simulacros.pe las peticiones deben ir al proxy /api (same-origin).
 * Si el usuario está en el apex (sin www), Vercel responde 308 a www y axios
 * con cookies falla con "Network Error" — usamos www directamente.
 */
export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    if (isProductionBrowserHost(window.location.hostname)) {
      const origin =
        window.location.hostname === 'simulacros.pe'
          ? `${window.location.protocol}//www.simulacros.pe`
          : window.location.origin
      return `${origin}/api`
    }
  }

  return process.env.NEXT_PUBLIC_API_URL || '/api'
}

import { WHATSAPP_PREFILL } from '@/lib/constants/brand'

export interface TenantLoginStat {
  value: string
  label: string
}

export interface TenantLoginBranding {
  brandTagline: string
  brandSub: string
  headlineNormal: string
  headlineAccent: string
  description: string
  features: string[]
  ctaTagline: string
  stats: TenantLoginStat[]
  whatsappUrl: string
  tiktokUrl: string
  facebookUrl: string
  instagramUrl: string
}

export const DEFAULT_LOGIN_BRANDING: TenantLoginBranding = {
  brandTagline: 'Plataforma de examenes',
  brandSub: 'Exámenes · Ascensos · Balotarios · PNP & FF.AA.',
  headlineNormal: 'PREPÁRATE PARA LOGRAR',
  headlineAccent: 'TUS METAS',
  description:
    'CON LA PLATAFORMA #1 DE SIMULACROS EN EL PERÚ.\nAprueba con confianza — miles ya lo lograron.',
  features: [
    'Preguntas actualizadas',
    'Simulacros cronometrados',
    'Ranking y gamificación',
    'Reportes de progreso personalizados',
    'Especializados en los procesos de ascenso a la PNP',
    'Perfiles para usuarios y agencias/academias.',
    'Si eres agencias/academia de admisión usa nuestra plataforma y genera ingresos con cada suscripción.',
    'Si eres postulante o aspirante a la PNP o FF.AA. puedes suscribirte a la plataforma directamente',
  ],
  ctaTagline: 'ESTAS A UN PASO DE LOGRAR TUS SUEÑOS ¡SUSCRIBETE YA!',
  stats: [
    { value: '100%', label: 'Amigable' },
    { value: '24/7', label: 'A tu disposición' },
    { value: '100%', label: 'Satisfacción' },
  ],
  whatsappUrl: `https://wa.me/51927577686?text=${WHATSAPP_PREFILL}`,
  tiktokUrl: 'https://tiktok.com/@cocodrilito',
  facebookUrl: 'https://facebook.com/cocodrilito',
  instagramUrl: 'https://instagram.com/cocodrilito',
}

export function resolveLoginBranding(
  partial?: Partial<TenantLoginBranding> | null
): TenantLoginBranding {
  if (!partial) return DEFAULT_LOGIN_BRANDING
  return {
    brandTagline: partial.brandTagline?.trim() || DEFAULT_LOGIN_BRANDING.brandTagline,
    brandSub: partial.brandSub?.trim() || DEFAULT_LOGIN_BRANDING.brandSub,
    headlineNormal: partial.headlineNormal?.trim() || DEFAULT_LOGIN_BRANDING.headlineNormal,
    headlineAccent: partial.headlineAccent?.trim() || DEFAULT_LOGIN_BRANDING.headlineAccent,
    description: partial.description?.trim() || DEFAULT_LOGIN_BRANDING.description,
    features: partial.features?.length ? partial.features : DEFAULT_LOGIN_BRANDING.features,
    ctaTagline: partial.ctaTagline?.trim() || DEFAULT_LOGIN_BRANDING.ctaTagline,
    stats: partial.stats?.length ? partial.stats : DEFAULT_LOGIN_BRANDING.stats,
    whatsappUrl: partial.whatsappUrl?.trim() || DEFAULT_LOGIN_BRANDING.whatsappUrl,
    tiktokUrl: partial.tiktokUrl?.trim() || DEFAULT_LOGIN_BRANDING.tiktokUrl,
    facebookUrl: partial.facebookUrl?.trim() || DEFAULT_LOGIN_BRANDING.facebookUrl,
    instagramUrl: partial.instagramUrl?.trim() || DEFAULT_LOGIN_BRANDING.instagramUrl,
  }
}

export function featuresToText(features: string[]): string {
  return features.join('\n')
}

export function textToFeatures(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/** Paleta verde policial — usar en estilos inline y gradientes */
export const POLICE_GREEN = '#4A7C59'
export const POLICE_GREEN_DARK = '#2D5A3D'
export const POLICE_GREEN_LIGHT = '#6B9E7A'
export const POLICE_GREEN_BG = '#E8F0EB'
export const POLICE_GREEN_PALE = '#F2F6F3'

export const SURFACE = '#0A0F0D'
export const SURFACE_CARD = '#111A14'
export const SURFACE_BORDER = '#1E3328'
export const TEXT_PRIMARY = '#FFFFFF'
export const TEXT_SECONDARY = '#A8BFB0'
export const TEXT_MUTED = '#6B8A75'
export const GOLD = '#C9943A'

export const WARNING = '#C9943A'
export const DANGER = '#C0392B'
export const INFO = '#2E86AB'

/** Alias usado en componentes existentes */
export const NEON = POLICE_GREEN
export const NEON_DARK = POLICE_GREEN_DARK

export const BRAND_GRADIENT = `linear-gradient(135deg, ${POLICE_GREEN}, ${POLICE_GREEN_DARK})`
export const BRAND_GRADIENT_FULL = `linear-gradient(135deg, ${POLICE_GREEN_DARK} 0%, ${POLICE_GREEN} 50%, ${POLICE_GREEN_LIGHT} 100%)`

export function policeGreenRgba(alpha: number): string {
  return `rgba(74, 124, 89, ${alpha})`
}

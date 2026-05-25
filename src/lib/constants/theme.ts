/** Paleta verde viva — usar en estilos inline y gradientes */
export const POLICE_GREEN = '#318F48'
export const POLICE_GREEN_DARK = '#1A5C2E'
export const POLICE_GREEN_LIGHT = '#5EC97A'
export const POLICE_GREEN_ACCENT = '#BDFFDF'
export const POLICE_GREEN_BG = 'rgba(49,143,72,0.12)'
export const POLICE_GREEN_PALE = 'rgba(49,143,72,0.1)'

export const SURFACE = '#080E0A'
export const SURFACE_CARD = '#0D1A10'
export const SURFACE_BORDER = 'rgba(189,255,223,0.12)'
export const TEXT_PRIMARY = '#FFFFFF'
export const TEXT_SECONDARY = '#A8BFB0'
export const TEXT_MUTED = '#6B8A75'
export const GOLD = '#C9943A'

export const WARNING = '#C9943A'
export const DANGER = '#C0392B'
export const INFO = '#2E86AB'

export const NEON = POLICE_GREEN
export const NEON_DARK = POLICE_GREEN_DARK

export const BRAND_GRADIENT = `linear-gradient(135deg, ${POLICE_GREEN}, ${POLICE_GREEN_DARK})`
export const BRAND_GRADIENT_FULL = `linear-gradient(135deg, ${POLICE_GREEN_DARK} 0%, ${POLICE_GREEN} 50%, ${POLICE_GREEN_LIGHT} 100%)`

export function policeGreenRgba(alpha: number): string {
  return `rgba(49, 143, 72, ${alpha})`
}

export function accentRgba(alpha: number): string {
  return `rgba(189, 255, 223, ${alpha})`
}

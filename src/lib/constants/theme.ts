/** Paleta — colores de acento (hex para gradientes y alpha suffix) */
export const POLICE_GREEN = '#318F48'
export const POLICE_GREEN_DARK = '#1A5C2E'
export const POLICE_GREEN_LIGHT = '#5EC97A'
export const POLICE_GREEN_ACCENT = '#BDFFDF'

/** Superficies y texto — respetan tema claro/oscuro vía CSS variables */
export const SURFACE = 'var(--color-surface)'
export const SURFACE_CARD = 'var(--color-surface-card)'
export const SURFACE_ELEVATED = 'var(--color-surface-elevated)'
export const SURFACE_BORDER = 'var(--color-surface-border)'
export const INPUT_BG = 'var(--color-input-bg)'
export const TEXT_PRIMARY = 'var(--color-text-primary)'
export const TEXT_SECONDARY = 'var(--color-text-secondary)'
export const TEXT_MUTED = 'var(--color-text-muted)'

export const POLICE_GREEN_BG = 'var(--color-primary-bg)'
export const POLICE_GREEN_PALE = 'var(--color-primary-bg)'

export const GOLD = '#C9943A'
export const WARNING = '#C9943A'
export const DANGER = '#C0392B'
export const INFO = '#2E86AB'

export const NEON = POLICE_GREEN
export const NEON_DARK = POLICE_GREEN_DARK

export const BRAND_GRADIENT = `linear-gradient(135deg, ${POLICE_GREEN}, ${POLICE_GREEN_DARK})`
export const BRAND_GRADIENT_FULL = `linear-gradient(135deg, ${POLICE_GREEN_DARK} 0%, ${POLICE_GREEN} 50%, ${POLICE_GREEN_LIGHT} 100%)`

/** Mezcla semitransparente compatible con tema claro/oscuro */
export function primaryMix(percent: number): string {
  return `color-mix(in srgb, var(--color-primary) ${percent}%, transparent)`
}

export function warningMix(percent: number): string {
  return `color-mix(in srgb, var(--color-warning) ${percent}%, transparent)`
}

export function dangerMix(percent: number): string {
  return `color-mix(in srgb, var(--color-danger) ${percent}%, transparent)`
}

export function infoMix(percent: number): string {
  return `color-mix(in srgb, var(--color-info) ${percent}%, transparent)`
}

/** @deprecated Usar primaryMix() */
export function policeGreenRgba(alpha: number): string {
  return primaryMix(Math.round(alpha * 100))
}

/** @deprecated Usar primaryMix() */
export function accentRgba(alpha: number): string {
  return primaryMix(Math.round(alpha * 100))
}

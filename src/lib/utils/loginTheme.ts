import type { CSSProperties } from 'react'
import type { TenantConfig } from '@/lib/api/tenants'

const PLATFORM_PRIMARY = '#4A7C59'
const PLATFORM_SECONDARY = '#F5C842'

export function buildLoginThemeStyle(
  config: TenantConfig | null,
  isPlatformLogin: boolean
): CSSProperties {
  const primary = isPlatformLogin || !config?.primaryColor
    ? PLATFORM_PRIMARY
    : config.primaryColor
  const secondary = isPlatformLogin || !config?.secondaryColor
    ? PLATFORM_SECONDARY
    : config.secondaryColor

  return {
    '--login-primary': primary,
    '--login-secondary': secondary,
    '--login-accent': secondary,
  } as CSSProperties
}

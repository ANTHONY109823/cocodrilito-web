'use client'

import type { CSSProperties } from 'react'
import { buildLoginThemeStyle } from '@/lib/utils/loginTheme'
import type { TenantConfig } from '@/lib/api/tenants'

interface LoginBrandedSkeletonProps {
  config?: TenantConfig | null
  isPlatform?: boolean
  exiting?: boolean
}

export function LoginBrandedSkeleton({ config, isPlatform = false, exiting = false }: LoginBrandedSkeletonProps) {
  const themeStyle = buildLoginThemeStyle(config ?? null, isPlatform)

  return (
    <div
      className={`login-skeleton${exiting ? ' login-skeleton--exit' : ''}`}
      style={themeStyle}
      aria-busy="true"
      aria-label="Cargando portal de inicio de sesión"
    >
      <div className="login-skeleton-brand">
        <div className="login-skeleton-logo" />
        <div className="login-skeleton-line login-skeleton-line--title" />
        <div className="login-skeleton-line login-skeleton-line--sub" />
      </div>
      <div className="login-skeleton-card">
        <div className="login-skeleton-pane">
          <div className="login-skeleton-line login-skeleton-line--wide" />
          <div className="login-skeleton-line" />
          <div className="login-skeleton-line" />
        </div>
        <div className="login-skeleton-pane login-skeleton-pane--form">
          <div className="login-skeleton-line login-skeleton-line--medium" />
          <div className="login-skeleton-field" />
          <div className="login-skeleton-field" />
          <div className="login-skeleton-btn" />
        </div>
      </div>
      <p className="login-skeleton-text">Preparando tu portal...</p>
    </div>
  )
}

export function LoginSuspenseFallback() {
  return (
    <div className="loginRoot loginRoot--platform" style={buildLoginThemeStyle(null, true) as CSSProperties}>
      <LoginBrandedSkeleton isPlatform />
    </div>
  )
}

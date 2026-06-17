'use client'

import { useEffect, useState } from 'react'
import { superadminApi } from '@/lib/api/superadmin'
import { DANGER, GOLD, INFO, INPUT_BG, NEON, POLICE_GREEN_DARK, PURPLE_ACCENT, RED_BRIGHT, SKY, SURFACE, SURFACE_BORDER, SURFACE_CARD, TEXT_MUTED, WARNING, dangerMix, goldBrightMix, infoMix, primaryMix, purpleMix, redBrightMix, skyMix, warningMix } from '@/lib/constants/theme'

interface HealthCheck {
  name: string
  ok: boolean
  message: string
  action?: string | null
}

interface ReadinessResponse {
  status: 'ready' | 'degraded'
  checks: HealthCheck[]
}

export function SystemHealthPanel() {
  const [data, setData] = useState<ReadinessResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    superadminApi.getSystemHealth()
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el estado del sistema.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl p-4 text-sm text-gray-500"
        style={{ background: 'var(--color-surface-card)', border: `1px solid ${SURFACE_BORDER}` }}>
        Verificando infraestructura…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl p-4 text-sm" style={{ color: DANGER, border: `1px solid ${dangerMix(40)}` }}>
        {error}
      </div>
    )
  }

  if (!data) return null

  const failed = data.checks.filter((c) => !c.ok)

  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'var(--color-surface-card)', border: `1px solid ${SURFACE_BORDER}` }}>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h3 className="text-[var(--color-text-primary)] font-semibold">Estado del sistema</h3>
        <span className="text-xs px-2 py-1 rounded-full font-medium"
          style={{
            background: data.status === 'ready' ? `${primaryMix(20)}` : `${warningMix(20)}`,
            color: data.status === 'ready' ? NEON : WARNING,
          }}>
          {data.status === 'ready' ? 'Listo para onboarding' : 'Requiere atención'}
        </span>
      </div>

      {failed.length > 0 && (
        <p className="text-xs mb-3" style={{ color: WARNING }}>
          {failed.length} punto(s) pendiente(s) antes de escalar agencias masivamente.
        </p>
      )}

      <div className="space-y-2">
        {data.checks.map((check) => (
          <div key={check.name}
            className="rounded-xl px-3 py-2 text-xs"
            style={{
              background: check.ok ? 'rgba(74,170,84,0.06)' : 'rgba(255,152,0,0.08)',
              border: `1px solid ${check.ok ? 'rgba(74,170,84,0.2)' : 'rgba(255,152,0,0.25)'}`,
            }}>
            <div className="flex items-start gap-2">
              <span style={{ color: check.ok ? NEON : WARNING }}>
                {check.ok ? '✓' : '!'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-200">{check.name}</div>
                <div className="text-gray-400 mt-0.5">{check.message}</div>
                {check.action && !check.ok && (
                  <div className="mt-1" style={{ color: INFO }}>→ {check.action}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { ASCENSO_TRACK_OPTIONS } from '@/lib/constants/trackTypes'
import { cn } from '@/lib/utils/cn'

interface TrackSwitchBarProps {
  activeTrackType: number
  onChange: (track: number) => void
  hint?: string
}

/** Selector compacto Suboficiales / Oficiales para vista previa (agencias, modo prueba). */
export function TrackSwitchBar({ activeTrackType, onChange, hint }: TrackSwitchBarProps) {
  return (
    <div className="rounded-2xl p-4 mb-5 bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[var(--color-text-primary)] font-semibold text-sm">
            Balotario a consultar
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
            {hint ?? 'Cambia entre Suboficiales y Oficiales para ver el banco de cada uno.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ASCENSO_TRACK_OPTIONS.map((track) => {
            const active = activeTrackType === track.value
            return (
              <button
                key={track.value}
                type="button"
                onClick={() => onChange(track.value)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border',
                  active
                    ? 'bg-[var(--color-primary-bg)] text-[var(--color-text-accent)] border-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-surface-border)] hover:text-[var(--color-text-primary)]'
                )}
              >
                {track.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

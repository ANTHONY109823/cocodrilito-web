'use client'

import { ASCENSO_TRACK_OPTIONS } from '@/lib/constants/trackTypes'
import { NEON } from '@/lib/constants/theme'

interface TrackSwitchBarProps {
  activeTrackType: number
  onChange: (track: number) => void
  hint?: string
}

/** Selector compacto Suboficiales / Oficiales para vista previa (agencias, modo prueba). */
export function TrackSwitchBar({ activeTrackType, onChange, hint }: TrackSwitchBarProps) {
  return (
    <div
      className="rounded-2xl p-4 mb-5"
      style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${NEON}25` }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-white font-semibold text-sm">Balotario a consultar</div>
          <p className="text-xs text-gray-500 mt-0.5">
            {hint ?? 'Cambia entre Suboficiales y Oficiales para ver el banco de cada uno.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ASCENSO_TRACK_OPTIONS.map((track) => (
            <button
              key={track.value}
              type="button"
              onClick={() => onChange(track.value)}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                backgroundColor: activeTrackType === track.value ? `${NEON}20` : 'rgba(0,5,2,0.5)',
                color: activeTrackType === track.value ? NEON : '#6B7280',
                border: `1px solid ${activeTrackType === track.value ? NEON : '#ffffff10'}`,
              }}
            >
              {track.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

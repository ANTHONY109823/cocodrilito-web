'use client'

import {
  hierarchiesForTrack,
  hierarchyLabel,
} from '@/lib/constants/promotionGrades'
import { cn } from '@/lib/utils/cn'

interface HierarchySwitchBarProps {
  activeTrackType: number
  activeHierarchy: number
  onChange: (hierarchy: number) => void
  hint?: string
}

/** Selector de jerarquía dentro del balotario (Subalternos / Superiores / etc.). */
export function HierarchySwitchBar({
  activeTrackType,
  activeHierarchy,
  onChange,
  hint,
}: HierarchySwitchBarProps) {
  const options = hierarchiesForTrack(activeTrackType)

  return (
    <div className="rounded-2xl p-4 mb-5 bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]">
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-[var(--color-text-primary)] font-semibold text-sm">
            Jerarquía del balotario
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
            {hint ??
              'Cada jerarquía tiene su propio banco (~1500 preguntas). Sube CSV y asigna alumnos por grado de postulación sin mezclar jerarquías.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {options.map((h) => {
            const active = activeHierarchy === h.value
            return (
              <button
                key={h.value}
                type="button"
                onClick={() => onChange(h.value)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-left',
                  active
                    ? 'bg-[var(--color-primary-bg)] text-[var(--color-text-accent)] border-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-surface-border)] hover:text-[var(--color-text-primary)]'
                )}
              >
                {h.label}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Vista actual: <strong className="text-[var(--color-text-secondary)]">{hierarchyLabel(activeHierarchy)}</strong>
        </p>
      </div>
    </div>
  )
}

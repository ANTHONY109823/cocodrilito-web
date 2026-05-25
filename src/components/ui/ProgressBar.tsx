'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

const barColors = {
  green: 'bg-[#4A7C59]',
  blue: 'bg-[#2E86AB]',
  orange: 'bg-[#E67E22]',
  gold: 'bg-[#C9943A]',
  red: 'bg-[#C0392B]',
} as const

export type ProgressBarColor = keyof typeof barColors

export interface ProgressBarProps {
  value: number
  max?: number
  color?: ProgressBarColor
  label?: string
  showPercent?: boolean
  className?: string
  animated?: boolean
  size?: 'sm' | 'md'
}

export function ProgressBar({
  value,
  max = 100,
  color = 'green',
  label,
  showPercent = false,
  className,
  animated = true,
  size = 'md',
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  const [width, setWidth] = useState(animated ? 0 : percent)

  useEffect(() => {
    if (!animated) {
      setWidth(percent)
      return
    }
    const t = requestAnimationFrame(() => setWidth(percent))
    return () => cancelAnimationFrame(t)
  }, [percent, animated])

  const trackHeight = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="mb-2 flex items-center justify-between gap-2 text-sm">
          {label && <span className="text-[#A8BFB0]">{label}</span>}
          {showPercent && (
            <span className="font-medium text-white tabular-nums">
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full bg-[#1E3328]', trackHeight)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            barColors[color]
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

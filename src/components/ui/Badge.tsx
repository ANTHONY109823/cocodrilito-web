import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes } from 'react'

const colors = {
  green: 'bg-[#4A7C59]/20 text-[#6B9E7A] border-[#4A7C59]/40',
  blue: 'bg-[#2E86AB]/20 text-[#5ba8cc] border-[#2E86AB]/40',
  orange: 'bg-[#E67E22]/20 text-[#F39C12] border-[#E67E22]/40',
  red: 'bg-[#C0392B]/20 text-[#e74c3c] border-[#C0392B]/40',
  gray: 'bg-[#1E3328] text-[#A8BFB0] border-[#1E3328]',
  gold: 'bg-[#C9943A]/20 text-[#C9943A] border-[#C9943A]/40',
} as const

export type BadgeColor = keyof typeof colors

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
  dot?: boolean
}

export function Badge({
  className,
  color = 'green',
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        colors[color],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}

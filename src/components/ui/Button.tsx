'use client'

import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const variants = {
  primary:
    'bg-[#4A7C59] text-white hover:bg-[#2D5A3D] focus-visible:ring-[#4A7C59]/50',
  secondary:
    'bg-[#1E3328] text-white hover:bg-[#2D5A3D] focus-visible:ring-[#1E3328]/50',
  outline:
    'border border-[#4A7C59] bg-transparent text-[#4A7C59] hover:bg-[#4A7C59]/10 focus-visible:ring-[#4A7C59]/30',
  ghost:
    'bg-transparent text-[#A8BFB0] hover:bg-[#1E3328] hover:text-white focus-visible:ring-[#1E3328]/50',
  danger:
    'bg-[#C0392B] text-white hover:bg-[#962d22] focus-visible:ring-[#C0392B]/50',
} as const

const sizes = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-4 text-sm rounded-lg gap-2',
  lg: 'h-[52px] px-6 text-base rounded-lg gap-2',
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      fullWidth,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F0D]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

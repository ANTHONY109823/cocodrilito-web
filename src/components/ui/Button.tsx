'use client'

import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const variants = {
  primary:
    'bg-[#318F48] text-white hover:bg-[#1A5C2E] focus-visible:ring-[#318F48]/50',
  secondary:
    'bg-[rgba(49,143,72,0.15)] text-white hover:bg-[#1A5C2E] focus-visible:ring-[#318F48]/30',
  outline:
    'border border-[#318F48] bg-transparent text-[#318F48] hover:bg-[rgba(49,143,72,0.12)] focus-visible:ring-[#318F48]/30',
  ghost:
    'bg-transparent text-[#A8BFB0] hover:bg-[rgba(49,143,72,0.07)] hover:text-white focus-visible:ring-[#318F48]/30',
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
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080E0A]',
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

'use client'

import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  iconLeft?: LucideIcon
  iconRight?: LucideIcon
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      hint,
      iconLeft: IconLeft,
      iconRight: IconRight,
      type = 'text',
      id: idProp,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const id = idProp ?? generatedId
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-xs font-semibold tracking-wide text-[#BDFFDF]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {IconLeft && (
            <IconLeft
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#BDFFDF]/60"
              aria-hidden
            />
          )}
          <input
            ref={ref}
            id={id}
            type={inputType}
            disabled={disabled}
            className={cn(
              'w-full rounded-[10px] border border-[rgba(189,255,223,0.18)] bg-white/5 py-3.5 text-sm text-white',
              'placeholder:text-white/25 transition-all duration-200',
              'focus:border-[#318F48] focus:outline-none focus:shadow-[0_0_0_3px_rgba(49,143,72,0.2)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              IconLeft && 'pl-10',
              (IconRight || isPassword) && 'pr-10',
              !IconLeft && 'px-4',
              error && 'border-[#C0392B] focus:border-[#C0392B] focus:shadow-[#C0392B]/25',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#BDFFDF]/60 hover:text-[#BDFFDF]"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          )}
          {!isPassword && IconRight && (
            <IconRight
              className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#BDFFDF]/60"
              aria-hidden
            />
          )}
        </div>
        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-xs text-[#FF6B6B]" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#6B8A75]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

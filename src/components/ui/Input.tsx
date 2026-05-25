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

    const ToggleIcon = showPassword ? EyeOff : Eye

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-[#A8BFB0]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {IconLeft && (
            <IconLeft
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6B8A75]"
              aria-hidden
            />
          )}
          <input
            ref={ref}
            id={id}
            type={inputType}
            disabled={disabled}
            className={cn(
              'w-full rounded-lg border border-[#1E3328] bg-[#0A0F0D] py-3.5 text-sm text-white',
              'placeholder:text-[#6B8A75] transition-colors duration-200',
              'focus:border-[#4A7C59] focus:outline-none focus:ring-2 focus:ring-[#4A7C59]/25',
              'disabled:cursor-not-allowed disabled:opacity-50',
              IconLeft && 'pl-11',
              (IconRight || isPassword) && 'pr-11',
              !IconLeft && 'px-4',
              IconLeft && !IconRight && !isPassword && 'pr-4',
              error && 'border-[#C0392B] focus:border-[#C0392B] focus:ring-[#C0392B]/25',
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
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#6B8A75] transition-colors hover:text-[#A8BFB0]"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              <ToggleIcon className="h-[18px] w-[18px]" />
            </button>
          )}
          {!isPassword && IconRight && (
            <IconRight
              className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#6B8A75]"
              aria-hidden
            />
          )}
        </div>
        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-xs text-[#e74c3c]" role="alert">
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

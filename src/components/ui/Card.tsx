import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes, ReactNode } from 'react'

const variants = {
  default: 'bg-[#0D1A10] border border-[rgba(189,255,223,0.12)]',
  highlighted: 'bg-[#0D1A10] border border-[#318F48]',
  glass: 'bg-[#0D1A10]/80 border border-[rgba(189,255,223,0.12)] backdrop-blur-md',
} as const

export type CardVariant = keyof typeof variants

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const paddingClass = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding]

  return (
    <div
      className={cn(
        'rounded-xl',
        variants[variant],
        paddingClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4 flex flex-col gap-1', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-[#A8BFB0]', className)} {...props}>
      {children}
    </p>
  )
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-4 flex items-center gap-3 border-t border-[rgba(189,255,223,0.12)] pt-4', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardCompoundProps {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

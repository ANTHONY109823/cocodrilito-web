import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { cn } from '@/lib/utils/cn'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; href: string }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card padding="lg" className={cn('text-center', className)}>
      {icon != null && <div className="mb-4 text-4xl">{icon}</div>}
      <h3 className="mb-2 font-bold text-white">{title}</h3>
      {description && <p className="mb-4 text-sm text-[#6B8A75]">{description}</p>}
      {action && (
        <Link href={action.href}>
          <Button variant="primary" size="sm">
            {action.label}
          </Button>
        </Link>
      )}
    </Card>
  )
}

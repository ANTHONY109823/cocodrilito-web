import { AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { cn } from '@/lib/utils/cn'

export interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  message = 'No se pudieron cargar los datos.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card padding="lg" className={cn('text-center', className)}>
      <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[#C9943A]" strokeWidth={1.5} />
      <h3 className="mb-2 font-bold text-white">Algo salió mal</h3>
      <p className="mb-4 text-sm text-[#6B8A75]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </Card>
  )
}

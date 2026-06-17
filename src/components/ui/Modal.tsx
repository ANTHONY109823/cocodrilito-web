'use client'

import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Ancho máximo del panel. */
  maxWidth?: string
  /** Cierra al hacer click en el backdrop. */
  closeOnBackdrop?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={cn(
          'relative my-auto flex w-full max-h-[min(90vh,920px)] flex-col rounded-2xl shadow-2xl',
          'bg-[var(--color-surface-elevated)] border border-[var(--color-surface-border)]',
          maxWidth
        )}
      >
        {title && (
          <div className="shrink-0 border-b border-[var(--color-surface-border)] px-5 py-4 text-lg font-bold text-[var(--color-text-primary)]">
            {title}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm text-[var(--color-text-secondary)]">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 flex flex-wrap justify-end gap-2 border-t border-[var(--color-surface-border)] bg-[var(--color-surface-elevated)] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

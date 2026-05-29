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
  /** Cierra al hacer click en el backdrop. Default true. */
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={cn(
          'relative w-full rounded-2xl p-5 shadow-2xl',
          maxWidth
        )}
        style={{
          background: 'rgba(6,14,9,0.98)',
          border: '1px solid rgba(74,170,84,0.25)',
        }}
      >
        {title && (
          <div className="mb-4 text-lg font-bold text-white">{title}</div>
        )}
        <div className="text-sm text-gray-300">{children}</div>
        {footer && (
          <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  )
}

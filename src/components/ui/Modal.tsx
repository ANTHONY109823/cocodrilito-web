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
          maxWidth
        )}
        style={{
          background: 'rgba(6,14,9,0.98)',
          border: '1px solid rgba(74,170,84,0.25)',
        }}
      >
        {title && (
          <div className="shrink-0 border-b border-white/10 px-5 py-4 text-lg font-bold text-white">
            {title}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm text-gray-300">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 flex flex-wrap justify-end gap-2 border-t border-white/10 bg-[rgba(6,14,9,0.98)] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

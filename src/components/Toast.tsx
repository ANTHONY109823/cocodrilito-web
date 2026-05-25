'use client'

import { useToastStore, type ToastType } from '@/lib/store/toastStore'
import { DANGER, INFO, NEON } from '@/lib/constants/theme'

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: 'rgba(74,124,89,0.15)', border: `${NEON}50`, color: NEON },
  error: { bg: 'rgba(192,57,43,0.15)', border: `${DANGER}50`, color: DANGER },
  info: { bg: 'rgba(46,134,171,0.15)', border: `${INFO}50`, color: INFO },
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type] ?? TYPE_STYLES.info
        return (
          <div
            key={toast.id}
            className="pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-lg fade-in flex items-start justify-between gap-3"
            style={{
              backgroundColor: style.bg,
              border: `1px solid ${style.border}`,
              color: style.color,
            }}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="opacity-70 hover:opacity-100 shrink-0"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function toast(message: string, type: ToastType = 'info') {
  useToastStore.getState().show(message, type)
}

'use client'

import { useNavigationStore } from '@/lib/store/navigationStore'

export function NavigationProgressBar() {
  const pending = useNavigationStore((s) => s.pendingHref)

  if (!pending) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-[#318F48]/20"
      role="progressbar"
      aria-label="Navegando"
    >
      <div className="h-full w-1/3 animate-[navProgress_0.8s_ease-in-out_infinite] bg-[#318F48]" />
    </div>
  )
}

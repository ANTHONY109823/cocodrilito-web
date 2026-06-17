'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-surface)] text-[var(--color-text-muted)]">
      Redirigiendo...
    </div>
  )
}

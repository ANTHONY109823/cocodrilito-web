import { Suspense } from 'react'
import PremiumClient from './PremiumClient'

export default function PremiumPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🐊</div>
          <p className="text-[#6B8A75]">Cargando planes...</p>
        </div>
      </div>
    }>
      <PremiumClient />
    </Suspense>
  )
}

'use client'

import { useState } from 'react'
import PreguntasPage from '../../admin/preguntas/page'
import { ExamDistributionPanel } from '../ExamDistributionPanel'
import { NEON, SURFACE_BORDER } from '@/lib/constants/theme'

export default function SuperAdminPreguntasPage() {
  const [showDistribution, setShowDistribution] = useState(false)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--color-surface-card)', border: `1px solid ${SURFACE_BORDER}` }}>
        <button
          type="button"
          onClick={() => setShowDistribution((s) => !s)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
          style={{ color: NEON }}
        >
          <span>📊 Distribución del simulacro por categoría</span>
          <span className="text-xs">{showDistribution ? '▲ Ocultar' : '▼ Configurar'}</span>
        </button>
        {showDistribution && (
          <div className="px-4 pb-4 border-t" style={{ borderColor: SURFACE_BORDER }}>
            <div className="pt-4">
              <ExamDistributionPanel />
            </div>
          </div>
        )}
      </div>

      <PreguntasPage />
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  superadminApi,
  type ExamCategoryDistribution,
} from '@/lib/api/superadmin'
import { toast } from '@/components/Toast'
import { Button } from '@/components/ui'
import { SkeletonTable } from '@/components/Skeleton'
import { NEON, DANGER, SURFACE_BORDER, SURFACE_CARD, policeGreenRgba } from '@/lib/constants/theme'

const TOTALS = [100, 50, 25] as const

type Row = ExamCategoryDistribution

export function ExamDistributionPanel() {
  const [activeTotal, setActiveTotal] = useState<number>(100)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (total: number) => {
    setLoading(true)
    try {
      const res = await superadminApi.getExamConfigByTotal(total)
      setRows([...res.data.distributions].sort((a, b) => a.displayOrder - b.displayOrder))
    } catch {
      toast('Error al cargar la configuración', 'error')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(activeTotal) }, [activeTotal, load])

  const totalPct = rows.reduce((s, r) => s + (Number(r.percentage) || 0), 0)
  const totalPctRounded = Math.round(totalPct * 100) / 100
  const isValid = totalPctRounded === 100

  // Recalcula preguntas en tiempo real (redondeo, ajuste en la última fila).
  const computedCounts = (() => {
    const counts = rows.map((r) => Math.round((activeTotal * (Number(r.percentage) || 0)) / 100))
    if (counts.length > 0) {
      const diff = activeTotal - counts.reduce((s, c) => s + c, 0)
      counts[counts.length - 1] = Math.max(0, counts[counts.length - 1] + diff)
    }
    return counts
  })()

  const assignedQuestions = computedCounts.reduce((s, c) => s + c, 0)

  const setPercentage = (idx: number, value: string) => {
    const pct = Math.max(0, Math.min(100, Number(value) || 0))
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, percentage: pct } : r)))
  }

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= rows.length) return
    setRows((prev) => {
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((r, i) => ({ ...r, displayOrder: i + 1 }))
    })
  }

  const save = async () => {
    if (!isValid) return
    setSaving(true)
    try {
      await superadminApi.updateExamConfig(activeTotal, {
        totalQuestions: activeTotal,
        distributions: rows.map((r, i) => ({
          categoryId: r.categoryId,
          percentage: Number(r.percentage),
          displayOrder: i + 1,
        })),
      })
      toast('Configuración guardada', 'success')
      void load(activeTotal)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TOTALS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTotal(t)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              backgroundColor: activeTotal === t ? NEON : SURFACE_CARD,
              color: activeTotal === t ? '#000' : '#9CA3AF',
              border: `1px solid ${activeTotal === t ? NEON : 'var(--color-surface-border)'}`,
            }}
          >
            {t} preguntas
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500 rounded-2xl"
          style={{ border: `1px solid ${SURFACE_BORDER}` }}>
          No hay categorías configuradas. Crea categorías primero.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--color-surface-elevated)', border: `1px solid ${policeGreenRgba(0.2)}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500" style={{ borderBottom: `1px solid ${SURFACE_BORDER}` }}>
                <th className="px-3 py-2 w-20">Orden</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2 w-28">%</th>
                <th className="px-3 py-2 w-20">Preg.</th>
                <th className="px-3 py-2 w-32">Disponibles</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.categoryId} style={{ borderBottom: `1px solid ${SURFACE_BORDER}` }}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{idx + 1}</span>
                      <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                        className="px-1.5 rounded text-xs disabled:opacity-30"
                        style={{ color: NEON }}>↑</button>
                      <button type="button" onClick={() => move(idx, 1)} disabled={idx === rows.length - 1}
                        className="px-1.5 rounded text-xs disabled:opacity-30"
                        style={{ color: NEON }}>↓</button>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-white">{r.categoryName}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={r.percentage}
                      onChange={(e) => setPercentage(idx, e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg text-white outline-none"
                      style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
                    />
                  </td>
                  <td className="px-3 py-2 font-semibold" style={{ color: NEON }}>
                    = {computedCounts[idx]}
                  </td>
                  <td className="px-3 py-2 text-xs"
                    style={{ color: computedCounts[idx] > r.availableQuestions ? DANGER : '#9CA3AF' }}>
                    {r.availableQuestions} disponib.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            style={{ borderTop: `1px solid ${SURFACE_BORDER}` }}>
            <div className="text-sm">
              <span style={{ color: isValid ? NEON : DANGER }} className="font-bold">
                Total: {totalPctRounded}% {isValid ? '✅' : '⚠️'}
              </span>
              <span className="text-gray-500 ml-3">
                Preguntas: {assignedQuestions}/{activeTotal}
              </span>
            </div>
            <Button size="sm" disabled={!isValid} loading={saving} onClick={save}>
              Guardar configuración
            </Button>
          </div>
          {!isValid && (
            <p className="px-4 pb-3 text-xs" style={{ color: DANGER }}>
              La suma de porcentajes debe ser exactamente 100% para poder guardar.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

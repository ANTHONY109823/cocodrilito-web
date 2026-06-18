'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { tenantPlansApi, type TenantPlan } from '@/lib/api/tenantPlans'
import { getApiErrorMessage } from '@/lib/api/errors'
import {
  NEON,
  SKY as NEON2,
  GOLD_BRIGHT as GOLD,
  RED_BRIGHT as RED,
  primaryMix,
  skyMix,
  redBrightMix,
  goldBrightMix,
  dangerMix,
  SURFACE_CARD,
} from '@/lib/constants/theme'
import { SUBSCRIPTION_PLANS, formatPlanPrice, getPriceForDays } from '@/lib/constants/subscriptionPlans'

const TRACK_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Ascenso Suboficiales' },
  { value: 2, label: 'Ascenso Oficiales' },
]

const TRACK_TYPE_VALUE: Record<string, number> = {
  AscensosSuboficiales: 1,
  AscensosOficiales: 2,
}

const trackLabel = (track: string) =>
  ({
    AscensosSuboficiales: 'Ascenso Suboficiales',
    AscensosOficiales: 'Ascenso Oficiales',
    PostulantesSuboficiales: 'Ascenso Suboficiales',
    PostulantesOficiales: 'Ascenso Oficiales',
  } as Record<string, string>)[track] ?? track

interface TenantPlansSectionProps {
  /** ID del tenant a gestionar (obligatorio en panel SuperAdmin). */
  tenantId?: string
  /** Texto de ayuda personalizado. */
  description?: string
}

export function TenantPlansSection({
  tenantId: managedTenantId,
  description = 'Precios fijos del proceso de ascenso de suboficiales: mensual S/. 15, bimestral S/. 30, full proceso S/. 45. Todos los alumnos de la agencia ven los mismos planes.',
}: TenantPlansSectionProps) {
  const { user } = useAuthStore()
  const tenantId = managedTenantId ?? user?.tenantId ?? undefined
  const [plans, setPlans] = useState<TenantPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planForm, setPlanForm] = useState({
    trackType: 1,
    name: '',
    price: getPriceForDays(30),
    durationDays: 30,
    description: '',
  })

  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      if (!tenantId) {
        setPlans([])
        return
      }
      const res = await tenantPlansApi.list(tenantId)
      setPlans(res.data)
    } catch {
      setMsg({ text: 'No se pudieron cargar los planes', ok: false })
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  const resetPlanForm = () => {
    setPlanForm({
      trackType: 1,
      name: '',
      price: getPriceForDays(30),
      durationDays: 30,
      description: '',
    })
    setEditingPlanId(null)
  }

  const setDurationDays = (durationDays: number) => {
    setPlanForm((prev) => ({
      ...prev,
      durationDays,
      price: getPriceForDays(durationDays),
    }))
  }

  const startEditPlan = (plan: TenantPlan) => {
    setEditingPlanId(plan.id)
    setPlanForm({
      trackType: TRACK_TYPE_VALUE[plan.trackType] ?? 3,
      name: plan.name,
      price: getPriceForDays(plan.durationDays),
      durationDays: plan.durationDays,
      description: plan.description ?? '',
    })
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true)
    try {
      if (editingPlanId) {
        await tenantPlansApi.update(editingPlanId, { ...planForm, isActive: true }, tenantId)
        setMsg({ text: 'Plan actualizado', ok: true })
      } else {
        await tenantPlansApi.create(planForm, tenantId)
        setMsg({ text: 'Plan creado', ok: true })
      }
      resetPlanForm()
      void loadPlans()
    } catch (err: unknown) {
      setMsg({
        text: getApiErrorMessage(err, editingPlanId ? 'Error al actualizar plan' : 'Error al crear plan'),
        ok: false,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivatePlan = async (id: string) => {
    if (!confirm('¿Desactivar este plan?')) return
    try {
      await tenantPlansApi.deactivate(id, tenantId)
      setPlans((prev) => prev.filter((p) => p.id !== id))
      setMsg({ text: 'Plan desactivado', ok: true })
    } catch {
      setMsg({ text: 'Error al desactivar plan', ok: false })
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-[var(--color-text-primary)] font-bold text-lg">Planes de suscripción</h2>
      <p className="text-xs text-gray-500">{description}</p>

      {!tenantId && (
        <p className="text-sm text-gray-500 py-4">No se pudo identificar la institución.</p>
      )}

      {msg && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: msg.ok ? 'var(--color-primary-bg)' : 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
            border: `1px solid ${msg.ok ? primaryMix(40) : redBrightMix(40)}`,
            color: msg.ok ? NEON : RED,
          }}
        >
          {msg.text}
        </div>
      )}

      {!tenantId ? null : loading ? (
        <p className="text-gray-500 text-sm py-6">Cargando planes...</p>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <form
            onSubmit={handleSavePlan}
            className="rounded-2xl p-5 space-y-3 h-fit"
            style={{ background: 'var(--color-surface-card)', border: `1px solid ${goldBrightMix(25)}` }}
          >
            <h3 className="text-[var(--color-text-primary)] font-bold mb-1">
              {editingPlanId ? 'Editar plan' : 'Nuevo plan'}
            </h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de preparación</label>
              <select
                className="input-admin select-dark"
                value={planForm.trackType}
                onChange={(e) => setPlanForm({ ...planForm, trackType: Number(e.target.value) })}
              >
                {TRACK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre del plan</label>
              <input
                className="input-admin"
                style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="Ej. Plan Mensual"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Precio (S/.)</label>
                <input
                  type="text"
                  readOnly
                  className="input-admin"
                  style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
                  value={formatPlanPrice(planForm.price)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Duración</label>
                <select
                  className="input-admin"
                  style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
                  value={planForm.durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                >
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <option key={plan.days} value={plan.days}>
                      {plan.label} · {plan.sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descripción (opcional)</label>
              <textarea
                className="input-admin resize-none"
                style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
                rows={2}
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              {editingPlanId && (
                <button
                  type="button"
                  onClick={resetPlanForm}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-bold"
                style={{ background: GOLD, color: 'var(--color-text-primary)', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Guardando...' : editingPlanId ? 'Guardar' : 'Crear plan'}
              </button>
            </div>
          </form>

          <div
            className="lg:col-span-2 rounded-2xl p-5"
            style={{ background: 'var(--color-surface-card)', border: `1px solid ${primaryMix(25)}` }}
          >
            <h3 className="text-[var(--color-text-primary)] font-bold mb-4">
              Planes activos ({plans.filter((p) => p.isActive).length})
            </h3>
            {plans.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">
                Aún no hay planes. Crea el primero con el formulario.
              </p>
            ) : (
              <div className="space-y-3">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl p-4 flex items-center justify-between gap-3"
                    style={{
                      background: SURFACE_CARD,
                      border: `1px solid ${p.isActive ? primaryMix(30) : 'var(--color-surface-border)'}`,
                      opacity: p.isActive ? 1 : 0.55,
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[var(--color-text-primary)] font-semibold">{p.name}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${skyMix(20)}`, color: NEON2 }}
                        >
                          {trackLabel(p.trackType)}
                        </span>
                        {!p.isActive && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${redBrightMix(20)}`, color: RED }}
                          >
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPlanPrice(getPriceForDays(p.durationDays))} · {p.durationDays} días
                        {p.description ? ` · ${p.description}` : ''}
                      </div>
                    </div>
                    {p.isActive && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditPlan(p)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: `${primaryMix(18)}`, color: NEON, border: `1px solid ${primaryMix(40)}` }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeactivatePlan(p.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: redBrightMix(18), color: RED, border: `1px solid ${redBrightMix(40)}` }}
                        >
                          Desactivar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

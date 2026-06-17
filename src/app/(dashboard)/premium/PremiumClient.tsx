'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/components/Toast'
import { Badge, Button, Card, Input } from '@/components/ui'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import apiClient from '@/lib/api/client'
import { getApiErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils/cn'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  durationDays: number
  features: string[]
  isPopular: boolean
}

interface PaymentInfo {
  yapeNumber: string
  plinNumber: string
  accountName: string
  instructions: string
}

export default function PremiumPage() {
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === '1'
  const isBlocked = searchParams.get('blocked') === '1'

  const [plans, setPlans] = useState<Plan[]>([])
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [step, setStep] = useState<'plans' | 'payment'>('plans')
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin'>('yape')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null

  useEffect(() => {
    let cancelled = false
    const loadPlans = async () => {
      setPlansLoading(true)
      setPlansError(null)
      try {
        const res = await apiClient.get<{ plans: Plan[]; paymentInfo: PaymentInfo }>(
          '/subscriptions/plans'
        )
        if (cancelled) return
        setPlans(res.data.plans ?? [])
        setPaymentInfo(res.data.paymentInfo ?? null)
      } catch (err) {
        if (cancelled) return
        const msg = getApiErrorMessage(err, 'No se pudieron cargar los planes')
        console.error('[premium] loadPlans failed:', err)
        setPlansError(msg)
        toast(msg, 'error')
      } finally {
        if (!cancelled) setPlansLoading(false)
      }
    }
    void loadPlans()
    return () => {
      cancelled = true
    }
  }, [])

  const handleRequestPremium = async () => {
    if (!selectedPlan) return
    if (!reference.trim()) {
      toast('Ingresa el número de operación', 'error')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/subscriptions/request', {
        tenantPlanId: selectedPlan.id,
        paymentMethod: paymentMethod === 'yape' ? 1 : 2,
        amountPaid: selectedPlan.price,
        paymentReference: reference,
        notes: `Plan ${selectedPlan.name} - ${paymentMethod.toUpperCase()}`,
      })
      setSuccess(true)
      toast('Solicitud enviada correctamente', 'success')
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Error al enviar solicitud')
      console.error('[premium] handleRequestPremium failed:', err)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const paymentNumber =
    paymentMethod === 'yape'
      ? paymentInfo?.yapeNumber ?? '—'
      : paymentInfo?.plinNumber ?? '—'

  if (success && selectedPlan) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <div className="mb-6 text-7xl">🐊</div>
        <h1 className="mb-3 text-2xl font-bold text-white">¡Solicitud enviada!</h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Verificaremos tu pago y activaremos tu cuenta en menos de 24 horas.
        </p>
        <Card padding="sm" className="mb-6 space-y-3 rounded-xl text-left">
          {[
            { label: 'Plan', value: selectedPlan.name },
            { label: 'Monto', value: `S/. ${selectedPlan.price.toFixed(2)}` },
            { label: 'Método', value: paymentMethod.toUpperCase() },
            { label: 'Referencia', value: reference },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{item.label}</span>
              <span className="font-medium text-white">{item.value}</span>
            </div>
          ))}
        </Card>
        <Link href="/dashboard" className="block">
          <Button variant="primary" size="md" fullWidth>
            Volver al inicio
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        ← Volver al inicio
      </Link>

      {(isNew || isBlocked) && (
        <Card
          padding="sm"
          className="mb-6 rounded-xl border-[var(--color-surface-border)] bg-[var(--color-primary-bg)] text-center"
        >
          <div className="mb-2 text-4xl">🐊</div>
          <h2 className="mb-1 text-lg font-bold text-white">
            {isNew ? '¡Cuenta creada! Elige tu plan para comenzar' : '¡Un paso más para practicar!'}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {isNew
              ? 'Tu cuenta está lista. Selecciona un plan y paga por Yape/Plin para activar tu acceso.'
              : 'Necesitas un plan activo para acceder a los simulacros PNP.'}
          </p>
        </Card>
      )}

      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Elige tu plan</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Acceso ilimitado a todos los simulacros PNP · Paga con Yape o Plin
        </p>
      </div>

      {plansLoading && (
        <div className="py-12 text-center">
          <div className="mb-4 animate-bounce text-4xl">🐊</div>
          <p className="text-[var(--color-text-muted)]">Cargando planes...</p>
        </div>
      )}

      {plansError && (
        <ErrorState
          message={plansError}
          onRetry={() => window.location.reload()}
          className="mb-6"
        />
      )}

      {!plansLoading && !plansError && plans.length === 0 && (
        <EmptyState
          icon="📋"
          title="Sin planes configurados"
          description="Tu institución aún no ha configurado planes de suscripción. Contacta al administrador."
        />
      )}

      {step === 'plans' && !plansLoading && plans.length > 0 && (
        <div>
          <div
            className={cn(
              'mb-6 grid gap-4',
              plans.length >= 3
                ? 'md:grid-cols-3'
                : plans.length === 2
                  ? 'md:grid-cols-2'
                  : 'grid-cols-1'
            )}
          >
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id
              return (
                <Card
                  key={plan.id}
                  padding="sm"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPlanId(plan.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedPlanId(plan.id)
                  }}
                  className={cn(
                    'relative cursor-pointer rounded-xl transition-transform hover:scale-[1.02]',
                    isSelected
                      ? 'border-2 border-[var(--color-primary)] bg-[var(--color-primary-bg)] shadow-[0_0_25px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]'
                      : plan.isPopular
                        ? 'border-2 border-[#C9943A]/40'
                        : 'border border-[rgba(189,255,223,0.12)]'
                  )}
                >
                  {plan.isPopular && (
                    <Badge color="gold" className="absolute -top-3 left-1/2 -translate-x-1/2">
                      ⭐ MÁS POPULAR
                    </Badge>
                  )}

                  <div className="mb-0.5 text-base font-bold text-white">{plan.name}</div>
                  <div className="mb-3 text-xs text-[var(--color-text-muted)]">{plan.description}</div>

                  <div
                    className={cn(
                      'mb-0.5 text-3xl font-bold',
                      isSelected ? 'text-[var(--color-primary)]' : plan.isPopular ? 'text-[#C9943A]' : 'text-white'
                    )}
                  >
                    S/. {plan.price.toFixed(2)}
                  </div>
                  <div className="mb-4 text-xs text-[var(--color-text-muted)]">
                    {plan.durationDays} días de acceso
                  </div>

                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-1.5 text-xs text-[var(--color-text-muted)]"
                      >
                        <span className="text-[var(--color-primary)]">✓</span> {f}
                      </li>
                    ))}
                  </ul>

                  {isSelected && (
                    <div className="mt-4 rounded-lg bg-[var(--color-primary-bg)] py-1.5 text-center text-xs font-bold text-[var(--color-primary)]">
                      ✓ Seleccionado
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selectedPlan}
            onClick={() => selectedPlan && setStep('payment')}
          >
            {selectedPlan
              ? `Continuar con ${selectedPlan.name} — S/. ${selectedPlan.price.toFixed(2)} →`
              : 'Selecciona un plan para continuar'}
          </Button>
        </div>
      )}

      {step === 'payment' && selectedPlan && (
        <Card padding="sm" className="rounded-xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(189,255,223,0.12)] pb-4">
            <div>
              <div className="font-bold text-white">{selectedPlan.name}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {selectedPlan.durationDays} días de acceso
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--color-primary)]">
              S/. {selectedPlan.price.toFixed(2)}
            </div>
          </div>

          <h3 className="mb-3 text-sm font-semibold text-white">Método de pago</h3>
          <div className="mb-5 grid grid-cols-2 gap-3">
            {(['yape', 'plin'] as const).map((method) => (
              <Button
                key={method}
                type="button"
                variant={paymentMethod === method ? 'primary' : 'ghost'}
                size="md"
                fullWidth
                onClick={() => setPaymentMethod(method)}
              >
                {method === 'yape' ? '💜 Yape' : '💙 Plin'}
              </Button>
            ))}
          </div>

          <Card
            padding="sm"
            className="mb-5 rounded-xl border-[var(--color-surface-border)] bg-[var(--color-surface)] text-center"
          >
            <div className="mb-1 text-xs text-[var(--color-text-muted)]">Envía exactamente</div>
            <div className="mb-2 text-3xl font-bold text-[#C9943A]">
              S/. {selectedPlan.price.toFixed(2)}
            </div>
            <div className="mb-1 text-xs text-[var(--color-text-muted)]">al número</div>
            <div className="mb-1 text-2xl font-bold text-white">{paymentNumber}</div>
            <div className="text-xs text-[var(--color-text-muted)]">
              A nombre de: {paymentInfo?.accountName ?? 'Institución'}
            </div>
          </Card>

          <Card
            padding="sm"
            className="mb-5 space-y-2 rounded-xl border-[var(--color-surface-border)] bg-[var(--color-primary-bg)]"
          >
            {(paymentInfo?.instructions
              ? paymentInfo.instructions.split(/\.\s+/).filter(Boolean)
              : [
                  'Realiza el pago al número de arriba',
                  'Toma captura del comprobante',
                  'Ingresa el número de operación abajo',
                  'Activación en máximo 24 horas',
                ]
            ).map((stepText, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-bg)] text-xs font-bold text-[var(--color-primary)]">
                  {i + 1}
                </span>
                {stepText.endsWith('.') ? stepText : `${stepText}.`}
              </div>
            ))}
          </Card>

          <Input
            label="Número de operación *"
            placeholder="Ej: 123456789"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            containerClassName="mb-5"
          />

          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={() => setStep('plans')}>
              ← Atrás
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              onClick={() => void handleRequestPremium()}
            >
              Confirmar pago
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

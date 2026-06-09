'use client'

export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { NEON } from '@/lib/constants/theme'
const GOLD = '#FFD700'

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
        const res = await apiClient.get<{ plans: Plan[]; paymentInfo: PaymentInfo }>('/subscriptions/plans')
        if (cancelled) return
        setPlans(res.data.plans ?? [])
        setPaymentInfo(res.data.paymentInfo ?? null)
      } catch {
        if (!cancelled) setPlansError('No se pudieron cargar los planes. Intenta recargar la página.')
      } finally {
        if (!cancelled) setPlansLoading(false)
      }
    }
    void loadPlans()
    return () => { cancelled = true }
  }, [])

  const handleRequestPremium = async () => {
    if (!selectedPlan) return
    if (!reference.trim()) {
      alert('Ingresa el número de operación')
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
    } catch {
      alert('Error al enviar solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const paymentNumber = paymentMethod === 'yape'
    ? paymentInfo?.yapeNumber ?? '—'
    : paymentInfo?.plinNumber ?? '—'

  if (success && selectedPlan) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <style>{`
          @keyframes pop { 0%{transform:scale(0.5);opacity:0} 80%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
          .pop { animation: pop 0.5s ease forwards; }
        `}</style>
        <div className="text-7xl mb-6 pop">🐊</div>
        <h1 className="text-2xl font-bold text-white mb-3">¡Solicitud enviada!</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Verificaremos tu pago y activaremos tu cuenta en menos de 24 horas.
        </p>
        <div className="rounded-2xl p-5 mb-6 text-left space-y-3"
          style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${NEON}20` }}>
          {[
            { label: 'Plan', value: selectedPlan.name },
            { label: 'Monto', value: `S/. ${selectedPlan.price.toFixed(2)}` },
            { label: 'Método', value: paymentMethod.toUpperCase() },
            { label: 'Referencia', value: reference },
          ].map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-500">{item.label}</span>
              <span className="text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
        <Link href="/dashboard"
          className="block w-full py-3 rounded-xl font-bold text-sm text-center"
          style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: '#000' }}>
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      <Link href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors">
        ← Volver al inicio
      </Link>

      {(isNew || isBlocked) && (
        <div className="rounded-2xl p-5 mb-6 text-center fade-in"
          style={{ background: 'rgba(74,124,89,0.08)', border: `1px solid ${NEON}30` }}>
          <div className="text-4xl mb-2">🐊</div>
          <h2 className="text-white font-bold text-lg mb-1">
            {isNew ? '¡Cuenta creada! Elige tu plan para comenzar' : '¡Un paso más para practicar!'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isNew
              ? 'Tu cuenta está lista. Selecciona un plan y paga por Yape/Plin para activar tu acceso.'
              : 'Necesitas un plan activo para acceder a los simulacros PNP.'}
          </p>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Elige tu plan</h1>
        <p className="text-gray-400 text-sm">Acceso ilimitado a todos los simulacros PNP · Paga con Yape o Plin</p>
      </div>

      {plansLoading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 animate-bounce">🐊</div>
          <p className="text-gray-400">Cargando planes...</p>
        </div>
      )}

      {plansError && (
        <div className="rounded-xl p-4 mb-6 text-sm text-center"
          style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', color: '#FF5252' }}>
          {plansError}
        </div>
      )}

      {!plansLoading && !plansError && plans.length === 0 && (
        <div className="rounded-xl p-8 mb-6 text-center"
          style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${NEON}20` }}>
          <p className="text-gray-400 text-sm">
            Tu institución aún no ha configurado planes de suscripción. Contacta al administrador.
          </p>
        </div>
      )}

      {step === 'plans' && !plansLoading && plans.length > 0 && (
        <div className="fade-in">
          <div className={`grid gap-4 mb-6 ${plans.length >= 3 ? 'md:grid-cols-3' : plans.length === 2 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id
              return (
                <div key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="relative rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: isSelected ? 'rgba(74,124,89,0.08)' : 'rgba(0,8,4,0.9)',
                    border: `2px solid ${isSelected ? NEON : plan.isPopular ? `${GOLD}40` : '#ffffff10'}`,
                    boxShadow: isSelected ? `0 0 25px ${NEON}30` : 'none'
                  }}>

                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: GOLD, color: '#000' }}>
                      ⭐ MÁS POPULAR
                    </div>
                  )}

                  <div className="text-white font-bold text-base mb-0.5">{plan.name}</div>
                  <div className="text-gray-500 text-xs mb-3">{plan.description}</div>

                  <div className="text-3xl font-bold mb-0.5"
                    style={{ color: isSelected ? NEON : plan.isPopular ? GOLD : '#fff' }}>
                    S/. {plan.price.toFixed(2)}
                  </div>
                  <div className="text-gray-600 text-xs mb-4">{plan.durationDays} días de acceso</div>

                  <ul className="space-y-1.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"
                        style={{ color: isSelected ? '#9CA3AF' : '#6B7280' }}>
                        <span style={{ color: isSelected ? NEON : '#374151' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>

                  {isSelected && (
                    <div className="mt-4 text-center text-xs font-bold py-1.5 rounded-lg"
                      style={{ backgroundColor: `${NEON}20`, color: NEON }}>
                      ✓ Seleccionado
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={() => selectedPlan && setStep('payment')}
            disabled={!selectedPlan}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
            style={{
              background: selectedPlan ? `linear-gradient(135deg, ${NEON}, #1A5C2E)` : '#1A2A20',
              color: selectedPlan ? '#000' : '#4B5563',
              boxShadow: selectedPlan ? `0 0 20px ${NEON}40` : 'none',
              cursor: selectedPlan ? 'pointer' : 'not-allowed'
            }}>
            {selectedPlan
              ? `Continuar con ${selectedPlan.name} — S/. ${selectedPlan.price.toFixed(2)} →`
              : 'Selecciona un plan para continuar'}
          </button>
        </div>
      )}

      {step === 'payment' && selectedPlan && (
        <div className="fade-in">
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${NEON}20` }}>

            <div className="flex items-center justify-between mb-6 pb-4"
              style={{ borderBottom: '1px solid #ffffff08' }}>
              <div>
                <div className="text-white font-bold">{selectedPlan.name}</div>
                <div className="text-gray-500 text-xs">{selectedPlan.durationDays} días de acceso</div>
              </div>
              <div className="text-2xl font-bold" style={{ color: NEON }}>
                S/. {selectedPlan.price.toFixed(2)}
              </div>
            </div>

            <h3 className="text-white font-semibold text-sm mb-3">Método de pago</h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {(['yape', 'plin'] as const).map(method => (
                <button key={method}
                  onClick={() => setPaymentMethod(method)}
                  className="p-3 rounded-xl text-center font-bold transition-all"
                  style={{
                    border: `2px solid ${paymentMethod === method ? NEON : '#ffffff10'}`,
                    backgroundColor: paymentMethod === method ? 'rgba(74,124,89,0.08)' : 'rgba(0,5,2,0.5)',
                    color: paymentMethod === method ? NEON : '#6B7280'
                  }}>
                  {method === 'yape' ? '💜 Yape' : '💙 Plin'}
                </button>
              ))}
            </div>

            <div className="rounded-xl p-4 mb-5 text-center"
              style={{ backgroundColor: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff08' }}>
              <div className="text-gray-500 text-xs mb-1">Envía exactamente</div>
              <div className="text-3xl font-bold mb-2" style={{ color: GOLD }}>
                S/. {selectedPlan.price.toFixed(2)}
              </div>
              <div className="text-gray-400 text-xs mb-1">al número</div>
              <div className="text-white text-2xl font-bold mb-1">{paymentNumber}</div>
              <div className="text-gray-600 text-xs">
                A nombre de: {paymentInfo?.accountName ?? 'Institución'}
              </div>
            </div>

            <div className="rounded-xl p-4 mb-5 space-y-2"
              style={{ backgroundColor: 'rgba(74,124,89,0.05)', border: `1px solid ${NEON}15` }}>
              {(paymentInfo?.instructions
                ? paymentInfo.instructions.split(/\.\s+/).filter(Boolean)
                : [
                    'Realiza el pago al número de arriba',
                    'Toma captura del comprobante',
                    'Ingresa el número de operación abajo',
                    'Activación en máximo 24 horas'
                  ]
              ).map((stepText, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: `${NEON}20`, color: NEON }}>
                    {i + 1}
                  </span>
                  {stepText.endsWith('.') ? stepText : `${stepText}.`}
                </div>
              ))}
            </div>

            <label className="block text-xs text-gray-500 mb-2">Número de operación *</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl text-sm text-white mb-5"
              style={{
                backgroundColor: 'rgba(0,5,2,0.8)',
                border: `1px solid ${reference ? NEON : '#ffffff15'}`,
                outline: 'none'
              }}
              placeholder="Ej: 123456789"
              value={reference}
              onChange={e => setReference(e.target.value)}
            />

            <div className="flex gap-3">
              <button onClick={() => setStep('plans')}
                className="px-5 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ backgroundColor: 'rgba(0,5,2,0.5)', color: '#6B7280', border: '1px solid #ffffff10' }}>
                ← Atrás
              </button>
              <button onClick={handleRequestPremium} disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`,
                  color: '#000',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: `0 0 20px ${NEON}40`
                }}>
                {loading ? 'Enviando...' : '✅ Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

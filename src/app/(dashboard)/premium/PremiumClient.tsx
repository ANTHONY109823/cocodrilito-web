'use client'

export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import apiClient from '@/lib/api/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { NEON, NEON_DARK, policeGreenRgba } from '@/lib/constants/theme'
const GOLD = '#FFD700'

type PlanKey = 'monthly' | 'bimonthly' | 'full'

const plans: Record<PlanKey, { name: string; price: number; days: number; savings: string | null; popular: boolean; desc: string; features: string[] }> = {
  monthly: {
    name: 'Mensual',
    price: 12.90,
    days: 30,
    savings: null,
    popular: false,
    desc: 'Ideal para empezar',
    features: ['Simulacros ilimitados', 'Banco completo de preguntas', 'Ranking completo', 'Sin publicidad']
  },
  bimonthly: {
    name: 'Bimestral',
    price: 22.90,
    days: 60,
    savings: 'Ahorra S/. 2.90',
    popular: false,
    desc: '2 meses de preparación',
    features: ['Simulacros ilimitados', 'Banco completo de preguntas', 'Ranking completo', 'Ahorra S/. 2.90 vs mensual', 'Sin publicidad']
  },
  full: {
    name: 'Full Proceso',
    price: 42.90,
    days: 180,
    savings: 'Ahorra S/. 34.60',
    popular: true,
    desc: 'Hasta el examen de octubre',
    features: ['Simulacros ilimitados', 'Banco completo de preguntas', 'Ranking completo', '180 días garantizados', 'Cubre todo el proceso de ascenso', 'Ahorra S/. 34.60 vs mensual', 'Sin publicidad']
  }
}

export default function PremiumPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === '1'
  const isBlocked = searchParams.get('blocked') === '1'

  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null)
  const [step, setStep] = useState<'plans' | 'payment'>('plans')
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin'>('yape')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRequestPremium = async () => {
    if (!reference.trim()) {
      alert('Ingresa el número de operación')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/subscriptions/request', {
        paymentMethod: paymentMethod === 'yape' ? 1 : 2,
        amountPaid: plans[selectedPlan!].price,
        paymentReference: reference,
        notes: `Plan ${plans[selectedPlan!].name} - ${paymentMethod.toUpperCase()}`,
      })
      setSuccess(true)
    } catch {
      alert('Error al enviar solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // PANTALLA DE ÉXITO
  if (success) {
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
            { label: 'Plan', value: plans[selectedPlan!].name },
            { label: 'Monto', value: `S/. ${plans[selectedPlan!].price}` },
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
          style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000' }}>
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

      {/* BOTÓN VOLVER */}
      <Link href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors">
        ← Volver al inicio
      </Link>

      {/* BANNER NUEVO / BLOQUEADO */}
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

      {/* HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Elige tu plan</h1>
        <p className="text-gray-400 text-sm">Acceso ilimitado a todos los simulacros PNP · Paga con Yape o Plin</p>
      </div>

      {/* PASO 1 — PLANES */}
      {step === 'plans' && (
        <div className="fade-in">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {(Object.keys(plans) as PlanKey[]).map((key) => {
              const plan = plans[key]
              const isSelected = selectedPlan === key
              return (
                <div key={key}
                  onClick={() => setSelectedPlan(key)}
                  className="relative rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: isSelected ? 'rgba(74,124,89,0.08)' : 'rgba(0,8,4,0.9)',
                    border: `2px solid ${isSelected ? NEON : plan.popular ? `${GOLD}40` : '#ffffff10'}`,
                    boxShadow: isSelected ? `0 0 25px ${NEON}30` : 'none'
                  }}>

                  {/* BADGES */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: GOLD, color: '#000' }}>
                      ⭐ MÁS POPULAR
                    </div>
                  )}
                  {plan.savings && !plan.popular && (
                    <div className="inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2"
                      style={{ backgroundColor: `${NEON}20`, color: NEON }}>
                      {plan.savings}
                    </div>
                  )}

                  <div className="text-white font-bold text-base mb-0.5">{plan.name}</div>
                  <div className="text-gray-500 text-xs mb-3">{plan.desc}</div>

                  <div className="text-3xl font-bold mb-0.5"
                    style={{ color: isSelected ? NEON : plan.popular ? GOLD : '#fff' }}>
                    S/. {plan.price}
                  </div>
                  <div className="text-gray-600 text-xs mb-4">{plan.days} días de acceso</div>

                  <ul className="space-y-1.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"
                        style={{ color: isSelected ? '#9CA3AF' : '#6B7280' }}>
                        <span style={{ color: isSelected ? NEON : '#374151' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>

                  {/* INDICADOR SELECCIONADO */}
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
              background: selectedPlan ? `linear-gradient(135deg, ${NEON}, #2D5A3D)` : '#1A2A20',
              color: selectedPlan ? '#000' : '#4B5563',
              boxShadow: selectedPlan ? `0 0 20px ${NEON}40` : 'none',
              cursor: selectedPlan ? 'pointer' : 'not-allowed'
            }}>
            {selectedPlan
              ? `Continuar con ${plans[selectedPlan].name} — S/. ${plans[selectedPlan].price} →`
              : 'Selecciona un plan para continuar'}
          </button>
        </div>
      )}

      {/* PASO 2 — PAGO */}
      {step === 'payment' && (
        <div className="fade-in">
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${NEON}20` }}>

            {/* RESUMEN DEL PLAN */}
            <div className="flex items-center justify-between mb-6 pb-4"
              style={{ borderBottom: '1px solid #ffffff08' }}>
              <div>
                <div className="text-white font-bold">{plans[selectedPlan!].name}</div>
                <div className="text-gray-500 text-xs">{plans[selectedPlan!].days} días de acceso</div>
              </div>
              <div className="text-2xl font-bold" style={{ color: NEON }}>
                S/. {plans[selectedPlan!].price}
              </div>
            </div>

            {/* MÉTODO DE PAGO */}
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

            {/* DATOS DE PAGO */}
            <div className="rounded-xl p-4 mb-5 text-center"
              style={{ backgroundColor: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff08' }}>
              <div className="text-gray-500 text-xs mb-1">Envía exactamente</div>
              <div className="text-3xl font-bold mb-2" style={{ color: GOLD }}>
                S/. {plans[selectedPlan!].price}
              </div>
              <div className="text-gray-400 text-xs mb-1">al número</div>
              <div className="text-white text-2xl font-bold mb-1">999 999 999</div>
              <div className="text-gray-600 text-xs">A nombre de: Cocodrilito SAC</div>
            </div>

            {/* INSTRUCCIONES */}
            <div className="rounded-xl p-4 mb-5 space-y-2"
              style={{ backgroundColor: 'rgba(74,124,89,0.05)', border: `1px solid ${NEON}15` }}>
              {[
                'Realiza el pago al número de arriba',
                'Toma captura del comprobante',
                'Ingresa el número de operación abajo',
                'Activación en máximo 24 horas'
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: `${NEON}20`, color: NEON }}>
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>

            {/* NÚMERO DE OPERACIÓN */}
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

            {/* BOTONES */}
            <div className="flex gap-3">
              <button onClick={() => setStep('plans')}
                className="px-5 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ backgroundColor: 'rgba(0,5,2,0.5)', color: '#6B7280', border: '1px solid #ffffff10' }}>
                ← Atrás
              </button>
              <button onClick={handleRequestPremium} disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`,
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
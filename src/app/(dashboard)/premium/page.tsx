'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import apiClient from '@/lib/api/client'
import { useRouter } from 'next/navigation'

export default function PremiumPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | null>(null)
  const [step, setStep] = useState<'plans' | 'payment' | 'confirm'>('plans')
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin'>('yape')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const plans = {
    monthly: { name: 'Premium Mensual', price: 29.90, days: 30, savings: null },
    quarterly: { name: 'Premium Trimestral', price: 79.90, days: 90, savings: 'Ahorra S/. 9.80' },
  }

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

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-6xl mb-6">🐊</div>
        <h1 className="text-2xl font-bold text-white mb-3">¡Solicitud enviada!</h1>
        <p className="text-gray-400 mb-6">
          Verificaremos tu pago y activaremos tu cuenta Premium en menos de 24 horas.
          Te notificaremos por correo.
        </p>
        <div className="card mb-6 text-left">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Plan</span>
            <span className="text-white">{plans[selectedPlan!].name}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Monto</span>
            <span className="text-white">S/. {plans[selectedPlan!].price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Referencia</span>
            <span className="text-white">{reference}</span>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn-primary">
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-2xl font-bold text-white">Hazte Premium</h1>
        <p className="text-gray-400 mt-1">Acceso ilimitado a todos los simulacros PNP</p>
      </div>

      {step === 'plans' && (
        <>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {(Object.keys(plans) as Array<'monthly' | 'quarterly'>).map((key) => {
              const plan = plans[key]
              const isSelected = selectedPlan === key
              const isPopular = key === 'monthly'
              return (
                <div key={key}
                  onClick={() => setSelectedPlan(key)}
                  className="card cursor-pointer transition-all"
                  style={{
                    border: isSelected ? '2px solid #1D9E75' : '2px solid #1A2E24',
                    backgroundColor: isSelected ? '#111f17' : 'var(--bg-card)',
                  }}>
                  {isPopular && (
                    <div className="text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block"
                      style={{ backgroundColor: '#1D9E75', color: '#fff' }}>
                      MÁS POPULAR
                    </div>
                  )}
                  {plan.savings && (
                    <div className="text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block"
                      style={{ backgroundColor: '#EF9F27', color: '#000' }}>
                      {plan.savings}
                    </div>
                  )}
                  <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-1" style={{ color: '#1D9E75' }}>
                    S/. {plan.price}
                  </div>
                  <div className="text-gray-500 text-sm mb-4">{plan.days} días de acceso</div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>✅ Exámenes ilimitados</li>
                    <li>✅ Banco completo +1000 preguntas</li>
                    <li>✅ Ranking completo</li>
                    <li>✅ 2 dispositivos simultáneos</li>
                    <li>✅ Sin publicidad</li>
                  </ul>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => selectedPlan && setStep('payment')}
            disabled={!selectedPlan}
            className="btn-primary"
            style={{ opacity: selectedPlan ? 1 : 0.5 }}>
            Continuar con {selectedPlan ? plans[selectedPlan].name : 'un plan'} →
          </button>
        </>
      )}

      {step === 'payment' && (
        <>
          <div className="card mb-6">
            <h2 className="text-white font-semibold mb-4">Elige tu método de pago</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(['yape', 'plin'] as const).map((method) => (
                <button key={method}
                  onClick={() => setPaymentMethod(method)}
                  className="p-4 rounded-xl text-center font-bold text-lg transition-all"
                  style={{
                    border: paymentMethod === method ? '2px solid #1D9E75' : '2px solid #1A2E24',
                    backgroundColor: paymentMethod === method ? '#111f17' : '#0F1A14',
                    color: paymentMethod === method ? '#1D9E75' : '#9CA3AF',
                  }}>
                  {method === 'yape' ? '💜 Yape' : '💙 Plin'}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl mb-4 text-center"
              style={{ backgroundColor: '#0F1A14', border: '1px solid #1A2E24' }}>
              <div className="text-gray-400 text-sm mb-1">Envía tu pago a:</div>
              <div className="text-white text-2xl font-bold mb-1">999 999 999</div>
              <div className="text-gray-500 text-sm">A nombre de: Cocodrilito SAC</div>
              <div className="text-2xl mt-3 font-bold" style={{ color: '#EF9F27' }}>
                S/. {plans[selectedPlan!].price}
              </div>
            </div>

            <div className="text-sm text-gray-400 space-y-1 mb-4">
              <p>1. Realiza el pago al número de arriba</p>
              <p>2. Toma captura del comprobante</p>
              <p>3. Ingresa el número de operación abajo</p>
              <p>4. Activación en máximo 24 horas</p>
            </div>

            <label className="block text-sm text-gray-400 mb-2">
              Número de operación *
            </label>
            <input
              type="text"
              className="input-field mb-4"
              placeholder="Ej: 123456789"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep('plans')}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ backgroundColor: '#1A2E24', color: '#9CA3AF' }}>
                ← Atrás
              </button>
              <button
                onClick={handleRequestPremium}
                disabled={loading}
                className="flex-1 btn-primary"
                style={{ margin: 0 }}>
                {loading ? 'Enviando...' : '✅ Confirmar pago'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
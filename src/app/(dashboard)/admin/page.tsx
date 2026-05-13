'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'

interface Subscription {
  id: string
  userId: string
  planType: string
  paymentMethod: string
  amountPaid: number
  paymentReference: string
  status: string
  createdAt: string
}

interface Question {
  id: string
  questionText: string
  category: string
  difficulty: string
  status: string
  yearValuation: number
}

export default function AdminPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'subscriptions' | 'questions'>('subscriptions')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  useEffect(() => {
    loadFromStorage()
  }, [])

  useEffect(() => {
    if (user) {
      const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin'
      if (!isAdmin) return
      loadData()
    }
  }, [user, tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'subscriptions') {
        const res = await apiClient.get('/subscriptions/pending')
        setSubscriptions(res.data)
      } else {
        const res = await apiClient.get('/admin/Questions?pageSize=50')
        setQuestions(res.data.items)
      }
    } catch {
      console.error('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setApprovingId(id)
    try {
      await apiClient.put(`/subscriptions/${id}/approve`, { durationDays: 30 })
      setSubscriptions(prev => prev.filter(s => s.id !== id))
      alert('✅ Suscripción aprobada — usuario activado como Premium')
    } catch {
      alert('Error al aprobar')
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo del rechazo:')
    if (!reason) return
    try {
      await apiClient.put(`/subscriptions/${id}/reject`, { reason })
      setSubscriptions(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Error al rechazar')
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    try {
      await apiClient.delete(`/admin/Questions/${id}`)
      setQuestions(prev => prev.filter(q => q.id !== id))
    } catch {
      alert('Error al eliminar')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Panel Admin 🛡️</h1>
        <p className="text-gray-400 text-sm mt-1">Gestión de Cocodrilito</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('subscriptions')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: tab === 'subscriptions' ? '#1D9E75' : '#1A2E24',
            color: tab === 'subscriptions' ? '#fff' : '#9CA3AF',
          }}>
          💳 Suscripciones pendientes
          {subscriptions.length > 0 && tab !== 'subscriptions' && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs"
              style={{ backgroundColor: '#D85A30', color: '#fff' }}>
              {subscriptions.length}
            </span>
          )}
        </button>
        <button onClick={() => setTab('questions')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: tab === 'questions' ? '#1D9E75' : '#1A2E24',
            color: tab === 'questions' ? '#fff' : '#9CA3AF',
          }}>
          📝 Banco de preguntas
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : tab === 'subscriptions' ? (

        <div>
          {subscriptions.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-gray-400">No hay suscripciones pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 rounded text-xs font-bold"
                          style={{ backgroundColor: '#1A2E24', color: '#1D9E75' }}>
                          {sub.paymentMethod}
                        </span>
                        <span className="text-white font-semibold">S/. {sub.amountPaid}</span>
                        <span className="text-gray-400 text-sm">{sub.planType}</span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        Ref: <span className="text-white">{sub.paymentReference || 'Sin referencia'}</span>
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {new Date(sub.createdAt).toLocaleString('es-PE')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(sub.id)}
                        disabled={approvingId === sub.id}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{ backgroundColor: '#1D9E75', color: '#fff' }}>
                        {approvingId === sub.id ? '...' : '✅ Aprobar'}
                      </button>
                      <button
                        onClick={() => handleReject(sub.id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{ backgroundColor: '#2A1010', color: '#D85A30', border: '1px solid #D85A30' }}>
                        ❌ Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      ) : (

        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm">{questions.length} preguntas cargadas</p>
            <button
              onClick={() => router.push('/admin/upload')}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#1D9E75', color: '#fff' }}>
              📤 Carga masiva CSV
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-400">No hay preguntas en el banco</p>
              <p className="text-gray-500 text-sm mt-1">Usa la carga masiva para importar preguntas</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1A2E24' }}>
                    <th className="text-left p-4 text-gray-500 text-sm">Pregunta</th>
                    <th className="text-left p-4 text-gray-500 text-sm">Categoría</th>
                    <th className="text-left p-4 text-gray-500 text-sm">Estado</th>
                    <th className="text-left p-4 text-gray-500 text-sm">Año</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id} style={{ borderBottom: '1px solid #1A2E24' }}>
                      <td className="p-4 text-white text-sm max-w-xs">
                        <div className="truncate">{q.questionText}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: '#1A2E24', color: '#1D9E75' }}>
                          {q.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs" style={{
                          color: q.status === 'Active' ? '#1D9E75' :
                            q.status === 'Draft' ? '#EF9F27' : '#6B7280'
                        }}>
                          {q.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{q.yearValuation}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-red-400 hover:text-red-300 text-sm">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
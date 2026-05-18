'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'

interface User {
  id: string
  fullName: string
  email: string
  dni: string
  rank: string
  unit: string
  planType: string
  role: string
  isActive: boolean
  createdByAdmin: boolean
  createdAt: string
  subscription?: { expiresAt: string; startsAt: string } | null
}

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
  difficulty: number
  status: string
  yearValuation: number
  answerOptions?: { id: string; optionText: string; isCorrect: boolean; optionIndex: number }[]
}

const NEON = '#00C87A'
const NEON2 = '#4FC3F7'
const GOLD = '#FFD700'
const RED = '#FF5252'
const PURPLE = '#A855F7'

export default function AdminPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'users' | 'subscriptions' | 'inactive' | 'create' | 'questions'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'web'>('all')
  const [inactiveFilter, setInactiveFilter] = useState<'all' | 'admin' | 'web'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [exams, setExams] = useState<{ id: string; title: string }[]>([])

  const excelInputRef = useRef<HTMLInputElement>(null)
const [uploadingExcel, setUploadingExcel] = useState(false)

const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  setUploadingExcel(true)
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post('/admin/users/import/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    setMsg({ text: `✅ ${res.data.created} usuarios importados`, ok: true })
    if (res.data.errors?.length > 0) {
      console.warn('Errores de importación:', res.data.errors)
    }
    loadData()
  } catch (err: any) {
    setMsg({ text: err.response?.data?.message || 'Error al importar', ok: false })
  } finally {
    setUploadingExcel(false)
    if (excelInputRef.current) excelInputRef.current.value = ''
  }
}

const handleDownloadExcelTemplate = () => {
  const csv = 'Nombre Completo,DNI,Email,Contraseña,Grado,Unidad,Días\nJuan Pérez Torres,12345678,juan@gmail.com,Temp1234!,Suboficial de 3ra,Comisaría Lima Norte,180\n'
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla_usuarios.csv'
  a.click()
}

  const [form, setForm] = useState({
    fullName: '', dni: '', email: '', password: '',
    rank: '', unit: '', planDays: 180
  })

  const [qForm, setQForm] = useState({
    examId: '', questionText: '', category: 'DOCTRINA',
    difficulty: 1, yearValuation: 2025, orderIndex: 1, explanation: '',
    options: [
      { optionText: '', isCorrect: true, optionIndex: 0 },
      { optionText: '', isCorrect: false, optionIndex: 1 },
      { optionText: '', isCorrect: false, optionIndex: 2 },
      { optionText: '', isCorrect: false, optionIndex: 3 },
    ]
  })

  useEffect(() => { loadFromStorage() }, [])

  useEffect(() => {
    if (user) {
      const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin'
      if (!isAdmin) { router.push('/dashboard'); return }
      loadData()
    }
  }, [user, tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'users' || tab === 'inactive') {
        const res = await apiClient.get('/admin/users')
        setUsers(res.data)
      } else if (tab === 'subscriptions') {
        const res = await apiClient.get('/subscriptions/pending')
        setSubscriptions(res.data)
      } else if (tab === 'questions') {
        const [qRes, eRes] = await Promise.all([
          apiClient.get('/admin/Questions'),
          apiClient.get('/exams/list'),
        ])
        setQuestions(Array.isArray(qRes.data) ? qRes.data : qRes.data?.items || [])
        setExams(Array.isArray(eRes.data) ? eRes.data : [])
      }
    } catch { } finally { setLoading(false) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await apiClient.post('/admin/users', form)
      setMsg({ text: '✅ Usuario creado exitosamente', ok: true })
      setForm({ fullName: '', dni: '', email: '', password: '', rank: '', unit: '', planDays: 180 })
      setTimeout(() => { setTab('users'); setMsg(null) }, 2000)
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al crear usuario', ok: false })
    } finally { setSaving(false) }
  }

  // Aprobación con días calculados según monto pagado
  const inferDays = (amount: number) =>
    amount <= 13 ? 30 : amount <= 23 ? 60 : 180

  const handleApprove = async (sub: Subscription) => {
    try {
      const days = inferDays(sub.amountPaid)
      await apiClient.put(`/subscriptions/${sub.id}/approve`, { durationDays: days })
      setSubscriptions(prev => prev.filter(s => s.id !== sub.id))
      setMsg({ text: `✅ Suscripción aprobada — ${days} días activados`, ok: true })
      setTimeout(() => setMsg(null), 3000)
    } catch { setMsg({ text: 'Error al aprobar', ok: false }) }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo del rechazo:')
    if (!reason) return
    try {
      await apiClient.put(`/subscriptions/${id}/reject`, { reason })
      setSubscriptions(prev => prev.filter(s => s.id !== id))
    } catch { }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Desactivar este usuario?')) return
    try {
      await apiClient.delete(`/admin/users/${id}`)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u))
      setMsg({ text: '⛔ Usuario desactivado', ok: false })
      setTimeout(() => setMsg(null), 2000)
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al desactivar', ok: false })
    }
  }

  const handleReactivate = async (id: string) => {
    try {
      await apiClient.put(`/admin/users/${id}/reactivate`, {})
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u))
      setMsg({ text: '✅ Usuario reactivado', ok: true })
      setTimeout(() => setMsg(null), 2000)
    } catch { }
  }

  const handleExtend = async (id: string, days: number) => {
    try {
      await apiClient.put(`/admin/users/${id}/extend`, { planDays: days })
      setMsg({ text: `✅ Suscripción extendida ${days} días`, ok: true })
      setTimeout(() => { setMsg(null); loadData() }, 2000)
    } catch { }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/admin/import/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setMsg({ text: `✅ ${res.data.imported || 0} preguntas importadas`, ok: true })
      loadData()
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al subir archivo', ok: false })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.get('/admin/import/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = 'plantilla_preguntas.csv'; a.click()
    } catch { }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await apiClient.post('/admin/Questions', {
        examId: qForm.examId, questionText: qForm.questionText,
        category: qForm.category, difficulty: qForm.difficulty,
        yearValuation: qForm.yearValuation, orderIndex: qForm.orderIndex,
        explanation: qForm.explanation, answerOptions: qForm.options
      })
      setMsg({ text: '✅ Pregunta creada', ok: true })
      setQForm({ ...qForm, questionText: '', explanation: '', orderIndex: qForm.orderIndex + 1 })
      loadData()
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error', ok: false })
    } finally { setSaving(false) }
  }

  const handleEditQuestion = async (q: Question) => {
    try {
      const res = await apiClient.get(`/admin/Questions/${q.id}`)
      setEditingQuestion(res.data)
    } catch { setEditingQuestion(q) }
  }

  const handleSaveEdit = async () => {
    if (!editingQuestion) return
    setSaving(true)
    try {
      await apiClient.put(`/admin/Questions/${editingQuestion.id}`, {
        questionText: editingQuestion.questionText,
        category: editingQuestion.category,
        difficulty: editingQuestion.difficulty,
        yearValuation: editingQuestion.yearValuation,
        answerOptions: editingQuestion.answerOptions
      })
      setMsg({ text: '✅ Pregunta actualizada', ok: true })
      setEditingQuestion(null)
      loadData()
    } catch { setMsg({ text: 'Error al actualizar', ok: false }) }
    finally { setSaving(false) }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    try {
      await apiClient.delete(`/admin/Questions/${id}`)
      setQuestions(prev => prev.filter(q => q.id !== id))
    } catch { }
  }

  const handleDeletePermanent = async (id: string) => {
    if (!confirm('⚠️ ¿Eliminar PERMANENTEMENTE este usuario? Esta acción no se puede deshacer.')) return
    try {
      await apiClient.delete(`/admin/users/${id}/permanent`)
      setUsers(prev => prev.filter(u => u.id !== id))
      setMsg({ text: '🗑️ Usuario eliminado permanentemente', ok: false })
      setTimeout(() => setMsg(null), 3000)
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al eliminar', ok: false })
    }
  }

  const handleDeleteAllQuestions = async () => {
    if (!confirm('⚠️ ¿Eliminar TODAS las preguntas del banco? Esta acción no se puede deshacer.')) return
    if (!confirm('¿Estás SEGURO? Se eliminarán todas las preguntas permanentemente.')) return
    try {
      const res = await apiClient.delete('/admin/Questions/bulk')
      setMsg({ text: `🗑️ ${res.data.deleted} preguntas eliminadas`, ok: false })
      setTimeout(() => { setMsg(null); loadData() }, 2000)
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al eliminar', ok: false })
    }
  }

  const daysLeft = (expiresAt?: string | null) => {
    if (!expiresAt) return null
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  }

  const activeUsers = users.filter(u => u.isActive)
  const inactiveUsers = users.filter(u => !u.isActive)
  const pendingPayment = users.filter(u => u.isActive && u.planType === 'Free')

  const filteredActiveUsers = activeUsers.filter(u => {
    if (userFilter === 'admin') return u.createdByAdmin
    if (userFilter === 'web') return !u.createdByAdmin
    return true
  })

  const filteredInactiveUsers = inactiveUsers.filter(u => {
    if (inactiveFilter === 'admin') return u.createdByAdmin
    if (inactiveFilter === 'web') return !u.createdByAdmin
    return true
  })

  const tabs = [
    { key: 'users',         label: '👥 Usuarios',          count: activeUsers.length,   countColor: NEON },
    { key: 'subscriptions', label: '💳 Pendientes',         count: subscriptions.length, countColor: GOLD },
    { key: 'inactive',      label: '🔴 Inactivos',          count: inactiveUsers.length, countColor: RED  },
    { key: 'create',        label: '➕ Crear usuario',       count: null,                 countColor: NEON },
    { key: 'questions',     label: '📝 Banco de preguntas', count: questions.length,     countColor: NEON2 },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .input-admin { width:100%; padding:10px 14px; border-radius:10px; background:rgba(0,5,2,0.8); border:1px solid #ffffff15; color:#fff; font-size:13px; outline:none; }
        .input-admin:focus { border-color: ${NEON}50; }
        .input-admin::placeholder { color:#4B5563; }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Panel Admin 🛡️</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de Cocodrilito</p>
        </div>
        <div className="flex gap-4 text-right text-sm">
          <div><span className="font-bold" style={{ color: NEON }}>{activeUsers.length}</span> <span className="text-gray-500">activos</span></div>
          <div><span className="font-bold" style={{ color: GOLD }}>{pendingPayment.length}</span> <span className="text-gray-500">sin pago</span></div>
          <div><span className="font-bold" style={{ color: RED }}>{inactiveUsers.length}</span> <span className="text-gray-500">inactivos</span></div>
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium fade-in"
          style={{ backgroundColor: msg.ok ? 'rgba(0,200,122,0.1)' : 'rgba(255,82,82,0.1)', border: `1px solid ${msg.ok ? NEON : RED}40`, color: msg.ok ? NEON : RED }}>
          {msg.text}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            style={{
              backgroundColor: tab === t.key ? (t.key === 'inactive' ? RED : NEON) : 'rgba(0,10,5,0.8)',
              color: tab === t.key ? '#000' : '#9CA3AF',
              border: `1px solid ${tab === t.key ? (t.key === 'inactive' ? RED : NEON) : '#ffffff10'}`,
              boxShadow: tab === t.key ? `0 0 20px ${t.key === 'inactive' ? RED : NEON}40` : 'none'
            }}>
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: tab === t.key ? '#000' : t.countColor, color: '#fff' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: USUARIOS ACTIVOS */}
      {tab === 'users' && (
        <div className="fade-in">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'admin', label: '🛡️ Por admin' },
                { key: 'web', label: '🌐 Desde web' },
              ].map(f => (
                <button key={f.key} onClick={() => setUserFilter(f.key as any)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: userFilter === f.key ? `${NEON2}20` : 'rgba(0,5,2,0.5)',
                    color: userFilter === f.key ? NEON2 : '#6B7280',
                    border: `1px solid ${userFilter === f.key ? NEON2 : '#ffffff10'}`
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-gray-600">
              {filteredActiveUsers.length} usuario{filteredActiveUsers.length !== 1 ? 's' : ''} activo{filteredActiveUsers.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-gray-500 text-center py-12">Cargando usuarios...</div>
            ) : filteredActiveUsers.length === 0 ? (
              <div className="text-center py-12 rounded-2xl"
                style={{ background: 'rgba(0,10,5,0.8)', border: `1px solid ${NEON}15` }}>
                <div className="text-4xl mb-3">👥</div>
                <p className="text-gray-500">No hay usuarios activos en esta categoría</p>
              </div>
            ) : filteredActiveUsers.map(u => {
              const days = daysLeft(u.subscription?.expiresAt)
              const expired = days !== null && days <= 0
              const warning = days !== null && days > 0 && days <= 7
              const noSub = u.planType === 'Free' || !u.subscription
              return (
                <div key={u.id} className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(0,8,4,0.9)',
                    border: `1px solid ${expired ? RED : warning ? GOLD : noSub ? `${GOLD}40` : NEON}15`,
                  }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold">{u.fullName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: u.planType === 'Premium' ? `${NEON}20` : `${GOLD}15`,
                            color: u.planType === 'Premium' ? NEON : GOLD
                          }}>
                          {u.planType}
                        </span>
                        {!u.createdByAdmin && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${NEON2}15`, color: NEON2 }}>
                            🌐 Web
                          </span>
                        )}
                        {noSub && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
                            ⏳ Sin pago
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {u.email} · DNI {u.dni} · {u.rank} · {u.unit}
                      </div>
                      {u.subscription && (
                        <div className="text-xs mt-1.5 font-medium"
                          style={{ color: expired ? RED : warning ? GOLD : NEON }}>
                          {expired ? '⚠️ Vencido'
                            : warning ? `⚡ Vence en ${days} días`
                            : `✓ Activo hasta ${new Date(u.subscription.expiresAt).toLocaleDateString('es-PE')} (${days} días)`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => handleExtend(u.id, 30)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${NEON2}15`, color: NEON2, border: `1px solid ${NEON2}25` }}>
                        +30d
                      </button>
                      <button onClick={() => handleExtend(u.id, 60)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}25` }}>
                        +60d
                      </button>
                      <button onClick={() => handleExtend(u.id, 180)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${NEON}15`, color: NEON, border: `1px solid ${NEON}25` }}>
                        +180d
                      </button>
                      <button onClick={() => handleDeactivate(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${RED}15`, color: RED, border: `1px solid ${RED}25` }}>
                        Desactivar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: INACTIVOS */}
      {tab === 'inactive' && (
        <div className="fade-in">
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: `rgba(255,82,82,0.06)`, border: `1px solid ${RED}25` }}>
            <span className="text-2xl">🔴</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: RED }}>Usuarios desactivados</p>
              <p className="text-xs text-gray-500 mt-0.5">Sin acceso a la plataforma. Puedes reactivarlos o extender su plan.</p>
            </div>
            <span className="ml-auto text-2xl font-bold" style={{ color: RED }}>{inactiveUsers.length}</span>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'admin', label: '🛡️ Por admin' },
              { key: 'web', label: '🌐 Desde web' },
            ].map(f => (
              <button key={f.key} onClick={() => setInactiveFilter(f.key as any)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: inactiveFilter === f.key ? `${RED}15` : 'rgba(0,5,2,0.5)',
                  color: inactiveFilter === f.key ? RED : '#6B7280',
                  border: `1px solid ${inactiveFilter === f.key ? RED : '#ffffff10'}`
                }}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-gray-500 text-center py-12">Cargando...</div>
            ) : filteredInactiveUsers.length === 0 ? (
              <div className="text-center py-12 rounded-2xl"
                style={{ background: 'rgba(0,10,5,0.8)', border: `1px solid ${RED}15` }}>
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-500">No hay usuarios inactivos en esta categoría</p>
              </div>
            ) : filteredInactiveUsers.map(u => {
              const days = daysLeft(u.subscription?.expiresAt)
              return (
                <div key={u.id} className="rounded-2xl p-4"
                  style={{ background: 'rgba(5,2,2,0.9)', border: `1px solid ${RED}15`, opacity: 0.85 }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-300 font-semibold">{u.fullName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${RED}20`, color: RED }}>Inactivo</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: u.planType === 'Premium' ? `${NEON}15` : `${GOLD}10`,
                            color: u.planType === 'Premium' ? NEON : GOLD
                          }}>
                          {u.planType}
                        </span>
                        {!u.createdByAdmin && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${NEON2}10`, color: NEON2 }}>
                            🌐 Web
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600 text-xs mt-1">
                        {u.email} · DNI {u.dni} · {u.rank} · {u.unit}
                      </div>
                      {u.subscription ? (
                        <div className="text-xs mt-1.5 font-medium text-gray-500">
                          Plan hasta: {new Date(u.subscription.expiresAt).toLocaleDateString('es-PE')}
                          {days !== null && (
                            <span style={{ color: RED }}> · {days < 0 ? `Vencido hace ${Math.abs(days)} días` : `${days} días restantes`}</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs mt-1.5 text-gray-600">Sin suscripción registrada</div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <button onClick={() => handleExtend(u.id, 30)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${NEON2}10`, color: NEON2, border: `1px solid ${NEON2}20` }}>
                        +30d
                      </button>
                      <button onClick={() => handleExtend(u.id, 60)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${GOLD}10`, color: GOLD, border: `1px solid ${GOLD}20` }}>
                        +60d
                      </button>
                      <button onClick={() => handleExtend(u.id, 180)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${NEON}10`, color: NEON, border: `1px solid ${NEON}20` }}>
                        +180d
                      </button>
                      <button onClick={() => handleReactivate(u.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${NEON}, #009A5E)`, color: '#000' }}>
                        ✅ Reactivar
                      </button>
                      <button onClick={() => handleDeletePermanent(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'rgba(255,82,82,0.15)', color: '#FF5252', border: '1px solid #FF525230' }}>
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: CREAR USUARIO */}
      {tab === 'create' && (
        <div className="rounded-2xl p-6 fade-in"
          style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${NEON}20` }}>
          <h2 className="text-white font-bold text-lg mb-5">Crear usuario con acceso directo</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Nombre completo *', key: 'fullName', placeholder: 'Juan Pérez Torres' },
                { label: 'DNI * (8 dígitos)', key: 'dni', placeholder: '12345678' },
                { label: 'Email (Gmail) *', key: 'email', placeholder: 'juan@gmail.com', type: 'email' },
                { label: 'Contraseña temporal *', key: 'password', placeholder: 'Mínimo 8 caracteres', type: 'password' },
                { label: 'Grado *', key: 'rank', placeholder: 'Suboficial de 3ra' },
                { label: 'Unidad *', key: 'unit', placeholder: 'Comisaría Lima Norte' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-500 mb-1.5">{field.label}</label>
                  <input className="input-admin" type={field.type || 'text'} placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })} required />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Plan de acceso *</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { days: 30, label: 'Mensual', price: 'S/. 12.90', sub: '30 días' },
                  { days: 60, label: 'Bimestral', price: 'S/. 22.90', sub: '60 días' },
                  { days: 180, label: 'Full Proceso', price: 'S/. 42.90', sub: '180 días' },
                ].map(plan => (
                  <button key={plan.days} type="button"
                    onClick={() => setForm({ ...form, planDays: plan.days })}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{ border: `2px solid ${form.planDays === plan.days ? NEON : '#ffffff10'}`, backgroundColor: form.planDays === plan.days ? 'rgba(0,200,122,0.08)' : 'rgba(0,10,5,0.5)' }}>
                    <div className="font-bold text-white text-sm">{plan.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: form.planDays === plan.days ? NEON : '#6B7280' }}>
                      {plan.price} · {plan.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>
{/* IMPORTAR DESDE EXCEL */}
<div className="rounded-2xl p-5 mb-5"
  style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${PURPLE}25` }}>
  <h3 className="text-white font-bold text-sm mb-1">📊 Carga masiva desde Excel</h3>
  <p className="text-gray-500 text-xs mb-3">
    Sube un Excel con columnas: Nombre, DNI, Email, Contraseña, Grado, Unidad, Días (30/60/180)
  </p>
  <div className="flex gap-3 flex-wrap">
    <button onClick={handleDownloadExcelTemplate}
      className="px-4 py-2 rounded-xl text-sm font-medium"
      style={{ backgroundColor: `${NEON2}15`, color: NEON2, border: `1px solid ${NEON2}25` }}>
      ⬇️ Descargar plantilla Excel
    </button>
    <button onClick={() => excelInputRef.current?.click()} disabled={uploadingExcel}
      className="px-4 py-2 rounded-xl text-sm font-bold"
      style={{ background: `linear-gradient(135deg, ${PURPLE}, #7C3AED)`, color: '#fff', opacity: uploadingExcel ? 0.7 : 1 }}>
      {uploadingExcel ? 'Importando...' : '📁 Subir Excel'}
    </button>
    <input ref={excelInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
  </div>
</div>



            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${NEON}, #009A5E)`, color: '#000', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creando...' : '➕ Crear usuario con acceso inmediato'}
            </button>
          </form>
        </div>
      )}

      {/* TAB: SUSCRIPCIONES */}
      {tab === 'subscriptions' && (
        <div className="fade-in space-y-3">
          {loading ? (
            <div className="text-gray-500 text-center py-12">Cargando...</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl"
              style={{ background: 'rgba(0,10,5,0.8)', border: `1px solid ${NEON}15` }}>
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-500">No hay suscripciones pendientes</p>
            </div>
          ) : subscriptions.map(sub => {
            const days = inferDays(sub.amountPaid)
            return (
              <div key={sub.id} className="rounded-2xl p-4"
                style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${GOLD}20` }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: GOLD }}>S/. {sub.amountPaid}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>{sub.paymentMethod}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${NEON}10`, color: NEON }}>
                        → {days} días
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs">Ref: <span className="text-white">{sub.paymentReference || 'Sin referencia'}</span></div>
                    <div className="text-gray-600 text-xs mt-0.5">{new Date(sub.createdAt).toLocaleString('es-PE')}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(sub)}
                      className="px-4 py-2 rounded-lg text-sm font-bold"
                      style={{ backgroundColor: NEON, color: '#000' }}>
                      ✅ Aprobar {days}d
                    </button>
                    <button onClick={() => handleReject(sub.id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: `${RED}15`, color: RED, border: `1px solid ${RED}30` }}>
                      ❌ Rechazar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB: BANCO DE PREGUNTAS */}
      {tab === 'questions' && (
        <div className="fade-in space-y-4">
          {editingQuestion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
              <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
                style={{ background: '#0A0F0D', border: `1px solid ${NEON}30` }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">✏️ Editar pregunta</h3>
                  <button onClick={() => setEditingQuestion(null)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Texto de la pregunta</label>
                    <textarea className="input-admin" rows={3}
                      value={editingQuestion.questionText}
                      onChange={e => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Categoría</label>
                      <select className="input-admin" value={editingQuestion.category}
                        onChange={e => setEditingQuestion({ ...editingQuestion, category: e.target.value })}>
                        <option>DOCTRINA</option>
                        <option>PROCEDIMIENTOS</option>
                        <option>LEGISLACION</option>
                        <option>CULTURA GENERAL</option>
                        <option>DEONTOLOGIA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Año</label>
                      <input className="input-admin" type="number" value={editingQuestion.yearValuation}
                        onChange={e => setEditingQuestion({ ...editingQuestion, yearValuation: Number(e.target.value) })} />
                    </div>
                  </div>
                  {editingQuestion.answerOptions && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Opciones <span style={{ color: NEON }}>(toca la letra para marcar correcta)</span></label>
                      {editingQuestion.answerOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                          <button type="button"
                            onClick={() => setEditingQuestion({
                              ...editingQuestion,
                              answerOptions: editingQuestion.answerOptions!.map((o, j) => ({ ...o, isCorrect: j === i }))
                            })}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: opt.isCorrect ? NEON : '#ffffff10', color: opt.isCorrect ? '#000' : '#6B7280' }}>
                            {['A', 'B', 'C', 'D'][i]}
                          </button>
                          <input className="input-admin flex-1" value={opt.optionText}
                            onChange={e => setEditingQuestion({
                              ...editingQuestion,
                              answerOptions: editingQuestion.answerOptions!.map((o, j) =>
                                j === i ? { ...o, optionText: e.target.value } : o)
                            })} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setEditingQuestion(null)}
                      className="flex-1 py-2.5 rounded-xl text-sm"
                      style={{ backgroundColor: 'rgba(0,5,2,0.5)', color: '#6B7280', border: '1px solid #ffffff10' }}>
                      Cancelar
                    </button>
                    <button onClick={handleSaveEdit} disabled={saving}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                      style={{ background: `linear-gradient(135deg, ${NEON}, #009A5E)`, color: '#000' }}>
                      {saving ? 'Guardando...' : '💾 Guardar cambios'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl p-5" style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${PURPLE}25` }}>
            <h2 className="text-white font-bold text-base mb-1">📤 Carga masiva CSV</h2>
            <p className="text-gray-500 text-xs mb-4">Sube el balotario completo en un archivo CSV.</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleDownloadTemplate}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: `${NEON2}15`, color: NEON2, border: `1px solid ${NEON2}25` }}>
                ⬇️ Descargar plantilla
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="px-4 py-2 rounded-xl text-sm font-bold"
                style={{ background: `linear-gradient(135deg, ${PURPLE}, #7C3AED)`, color: '#fff', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? 'Subiendo...' : '📁 Subir CSV'}
              </button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${NEON}20` }}>
            <h2 className="text-white font-bold text-base mb-4">✏️ Agregar pregunta manual</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Examen *</label>
                <select className="input-admin" value={qForm.examId}
                  onChange={e => setQForm({ ...qForm, examId: e.target.value })} required>
                  <option value="">Selecciona un examen</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Pregunta *</label>
                <textarea className="input-admin" rows={3} placeholder="Escribe la pregunta..."
                  value={qForm.questionText} onChange={e => setQForm({ ...qForm, questionText: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Categoría</label>
                  <select className="input-admin" value={qForm.category} onChange={e => setQForm({ ...qForm, category: e.target.value })}>
                    <option>DOCTRINA</option><option>PROCEDIMIENTOS</option>
                    <option>LEGISLACION</option><option>CULTURA GENERAL</option><option>DEONTOLOGIA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Dificultad</label>
                  <select className="input-admin" value={qForm.difficulty} onChange={e => setQForm({ ...qForm, difficulty: Number(e.target.value) })}>
                    <option value={1}>Básico</option><option value={2}>Intermedio</option><option value={3}>Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Año</label>
                  <input className="input-admin" type="number" value={qForm.yearValuation}
                    onChange={e => setQForm({ ...qForm, yearValuation: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Orden</label>
                  <input className="input-admin" type="number" value={qForm.orderIndex}
                    onChange={e => setQForm({ ...qForm, orderIndex: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Opciones <span style={{ color: NEON }}>(toca la letra para marcar correcta)</span></label>
                {qForm.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <button type="button"
                      onClick={() => setQForm({ ...qForm, options: qForm.options.map((o, j) => ({ ...o, isCorrect: j === i })) })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: opt.isCorrect ? NEON : '#ffffff10', color: opt.isCorrect ? '#000' : '#6B7280' }}>
                      {['A', 'B', 'C', 'D'][i]}
                    </button>
                    <input className="input-admin flex-1" placeholder={`Opción ${['A', 'B', 'C', 'D'][i]}`}
                      value={opt.optionText}
                      onChange={e => setQForm({ ...qForm, options: qForm.options.map((o, j) => j === i ? { ...o, optionText: e.target.value } : o) })} required />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Explicación (opcional)</label>
                <textarea className="input-admin" rows={2} placeholder="¿Por qué es correcta esa respuesta?"
                  value={qForm.explanation} onChange={e => setQForm({ ...qForm, explanation: e.target.value })} />
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: `linear-gradient(135deg, ${NEON}, #009A5E)`, color: '#000', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : '✅ Guardar pregunta'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl p-5" style={{ background: 'rgba(0,8,4,0.9)', border: '1px solid #ffffff08' }}>
          <div className="flex items-center justify-between mb-4">
  <h2 className="text-white font-bold text-base">📋 Preguntas en banco ({questions.length})</h2>
  {questions.length > 0 && (
    <button onClick={handleDeleteAllQuestions}
      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
      style={{ backgroundColor: `${RED}15`, color: RED, border: `1px solid ${RED}30` }}>
      🗑️ Eliminar todas
    </button>
  )}
</div>
            {loading ? (
              <div className="text-gray-500 text-center py-8">Cargando...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No hay preguntas aún</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-xl p-3 flex items-start justify-between gap-3"
                    style={{ background: 'rgba(0,5,2,0.7)', border: '1px solid #ffffff08' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${NEON}15`, color: NEON }}>{q.category}</span>
                        <span className="text-xs text-gray-600">#{i + 1}</span>
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">{q.questionText}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleEditQuestion(q)}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{ backgroundColor: `${NEON2}15`, color: NEON2 }}>✏️</button>
                      <button onClick={() => handleDeleteQuestion(q.id)}
                        className="px-2 py-1 rounded-lg text-xs"
                        style={{ backgroundColor: `${RED}15`, color: RED }}>🗑️</button>
                    </div>
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

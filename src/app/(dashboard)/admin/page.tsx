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
}

const NEON = '#00C87A'
const NEON2 = '#4FC3F7'
const GOLD = '#FFD700'
const RED = '#FF5252'
const PURPLE = '#A855F7'

export default function AdminPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'users' | 'subscriptions' | 'create' | 'questions'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ imported: number; errors: string[] } | null>(null)

  // Form nueva pregunta manual
  const [qForm, setQForm] = useState({
    examId: '',
    questionText: '',
    category: 'DOCTRINA',
    difficulty: 1,
    yearValuation: 2025,
    orderIndex: 1,
    explanation: '',
    options: [
      { optionText: '', isCorrect: true, optionIndex: 0 },
      { optionText: '', isCorrect: false, optionIndex: 1 },
      { optionText: '', isCorrect: false, optionIndex: 2 },
      { optionText: '', isCorrect: false, optionIndex: 3 },
    ]
  })

  const [exams, setExams] = useState<{ id: string; title: string }[]>([])

  const [form, setForm] = useState({
    fullName: '', dni: '', email: '', password: '',
    rank: '', unit: '', planDays: 180
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
      if (tab === 'users') {
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

  const handleApprove = async (id: string) => {
    try {
      await apiClient.put(`/subscriptions/${id}/approve`, { durationDays: 180 })
      setSubscriptions(prev => prev.filter(s => s.id !== id))
      setMsg({ text: '✅ Suscripción aprobada', ok: true })
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
    setUploadResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/admin/import/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setUploadResult({ imported: res.data.imported || res.data.count || 0, errors: res.data.errors || [] })
      setMsg({ text: `✅ ${res.data.imported || res.data.count || 0} preguntas importadas`, ok: true })
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
      a.href = url
      a.download = 'plantilla_preguntas.csv'
      a.click()
    } catch { setMsg({ text: 'Error al descargar plantilla', ok: false }) }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await apiClient.post('/admin/Questions', {
        examId: qForm.examId,
        questionText: qForm.questionText,
        category: qForm.category,
        difficulty: qForm.difficulty,
        yearValuation: qForm.yearValuation,
        orderIndex: qForm.orderIndex,
        explanation: qForm.explanation,
        answerOptions: qForm.options
      })
      setMsg({ text: '✅ Pregunta creada exitosamente', ok: true })
      setQForm({
        examId: qForm.examId, questionText: '', category: 'DOCTRINA',
        difficulty: 1, yearValuation: 2025, orderIndex: qForm.orderIndex + 1,
        explanation: '',
        options: [
          { optionText: '', isCorrect: true, optionIndex: 0 },
          { optionText: '', isCorrect: false, optionIndex: 1 },
          { optionText: '', isCorrect: false, optionIndex: 2 },
          { optionText: '', isCorrect: false, optionIndex: 3 },
        ]
      })
      loadData()
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al crear pregunta', ok: false })
    } finally { setSaving(false) }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    try {
      await apiClient.delete(`/admin/Questions/${id}`)
      setQuestions(prev => prev.filter(q => q.id !== id))
      setMsg({ text: '✅ Pregunta eliminada', ok: true })
    } catch { }
  }

  const daysLeft = (expiresAt?: string | null) => {
    if (!expiresAt) return null
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  }

  const tabs = [
    { key: 'users', label: '👥 Usuarios', count: users.length },
    { key: 'subscriptions', label: '💳 Pendientes', count: subscriptions.length },
    { key: 'create', label: '➕ Crear usuario', count: null },
    { key: 'questions', label: '📝 Banco de preguntas', count: questions.length },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .input-admin {
          width:100%; padding:10px 14px; border-radius:10px;
          background:rgba(0,5,2,0.8); border:1px solid #ffffff15;
          color:#fff; font-size:13px; outline:none;
        }
        .input-admin:focus { border-color: ${NEON}50; }
        .input-admin::placeholder { color:#4B5563; }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Panel Admin 🛡️</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de Cocodrilito</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold" style={{ color: NEON }}>{users.length} usuarios</div>
          <div className="text-xs text-gray-500">{questions.length} preguntas · {subscriptions.length} pendientes</div>
        </div>
      </div>

      {/* MENSAJE */}
      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium fade-in"
          style={{
            backgroundColor: msg.ok ? 'rgba(0,200,122,0.1)' : 'rgba(255,82,82,0.1)',
            border: `1px solid ${msg.ok ? NEON : RED}40`,
            color: msg.ok ? NEON : RED
          }}>
          {msg.text}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            style={{
              backgroundColor: tab === t.key ? NEON : 'rgba(0,10,5,0.8)',
              color: tab === t.key ? '#000' : '#9CA3AF',
              border: `1px solid ${tab === t.key ? NEON : '#ffffff10'}`,
              boxShadow: tab === t.key ? `0 0 20px ${NEON}40` : 'none'
            }}>
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: tab === t.key ? '#000' : RED, color: '#fff' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: BANCO DE PREGUNTAS */}
      {tab === 'questions' && (
        <div className="fade-in space-y-4">

          {/* CARGA MASIVA CSV */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${PURPLE}25` }}>
            <h2 className="text-white font-bold text-base mb-1">📤 Carga masiva desde CSV</h2>
            <p className="text-gray-500 text-xs mb-4">
              Sube un archivo CSV con múltiples preguntas a la vez. Ideal para cargar el balotario completo.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleDownloadTemplate}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: `${NEON2}15`, color: NEON2, border: `1px solid ${NEON2}25` }}>
                ⬇️ Descargar plantilla CSV
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${PURPLE}, #7C3AED)`,
                  color: '#fff', opacity: uploading ? 0.7 : 1
                }}>
                {uploading ? 'Subiendo...' : '📁 Subir archivo CSV'}
              </button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={handleCSVUpload} />
            </div>

            {uploadResult && (
              <div className="mt-4 rounded-xl p-3"
                style={{ backgroundColor: 'rgba(0,200,122,0.08)', border: `1px solid ${NEON}20` }}>
                <div className="text-sm font-bold" style={{ color: NEON }}>
                  ✅ {uploadResult.imported} preguntas importadas
                </div>
                {uploadResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadResult.errors.slice(0, 5).map((err, i) => (
                      <div key={i} className="text-xs" style={{ color: RED }}>• {err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AGREGAR PREGUNTA MANUAL */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${NEON}20` }}>
            <h2 className="text-white font-bold text-base mb-4">✏️ Agregar pregunta manualmente</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">

              {/* EXAMEN */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Examen *</label>
                <select className="input-admin"
                  value={qForm.examId}
                  onChange={e => setQForm({ ...qForm, examId: e.target.value })} required>
                  <option value="">Selecciona un examen</option>
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>

              {/* PREGUNTA */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Texto de la pregunta *</label>
                <textarea className="input-admin" rows={3}
                  placeholder="Escribe la pregunta aquí..."
                  value={qForm.questionText}
                  onChange={e => setQForm({ ...qForm, questionText: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Categoría</label>
                  <select className="input-admin"
                    value={qForm.category}
                    onChange={e => setQForm({ ...qForm, category: e.target.value })}>
                    <option>DOCTRINA</option>
                    <option>PROCEDIMIENTOS</option>
                    <option>LEGISLACION</option>
                    <option>CULTURA GENERAL</option>
                    <option>DEONTOLOGIA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Dificultad</label>
                  <select className="input-admin"
                    value={qForm.difficulty}
                    onChange={e => setQForm({ ...qForm, difficulty: Number(e.target.value) })}>
                    <option value={1}>Básico</option>
                    <option value={2}>Intermedio</option>
                    <option value={3}>Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Año</label>
                  <input className="input-admin" type="number"
                    value={qForm.yearValuation}
                    onChange={e => setQForm({ ...qForm, yearValuation: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Orden</label>
                  <input className="input-admin" type="number"
                    value={qForm.orderIndex}
                    onChange={e => setQForm({ ...qForm, orderIndex: Number(e.target.value) })} />
                </div>
              </div>

              {/* OPCIONES */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">
                  Opciones de respuesta * <span style={{ color: NEON }}>(marca la correcta)</span>
                </label>
                <div className="space-y-2">
                  {qForm.options.map((opt, i) => {
                    const letters = ['A', 'B', 'C', 'D']
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <button type="button"
                          onClick={() => setQForm({
                            ...qForm,
                            options: qForm.options.map((o, j) => ({ ...o, isCorrect: j === i }))
                          })}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                          style={{
                            backgroundColor: opt.isCorrect ? NEON : '#ffffff10',
                            color: opt.isCorrect ? '#000' : '#6B7280',
                            border: `1px solid ${opt.isCorrect ? NEON : '#ffffff15'}`
                          }}>
                          {letters[i]}
                        </button>
                        <input className="input-admin flex-1"
                          placeholder={`Opción ${letters[i]}${opt.isCorrect ? ' (correcta)' : ''}`}
                          value={opt.optionText}
                          onChange={e => setQForm({
                            ...qForm,
                            options: qForm.options.map((o, j) =>
                              j === i ? { ...o, optionText: e.target.value } : o)
                          })} required />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* EXPLICACIÓN */}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Explicación (opcional)</label>
                <textarea className="input-admin" rows={2}
                  placeholder="Explica por qué la respuesta correcta es correcta..."
                  value={qForm.explanation}
                  onChange={e => setQForm({ ...qForm, explanation: e.target.value })} />
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${NEON}, #009A5E)`,
                  color: '#000', opacity: saving ? 0.7 : 1,
                  boxShadow: `0 0 20px ${NEON}40`
                }}>
                {saving ? 'Guardando...' : '✅ Guardar pregunta'}
              </button>
            </form>
          </div>

          {/* LISTA DE PREGUNTAS */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid #ffffff08` }}>
            <h2 className="text-white font-bold text-base mb-4">
              📋 Preguntas en banco ({questions.length})
            </h2>
            {loading ? (
              <div className="text-gray-500 text-center py-8">Cargando preguntas...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-gray-500 text-sm">No hay preguntas en el banco</p>
                <p className="text-gray-600 text-xs mt-1">
                  Sube un CSV o agrega preguntas manualmente
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-xl p-3 flex items-start justify-between gap-3"
                    style={{ background: 'rgba(0,5,2,0.7)', border: '1px solid #ffffff08' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${NEON}15`, color: NEON }}>
                          {q.category}
                        </span>
                        <span className="text-xs text-gray-600">#{i + 1}</span>
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                        {q.questionText}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)}
                      className="shrink-0 px-2 py-1 rounded-lg text-xs transition-all hover:opacity-80"
                      style={{ backgroundColor: `${RED}15`, color: RED }}>
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Nombre completo *</label>
                <input className="input-field" placeholder="Juan Pérez Torres"
                  value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">DNI *</label>
                <input className="input-field" placeholder="12345678" maxLength={8}
                  value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Email (Gmail) *</label>
                <input className="input-field" type="email" placeholder="juan@gmail.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Contraseña temporal *</label>
                <input className="input-field" type="password" placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Grado *</label>
                <input className="input-field" placeholder="Suboficial de 3ra"
                  value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Unidad *</label>
                <input className="input-field" placeholder="Comisaría Lima Norte"
                  value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required />
              </div>
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
                    style={{
                      border: `2px solid ${form.planDays === plan.days ? NEON : '#ffffff10'}`,
                      backgroundColor: form.planDays === plan.days ? 'rgba(0,200,122,0.08)' : 'rgba(0,10,5,0.5)',
                    }}>
                    <div className="font-bold text-white text-sm">{plan.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: form.planDays === plan.days ? NEON : '#6B7280' }}>
                      {plan.price} · {plan.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${NEON}, #009A5E)`,
                color: '#000', opacity: saving ? 0.7 : 1,
                boxShadow: `0 0 20px ${NEON}40`
              }}>
              {saving ? 'Creando usuario...' : '➕ Crear usuario con acceso inmediato'}
            </button>
          </form>
        </div>
      )}

      {/* TAB: USUARIOS */}
      {tab === 'users' && (
        <div className="fade-in space-y-3">
          {loading ? (
            <div className="text-gray-500 text-center py-12">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 rounded-2xl"
              style={{ background: 'rgba(0,10,5,0.8)', border: `1px solid ${NEON}15` }}>
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-500">No hay usuarios registrados</p>
              <button onClick={() => setTab('create')}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
                style={{ backgroundColor: NEON, color: '#000' }}>
                Crear primer usuario
              </button>
            </div>
          ) : users.map(u => {
            const days = daysLeft(u.subscription?.expiresAt)
            const expired = days !== null && days <= 0
            const warning = days !== null && days > 0 && days <= 7
            return (
              <div key={u.id} className="rounded-2xl p-4"
                style={{
                  background: 'rgba(0,8,4,0.9)',
                  border: `1px solid ${expired ? RED : warning ? GOLD : NEON}15`,
                  opacity: u.isActive ? 1 : 0.5
                }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">{u.fullName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: u.planType === 'Premium' ? `${NEON}20` : 'rgba(100,100,100,0.2)',
                          color: u.planType === 'Premium' ? NEON : '#6B7280'
                        }}>
                        {u.planType}
                      </span>
                      {!u.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${RED}20`, color: RED }}>
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {u.email} · DNI {u.dni} · {u.rank} · {u.unit}
                    </div>
                    {u.subscription && (
                      <div className="text-xs mt-1.5 font-medium"
                        style={{ color: expired ? RED : warning ? GOLD : NEON }}>
                        {expired ? '⚠️ Suscripción vencida'
                          : warning ? `⚡ Vence en ${days} días`
                          : `✓ Activo hasta ${new Date(u.subscription.expiresAt).toLocaleDateString('es-PE')}`}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleExtend(u.id, 30)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{ backgroundColor: `${NEON2}15`, color: NEON2, border: `1px solid ${NEON2}25` }}>
                      +30d
                    </button>
                    <button onClick={() => handleExtend(u.id, 60)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}25` }}>
                      +60d
                    </button>
                    <button onClick={() => handleExtend(u.id, 180)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{ backgroundColor: `${NEON}15`, color: NEON, border: `1px solid ${NEON}25` }}>
                      +180d
                    </button>
                    {u.isActive && (
                      <button onClick={() => handleDeactivate(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                        style={{ backgroundColor: `${RED}15`, color: RED, border: `1px solid ${RED}25` }}>
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB: SUSCRIPCIONES PENDIENTES */}
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
          ) : subscriptions.map(sub => (
            <div key={sub.id} className="rounded-2xl p-4"
              style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${GOLD}20` }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold" style={{ color: GOLD }}>
                      S/. {sub.amountPaid}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
                      {sub.paymentMethod}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    Ref: <span className="text-white">{sub.paymentReference || 'Sin referencia'}</span>
                  </div>
                  <div className="text-gray-600 text-xs mt-0.5">
                    {new Date(sub.createdAt).toLocaleString('es-PE')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(sub.id)}
                    className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
                    style={{ backgroundColor: NEON, color: '#000' }}>
                    ✅ Aprobar
                  </button>
                  <button onClick={() => handleReject(sub.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ backgroundColor: `${RED}15`, color: RED, border: `1px solid ${RED}30` }}>
                    ❌ Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
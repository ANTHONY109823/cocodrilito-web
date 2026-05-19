'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api/client'

interface Question {
  id: string
  questionText: string
  category: string
  difficulty: number
  status: string
  yearValuation: number
  answerOptions?: {
    id: string
    optionText: string
    isCorrect: boolean
    optionIndex: number
  }[]
}

const NEON = '#00C87A'
const NEON2 = '#4FC3F7'
const RED = '#FF5252'
const PURPLE = '#A855F7'

const CATEGORIES = [
  { key: 'DERECHOS HUMANOS',      label: 'Derechos Humanos',      color: '#4FC3F7' },
  { key: 'LEGISLACION POLICIAL',  label: 'Legislación Policial',  color: '#A855F7' },
  { key: 'LEY PNP',               label: 'Ley PNP',               color: '#FFD700' },
  { key: 'LUCHA CORRUPCION',      label: 'Lucha Corrupción',      color: '#FF7043' },
  { key: 'REGIMEN DISCIPLINARIO', label: 'Régimen Disciplinario', color: '#00E5A0' },
  { key: 'FORMACION PROFESIONAL', label: 'Formación Profesional', color: '#F06292' },
  { key: 'TRANSPARENCIA',         label: 'Transparencia',         color: '#FFB300' },
]

const PAGE_SIZE = 50

export default function PreguntasPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [exams, setExams] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCat, setUploadingCat] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].key)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [qForm, setQForm] = useState({
    examId: '',
    questionText: '',
    category: CATEGORIES[0].key,
    yearValuation: 2025,
    orderIndex: 1,
    explanation: '',
    options: [
      { optionText: '', isCorrect: true,  optionIndex: 0 },
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
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const [qRes, eRes] = await Promise.all([
        apiClient.get('/admin/Questions'),
        apiClient.get('/exams/list'),
      ])
      setQuestions(Array.isArray(qRes.data) ? qRes.data : qRes.data?.items || [])
      setExams(Array.isArray(eRes.data) ? eRes.data : [])
    } catch { } finally { setLoading(false) }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCat(category)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/admin/import/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setMsg({ text: `✅ ${res.data.imported || 0} preguntas importadas en ${category}`, ok: true })
      setTimeout(() => setMsg(null), 4000)
      loadData()
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al subir archivo', ok: false })
    } finally {
      setUploadingCat(null)
      if (fileRefs.current[category]) fileRefs.current[category]!.value = ''
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
        examId: qForm.examId,
        questionText: qForm.questionText,
        category: qForm.category,
        difficulty: 1,
        yearValuation: qForm.yearValuation,
        orderIndex: qForm.orderIndex,
        explanation: qForm.explanation,
        answerOptions: qForm.options
      })
      setMsg({ text: '✅ Pregunta creada', ok: true })
      setQForm({ ...qForm, questionText: '', explanation: '', orderIndex: qForm.orderIndex + 1 })
      setShowAddForm(false)
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
        difficulty: 1,
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
      setMsg({ text: '🗑️ Pregunta eliminada', ok: false })
      setTimeout(() => setMsg(null), 2000)
    } catch { }
  }

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ ¿Eliminar TODAS las preguntas del banco?')) return
    if (!confirm('¿Estás SEGURO? Esta acción no se puede deshacer.')) return
    try {
      const res = await apiClient.delete('/admin/Questions/bulk')
      setMsg({ text: `🗑️ ${res.data.deleted} preguntas eliminadas`, ok: false })
      setTimeout(() => { setMsg(null); loadData() }, 2000)
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error', ok: false })
    }
  }

  const filtered = questions.filter(q => {
    const matchCat = q.category === selectedCategory
    const matchSearch = search === '' ||
      q.questionText.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = questions.filter(q => q.category === cat.key).length
    return acc
  }, {} as Record<string, number>)

  const letters = ['A', 'B', 'C', 'D']
  const currentCat = CATEGORIES.find(c => c.key === selectedCategory)!

  return (
    <div className="max-w-5xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        .input-q { width:100%; padding:9px 13px; border-radius:10px; background:rgba(0,5,2,0.8); border:1px solid #ffffff15; color:#fff; font-size:13px; outline:none; }
        .input-q:focus { border-color: ${NEON}50; }
        .input-q::placeholder { color:#4B5563; }
      `}</style>

      {/* MODAL EDITAR */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto fade-in"
            style={{ background: '#0A0F0D', border: `1px solid ${NEON}30` }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">✏️ Editar pregunta</h3>
              <button onClick={() => setEditingQuestion(null)}
                className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Texto de la pregunta</label>
                <textarea className="input-q" rows={4}
                  value={editingQuestion.questionText}
                  onChange={e => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Categoría</label>
                  <select className="input-q" value={editingQuestion.category}
                    onChange={e => setEditingQuestion({ ...editingQuestion, category: e.target.value })}>
                    {CATEGORIES.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Año</label>
                  <input className="input-q" type="number" value={editingQuestion.yearValuation}
                    onChange={e => setEditingQuestion({ ...editingQuestion, yearValuation: Number(e.target.value) })} />
                </div>
              </div>
              {editingQuestion.answerOptions && (
                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    Opciones <span style={{ color: NEON }}>— toca la letra para marcar correcta</span>
                  </label>
                  {editingQuestion.answerOptions
                    .sort((a, b) => a.optionIndex - b.optionIndex)
                    .map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <button type="button"
                          onClick={() => setEditingQuestion({
                            ...editingQuestion,
                            answerOptions: editingQuestion.answerOptions!.map((o, j) => ({ ...o, isCorrect: j === i }))
                          })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: opt.isCorrect ? NEON : '#ffffff10',
                            color: opt.isCorrect ? '#000' : '#6B7280',
                            border: `1px solid ${opt.isCorrect ? NEON : '#ffffff15'}`
                          }}>
                          {letters[i]}
                        </button>
                        <input className="input-q flex-1" value={opt.optionText}
                          onChange={e => setEditingQuestion({
                            ...editingQuestion,
                            answerOptions: editingQuestion.answerOptions!.map((o, j) =>
                              j === i ? { ...o, optionText: e.target.value } : o)
                          })} />
                      </div>
                    ))}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingQuestion(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ backgroundColor: 'rgba(0,5,2,0.5)', color: '#6B7280', border: '1px solid #ffffff10' }}>
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: `linear-gradient(135deg, ${NEON}, #009A5E)`, color: '#000', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link href="/admin" className="text-gray-500 hover:text-white text-sm transition-colors">
          ← Panel Admin
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Banco de preguntas 📝</h1>
          <p className="text-gray-500 text-sm mt-0.5">{questions.length} preguntas en total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadTemplate}
            className="px-3 py-2 rounded-xl text-xs font-medium"
            style={{ backgroundColor: `${NEON2}15`, color: NEON2, border: `1px solid ${NEON2}25` }}>
            ⬇️ Plantilla CSV
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: showAddForm ? 'rgba(0,5,2,0.5)' : `linear-gradient(135deg, ${NEON}, #009A5E)`,
              color: showAddForm ? '#6B7280' : '#000',
              border: showAddForm ? '1px solid #ffffff10' : 'none'
            }}>
            {showAddForm ? '✕ Cancelar' : '➕ Nueva pregunta'}
          </button>
          {questions.length > 0 && (
            <button onClick={handleDeleteAll}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'rgba(255,82,82,0.15)', color: '#FF5252', border: '1px solid #FF525230' }}>
              🗑️ Eliminar todo
            </button>
          )}
        </div>
      </div>

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

      {/* FORMULARIO AGREGAR */}
      {showAddForm && (
        <div className="rounded-2xl p-5 mb-4 fade-in"
          style={{ background: 'rgba(0,8,4,0.95)', border: `1px solid ${NEON}25` }}>
          <h2 className="text-white font-bold text-base mb-4">✏️ Nueva pregunta manual</h2>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Examen *</label>
              <select className="input-q" value={qForm.examId}
                onChange={e => setQForm({ ...qForm, examId: e.target.value })} required>
                <option value="">Selecciona un examen</option>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Pregunta *</label>
              <textarea className="input-q" rows={3} placeholder="Escribe la pregunta aquí..."
                value={qForm.questionText}
                onChange={e => setQForm({ ...qForm, questionText: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Categoría</label>
                <select className="input-q" value={qForm.category}
                  onChange={e => setQForm({ ...qForm, category: e.target.value })}>
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Año</label>
                <input className="input-q" type="number" value={qForm.yearValuation}
                  onChange={e => setQForm({ ...qForm, yearValuation: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                Opciones <span style={{ color: NEON }}>— toca la letra para marcar correcta</span>
              </label>
              {qForm.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <button type="button"
                    onClick={() => setQForm({ ...qForm, options: qForm.options.map((o, j) => ({ ...o, isCorrect: j === i })) })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: opt.isCorrect ? NEON : '#ffffff10',
                      color: opt.isCorrect ? '#000' : '#6B7280',
                      border: `1px solid ${opt.isCorrect ? NEON : '#ffffff15'}`
                    }}>
                    {letters[i]}
                  </button>
                  <input className="input-q flex-1" placeholder={`Opción ${letters[i]}`}
                    value={opt.optionText}
                    onChange={e => setQForm({ ...qForm, options: qForm.options.map((o, j) => j === i ? { ...o, optionText: e.target.value } : o) })}
                    required />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Explicación (opcional)</label>
              <textarea className="input-q" rows={2} placeholder="¿Por qué es correcta esa respuesta?"
                value={qForm.explanation}
                onChange={e => setQForm({ ...qForm, explanation: e.target.value })} />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${NEON}, #009A5E)`, color: '#000', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : '✅ Guardar pregunta'}
            </button>
          </form>
        </div>
      )}

      {/* TABS POR CATEGORÍA CON BOTÓN CSV PROPIO */}
      <div className="grid grid-cols-1 gap-2 mb-4">
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.key
          const count = counts[cat.key] || 0
          const isUploading = uploadingCat === cat.key
          return (
            <div key={cat.key}
              className="rounded-xl flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-all"
              style={{
                background: isSelected ? `${cat.color}12` : 'rgba(0,5,2,0.6)',
                border: `1px solid ${isSelected ? cat.color : '#ffffff10'}`,
                boxShadow: isSelected ? `0 0 15px ${cat.color}20` : 'none'
              }}
              onClick={() => { setSelectedCategory(cat.key); setPage(1); setSearch('') }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }} />
                <span className="font-medium text-sm"
                  style={{ color: isSelected ? cat.color : '#9CA3AF' }}>
                  {cat.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isSelected ? `${cat.color}20` : '#ffffff08',
                    color: isSelected ? cat.color : '#4B5563'
                  }}>
                  {count} preguntas
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0"
                onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => fileRefs.current[cat.key]?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${cat.color}cc, ${cat.color}88)`,
                    color: '#000',
                    opacity: isUploading ? 0.6 : 1
                  }}>
                  {isUploading ? '⏳ Subiendo...' : '📁 Subir CSV'}
                </button>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={el => { fileRefs.current[cat.key] = el }}
                  onChange={e => handleCSVUpload(e, cat.key)}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* BUSCADOR */}
      <div className="mb-4">
        <input className="input-q"
          placeholder={`🔍 Buscar en ${currentCat.label}...`}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {/* LISTA DE PREGUNTAS */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${currentCat.color}20` }}>
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: `1px solid ${currentCat.color}15` }}>
          <p className="text-xs font-medium" style={{ color: currentCat.color }}>
            {currentCat.label} · {filtered.length} pregunta{filtered.length !== 1 ? 's' : ''}
            {search && ` · "${search}"`}
          </p>
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 rounded-lg text-xs"
                style={{ backgroundColor: '#ffffff08', color: page === 1 ? '#4B5563' : '#fff' }}>←</button>
              <span className="text-xs text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-2 py-1 rounded-lg text-xs"
                style={{ backgroundColor: '#ffffff08', color: page === totalPages ? '#4B5563' : '#fff' }}>→</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-12">Cargando preguntas...</div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 text-sm mb-4">
              {search ? `Sin resultados para "${search}"` : `No hay preguntas en ${currentCat.label}`}
            </p>
            {!search && (
              <button
                onClick={() => fileRefs.current[currentCat.key]?.click()}
                className="inline-flex px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: `linear-gradient(135deg, ${currentCat.color}cc, ${currentCat.color}88)`, color: '#000' }}>
                📁 Subir CSV de {currentCat.label}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#ffffff05' }}>
            {paginated.map((q, i) => {
              const globalIdx = (page - 1) * PAGE_SIZE + i + 1
              return (
                <div key={q.id} className="px-5 py-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs text-gray-600 w-8 shrink-0 pt-0.5 text-right">{globalIdx}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-100 text-sm leading-relaxed mb-2">{q.questionText}</p>
                    {q.answerOptions && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {q.answerOptions
                          .sort((a, b) => a.optionIndex - b.optionIndex)
                          .map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-1.5">
                              <span className="text-xs font-bold shrink-0 w-5"
                                style={{ color: opt.isCorrect ? currentCat.color : '#4B5563' }}>
                                {letters[oi]}.
                              </span>
                              <span className="text-xs truncate"
                                style={{ color: opt.isCorrect ? currentCat.color : '#6B7280' }}>
                                {opt.optionText}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleEditQuestion(q)}
                      className="px-2.5 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
                      style={{ backgroundColor: `${NEON2}15`, color: NEON2 }}>✏️</button>
                    <button onClick={() => handleDeleteQuestion(q.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
                      style={{ backgroundColor: `${RED}15`, color: RED }}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PAGINACIÓN INFERIOR */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-2 px-5 py-3"
            style={{ borderTop: `1px solid ${currentCat.color}15` }}>
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: '#ffffff08', color: page === 1 ? '#4B5563' : '#fff' }}>««</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: '#ffffff08', color: page === 1 ? '#4B5563' : '#fff' }}>← Anterior</button>
            <span className="text-xs text-gray-500 px-2">
              Página {page} de {totalPages} · {filtered.length} preguntas
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: '#ffffff08', color: page === totalPages ? '#4B5563' : '#fff' }}>Siguiente →</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: '#ffffff08', color: page === totalPages ? '#4B5563' : '#fff' }}>»»</button>
          </div>
        )}
      </div>
    </div>
  )
}
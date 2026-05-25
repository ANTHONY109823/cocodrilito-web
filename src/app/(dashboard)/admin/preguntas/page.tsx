'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api/client'
import { ADMIN_QUESTIONS_PAGE_SIZE } from '@/lib/constants/questions'
import { NEON, NEON_DARK, policeGreenRgba } from '@/lib/constants/theme'

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

interface Category {
  id: string
  name: string
  color: string
  orderIndex: number
}

const NEON2 = '#4FC3F7'
const RED = '#FF5252'
const PAGE_SIZE = 50

const PRESET_COLORS = [
  '#4FC3F7', '#A78BFA', '#F59E0B', '#EF4444',
  '#10B981', '#F472B6', '#60A5FA', '#34D399',
  '#FB923C', '#818CF8'
]

export default function PreguntasPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [exams, setExams] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCat, setUploadingCat] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0])

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [qForm, setQForm] = useState({
    examId: '',
    questionText: '',
    category: '',
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
      loadAll()
    }
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [qRes, eRes, cRes] = await Promise.all([
        apiClient.get(`/admin/Questions?pageSize=${ADMIN_QUESTIONS_PAGE_SIZE}`),
        apiClient.get('/exams/list'),
        apiClient.get('/categories'),
      ])
      const qs = Array.isArray(qRes.data) ? qRes.data : qRes.data?.items || []
      const cats = Array.isArray(cRes.data) ? cRes.data : []
      setQuestions(qs)
      setExams(Array.isArray(eRes.data) ? eRes.data : [])
      setCategories(cats)
      if (cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0].name)
        setQForm(f => ({ ...f, category: cats[0].name }))
      }
    } catch { } finally { setLoading(false) }
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCat(category)
    setMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post(
        `/admin/import/questions?categoria=${encodeURIComponent(category)}`,
        formData
      )
      const imported = res.data.imported ?? 0
      const totalErrors = res.data.totalErrors ?? 0
      const firstErrors = (res.data.errors as string[] | undefined)?.slice(0, 3).join(' · ') ?? ''

      if (imported === 0) {
        setMsg({
          text: `⚠️ 0 importadas en ${category}. ${res.data.message || ''}${firstErrors ? ` ${firstErrors}` : ''}`,
          ok: false
        })
      } else {
        setMsg({
          text: `✅ ${imported} preguntas importadas en ${category}${totalErrors > 0 ? ` (${totalErrors} filas con error)` : ''}`,
          ok: true
        })
      }
      setTimeout(() => setMsg(null), totalErrors > 0 || imported === 0 ? 12000 : 4000)
      loadAll()
    } catch (err: any) {
      const status = err.response?.status
      const detail =
        err.response?.data?.errors?.[0]
        || err.response?.data?.message
        || (status === 415 ? 'Error 415: el archivo no se envió como multipart. Actualiza el frontend en Vercel.' : null)
        || err.message
        || 'Error al subir'
      setMsg({ text: `${status ? `[${status}] ` : ''}${detail}`, ok: false })
    } finally {
      setUploadingCat(null)
      if (fileRefs.current[category]) fileRefs.current[category]!.value = ''
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.get('/admin/import/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url
      a.download = 'plantilla_preguntas.csv'; a.click()
    } catch { }
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    setSaving(true)
    try {
      const res = await apiClient.post('/categories', { name: newCatName, color: newCatColor })
      setCategories(prev => [...prev, res.data])
      setNewCatName('')
      setNewCatColor(PRESET_COLORS[0])
      setShowAddCategory(false)
      setMsg({ text: `✅ Categoría "${res.data.name}" creada`, ok: true })
      setTimeout(() => setMsg(null), 3000)
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al crear categoría', ok: false })
    } finally { setSaving(false) }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"? También se eliminarán TODAS sus preguntas.`)) return
    try {
      const res = await apiClient.delete(`/categories/${id}`)
      setCategories(prev => prev.filter(c => c.id !== id))
      await loadAll()
      if (selectedCategory === name && categories.length > 1) {
        const remaining = categories.filter(c => c.id !== id)
        setSelectedCategory(remaining[0]?.name || '')
      }
      const deletedCount = res.data?.deletedQuestions as number | undefined
      setMsg({
        text: `🗑️ Categoría eliminada${deletedCount != null ? ` (${deletedCount} preguntas)` : ''}`,
        ok: false
      })
      setTimeout(() => setMsg(null), 2000)
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error', ok: false })
    }
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
      loadAll()
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
      loadAll()
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
      setTimeout(() => { setMsg(null); loadAll() }, 2000)
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error', ok: false })
    }
  }

  const filtered = questions.filter(q => {
    const matchCat = q.category === selectedCategory
    const matchSearch = search === '' || q.questionText.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const counts = categories.reduce((acc, cat) => {
    acc[cat.name] = questions.filter(q => q.category === cat.name).length
    return acc
  }, {} as Record<string, number>)

  const currentCat = categories.find(c => c.name === selectedCategory)
  const letters = ['A', 'B', 'C', 'D']

  return (
    <div className="max-w-5xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.2s ease forwards; }
        .input-q { width:100%; padding:9px 13px; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#e5e7eb; font-size:13px; outline:none; transition: border-color 0.2s; }
        .input-q:focus { border-color: rgba(255,255,255,0.25); }
        .input-q::placeholder { color:#4B5563; }
        select.input-q option { background:#111; }
      `}</style>

      {/* MODAL EDITAR */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto fade-in"
            style={{ background: '#111614', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold text-base">Editar pregunta</h3>
              <button onClick={() => setEditingQuestion(null)}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none transition-colors">✕</button>
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
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
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
                    Opciones — <span style={{ color: NEON }}>toca la letra para marcar correcta</span>
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
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                          style={{
                            backgroundColor: opt.isCorrect ? NEON : 'rgba(255,255,255,0.06)',
                            color: opt.isCorrect ? '#000' : '#6B7280',
                            border: `1px solid ${opt.isCorrect ? NEON : 'rgba(255,255,255,0.1)'}`
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
                  className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Cancelar
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link href="/admin" className="text-gray-600 hover:text-gray-300 text-sm transition-colors">
          ← Panel Admin
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white">Banco de preguntas</h1>
          <p className="text-gray-600 text-xs mt-0.5">
            {questions.length} preguntas cargadas (máx. {ADMIN_QUESTIONS_PAGE_SIZE}) · {categories.length} categorías
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleDownloadTemplate}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ backgroundColor: 'rgba(79,195,247,0.1)', color: NEON2, border: '1px solid rgba(79,195,247,0.2)' }}>
            ⬇️ Plantilla CSV
          </button>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: showAddForm ? 'rgba(255,255,255,0.05)' : 'rgba(74,124,89,0.12)',
              color: showAddForm ? '#6B7280' : NEON,
              border: `1px solid ${showAddForm ? 'rgba(255,255,255,0.08)' : 'rgba(74,124,89,0.25)'}`
            }}>
            {showAddForm ? '✕ Cancelar' : '+ Nueva pregunta'}
          </button>
          {questions.length > 0 && (
            <button onClick={handleDeleteAll}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ backgroundColor: 'rgba(255,82,82,0.08)', color: '#ef4444', border: '1px solid rgba(255,82,82,0.2)' }}>
              Eliminar todo
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm fade-in"
          style={{
            backgroundColor: msg.ok ? 'rgba(74,124,89,0.08)' : 'rgba(255,82,82,0.08)',
            border: `1px solid ${msg.ok ? 'rgba(74,124,89,0.2)' : 'rgba(255,82,82,0.2)'}`,
            color: msg.ok ? NEON : '#ef4444'
          }}>
          {msg.text}
        </div>
      )}

      {/* FORM NUEVA PREGUNTA */}
      {showAddForm && (
        <div className="rounded-xl p-5 mb-4 fade-in"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white font-medium text-sm mb-4">Nueva pregunta manual</p>
          <form onSubmit={handleAddQuestion} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Examen *</label>
              <select className="input-q" value={qForm.examId}
                onChange={e => setQForm({ ...qForm, examId: e.target.value })} required>
                <option value="">Selecciona un examen</option>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pregunta *</label>
              <textarea className="input-q" rows={3} placeholder="Escribe la pregunta..."
                value={qForm.questionText}
                onChange={e => setQForm({ ...qForm, questionText: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                <select className="input-q" value={qForm.category}
                  onChange={e => setQForm({ ...qForm, category: e.target.value })}>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Año</label>
                <input className="input-q" type="number" value={qForm.yearValuation}
                  onChange={e => setQForm({ ...qForm, yearValuation: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Opciones — <span style={{ color: NEON }}>toca la letra para marcar correcta</span>
              </label>
              {qForm.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <button type="button"
                    onClick={() => setQForm({ ...qForm, options: qForm.options.map((o, j) => ({ ...o, isCorrect: j === i })) })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                    style={{
                      backgroundColor: opt.isCorrect ? NEON : 'rgba(255,255,255,0.06)',
                      color: opt.isCorrect ? '#000' : '#6B7280',
                      border: `1px solid ${opt.isCorrect ? NEON : 'rgba(255,255,255,0.1)'}`
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
              <label className="block text-xs text-gray-500 mb-1">Explicación (opcional)</label>
              <textarea className="input-q" rows={2} placeholder="¿Por qué es correcta?"
                value={qForm.explanation}
                onChange={e => setQForm({ ...qForm, explanation: e.target.value })} />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-opacity"
              style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar pregunta'}
            </button>
          </form>
        </div>
      )}

      {/* CATEGORÍAS */}
      <div className="rounded-xl overflow-hidden mb-4"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-gray-400 text-xs font-medium">Categorías</p>
          <button onClick={() => setShowAddCategory(!showAddCategory)}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: showAddCategory ? 'rgba(255,255,255,0.05)' : 'rgba(74,124,89,0.1)',
              color: showAddCategory ? '#6B7280' : NEON,
              border: `1px solid ${showAddCategory ? 'rgba(255,255,255,0.08)' : 'rgba(74,124,89,0.2)'}`
            }}>
            {showAddCategory ? '✕ Cancelar' : '+ Agregar categoría'}
          </button>
        </div>

        {showAddCategory && (
          <div className="px-4 py-3 fade-in"
            style={{ background: 'rgba(74,124,89,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 flex-wrap">
              <input className="input-q flex-1 min-w-48"
                placeholder="Nombre de la categoría (ej. ETICA POLICIAL)"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value.toUpperCase())} />
              <div className="flex gap-1.5 shrink-0">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button"
                    onClick={() => setNewCatColor(c)}
                    className="w-6 h-6 rounded-full transition-all"
                    style={{
                      backgroundColor: c,
                      transform: newCatColor === c ? 'scale(1.25)' : 'scale(1)',
                      boxShadow: newCatColor === c ? `0 0 8px ${c}80` : 'none'
                    }} />
                ))}
              </div>
              <button onClick={handleAddCategory} disabled={saving || !newCatName.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000', opacity: saving || !newCatName.trim() ? 0.5 : 1 }}>
                Crear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-gray-600 text-center py-6 text-sm">Cargando...</div>
        ) : categories.length === 0 ? (
          <div className="text-gray-600 text-center py-6 text-sm">No hay categorías — agrega una</div>
        ) : (
          <div>
            {categories.map((cat, idx) => {
              const isSelected = selectedCategory === cat.name
              const count = counts[cat.name] || 0
              const isUploading = uploadingCat === cat.name
              return (
                <div key={cat.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                    borderBottom: idx < categories.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    borderLeft: isSelected ? `3px solid ${cat.color}` : '3px solid transparent',
                  }}
                  onClick={() => { setSelectedCategory(cat.name); setPage(1); setSearch('') }}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color, opacity: 0.8 }} />
                  <span className="flex-1 text-sm"
                    style={{ color: isSelected ? '#e5e7eb' : '#9CA3AF' }}>
                    {cat.name}
                  </span>
                  <span className="text-xs tabular-nums"
                    style={{ color: count > 0 ? '#6B7280' : '#374151' }}>
                    {count} {count === 1 ? 'pregunta' : 'preguntas'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0"
                    onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => fileRefs.current[cat.name]?.click()}
                      disabled={isUploading}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: isUploading ? 'rgba(255,255,255,0.05)' : `${cat.color}18`,
                        color: isUploading ? '#4B5563' : cat.color,
                        border: `1px solid ${cat.color}30`
                      }}>
                      {isUploading ? '⏳ Subiendo...' : '↑ CSV'}
                    </button>
                    <input type="file" accept=".csv" className="hidden"
                      ref={el => { fileRefs.current[cat.name] = el }}
                      onChange={e => handleCSVUpload(e, cat.name)} />
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                      style={{ backgroundColor: 'rgba(255,82,82,0.06)', color: '#ef4444' }}>
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* BUSCADOR */}
      {currentCat && (
        <div className="mb-3">
          <input className="input-q"
            placeholder={`Buscar en ${currentCat.name}...`}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      )}

      {/* LISTA PREGUNTAS */}
      {currentCat && (
        <div className="rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCat.color }} />
              <p className="text-xs text-gray-400">
                {currentCat.name} · {filtered.length} {filtered.length === 1 ? 'pregunta' : 'preguntas'}
                {search && ` · "${search}"`}
              </p>
            </div>
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: page === 1 ? '#374151' : '#9CA3AF' }}>←</button>
                <span className="text-xs text-gray-600">{page}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: page === totalPages ? '#374151' : '#9CA3AF' }}>→</button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-gray-600 text-center py-10 text-sm">Cargando...</div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 text-sm mb-4">
                {search ? `Sin resultados para "${search}"` : `No hay preguntas en ${currentCat.name}`}
              </p>
              {!search && (
                <button onClick={() => fileRefs.current[currentCat.name]?.click()}
                  className="inline-flex px-4 py-2 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: `${currentCat.color}15`, color: currentCat.color, border: `1px solid ${currentCat.color}25` }}>
                  ↑ Subir CSV de {currentCat.name}
                </button>
              )}
            </div>
          ) : (
            <div>
              {paginated.map((q, i) => {
                const globalIdx = (page - 1) * PAGE_SIZE + i + 1
                return (
                  <div key={q.id}
                    className="px-4 py-4 flex items-start gap-3 transition-colors hover:bg-white/[0.015]"
                    style={{ borderBottom: i < paginated.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span className="text-xs text-gray-700 w-6 shrink-0 pt-0.5 text-right tabular-nums">{globalIdx}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 text-sm leading-relaxed mb-2">{q.questionText}</p>
                      {q.answerOptions && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          {q.answerOptions
                            .sort((a, b) => a.optionIndex - b.optionIndex)
                            .map((opt, oi) => (
                              <div key={oi} className="flex items-start gap-1.5">
                                <span className="text-xs font-semibold shrink-0 mt-px"
                                  style={{ color: opt.isCorrect ? currentCat.color : '#4B5563' }}>
                                  {letters[oi]}.
                                </span>
                                <span className="text-xs leading-relaxed"
                                  style={{ color: opt.isCorrect ? '#d1d5db' : '#6B7280' }}>
                                  {opt.optionText}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEditQuestion(q)}
                        className="px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                        style={{ backgroundColor: 'rgba(79,195,247,0.08)', color: '#60a5fa' }}>✏️</button>
                      <button onClick={() => handleDeleteQuestion(q.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                        style={{ backgroundColor: 'rgba(255,82,82,0.08)', color: '#ef4444' }}>🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-2 px-4 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: page === 1 ? '#374151' : '#9CA3AF' }}>««</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: page === 1 ? '#374151' : '#9CA3AF' }}>← Anterior</button>
              <span className="text-xs text-gray-600 px-2">
                Página {page} de {totalPages} · {filtered.length} preguntas
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: page === totalPages ? '#374151' : '#9CA3AF' }}>Siguiente →</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: page === totalPages ? '#374151' : '#9CA3AF' }}>»»</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
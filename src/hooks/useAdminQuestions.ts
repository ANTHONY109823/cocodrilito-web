'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorDetail, getApiErrorMessage } from '@/lib/api/errors'
import apiClient from '@/lib/api/client'
import { ADMIN_QUESTIONS_PAGE_SIZE } from '@/lib/constants/questions'
import { DEFAULT_QUESTION_TRACK, QUESTION_TRACK_OPTIONS, trackLabel } from '@/lib/constants/trackTypes'
import {
  hasUsableExplanation,
  matchesExplanationFilter,
  needsExplanationReview,
  type ExplanationFilter,
} from '@/lib/utils/explanation'
import type { EditableQuestion } from '@/components/admin/preguntas/QuestionEditModal'
import { parseQuestionsResponse } from '@/lib/utils/normalizeQuestion'
import { categoryMatches } from '@/lib/utils/questionCategory'
import {
  EMPTY_QUESTION_FORM,
  PRESET_COLORS,
  type Category,
  type Question,
  type QuestionFormState,
} from '@/components/admin/preguntas/types'

interface UseAdminQuestionsOptions {
  isSuperAdminMode: boolean
  enabled: boolean
  viewerTrackType?: number
}

function questionMatchesTrack(q: Question, trackValue: number): boolean {
  const expected = QUESTION_TRACK_OPTIONS.find((t) => t.value === trackValue)?.key
  if (!expected) return true
  if (!q.trackType) return false
  return q.trackType === expected
}

export function useAdminQuestions({ isSuperAdminMode, enabled, viewerTrackType }: UseAdminQuestionsOptions) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [exams, setExams] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCat, setUploadingCat] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<EditableQuestion | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0])
  const [questionScope, setQuestionScope] = useState<'base' | 'own'>('base')
  const [activeTrackType, setActiveTrackType] = useState(DEFAULT_QUESTION_TRACK)
  const [explanationFilter, setExplanationFilter] = useState<ExplanationFilter>('all')
  const [qForm, setQForm] = useState<QuestionFormState>(EMPTY_QUESTION_FORM)

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const resolvedTrackType = isSuperAdminMode
    ? activeTrackType
    : (viewerTrackType ?? DEFAULT_QUESTION_TRACK)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setQuestions([])
    try {
      const trackQuery = `&trackType=${resolvedTrackType}`
      const [qRes, eRes, cRes] = await Promise.all([
        apiClient.get(`/admin/Questions?pageSize=${ADMIN_QUESTIONS_PAGE_SIZE}${trackQuery}`),
        apiClient.get('/exams/list'),
        apiClient.get('/categories'),
      ])
      const qs = parseQuestionsResponse(qRes.data)
      const cats = Array.isArray(cRes.data) ? cRes.data : []
      setQuestions(qs)
      setExams(Array.isArray(eRes.data) ? eRes.data : [])
      setCategories(cats)
      const firstCat = cats[0]?.name
      if (firstCat) {
        setSelectedCategory((prev) => prev || firstCat)
        setQForm((f) => ({ ...f, category: f.category || firstCat }))
      }
    } catch (err: unknown) {
      setMsg({ text: getApiErrorDetail(err, 'Error al cargar el banco de preguntas'), ok: false })
    } finally {
      setLoading(false)
    }
  }, [resolvedTrackType])

  useEffect(() => {
    if (enabled) void loadAll()
  }, [enabled, loadAll, resolvedTrackType])

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCat(category)
    setMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post(
        `/admin/import/questions?categoria=${encodeURIComponent(category)}&trackType=${resolvedTrackType}&forOwnTenant=${questionScope === 'own'}`,
        formData
      )
      const imported = res.data.imported ?? 0
      const totalErrors = res.data.totalErrors ?? 0
      const withExplanation = res.data.withExplanation ?? 0
      const withoutExplanation = res.data.withoutExplanation ?? 0
      const needsReview = res.data.needsReview ?? 0
      const firstErrors = (res.data.errors as string[] | undefined)?.slice(0, 3).join(' · ') ?? ''

      if (imported === 0) {
        setMsg({
          text: `⚠️ 0 importadas en ${category}. ${res.data.message || ''}${firstErrors ? ` ${firstErrors}` : ''}`,
          ok: false,
        })
      } else {
        const explSummary =
          withoutExplanation > 0 || needsReview > 0
            ? ` · ${withExplanation} con explicación, ${withoutExplanation} sin explicación${needsReview > 0 ? `, ${needsReview} pendientes de revisión` : ''}`
            : ` · ${withExplanation} con explicación`
        setMsg({
          text: `✅ ${imported} preguntas importadas en ${category}${explSummary}${totalErrors > 0 ? ` (${totalErrors} filas con error)` : ''}`,
          ok: true,
        })
      }
      setTimeout(() => setMsg(null), totalErrors > 0 || imported === 0 ? 12000 : 4000)
      void loadAll()
    } catch (err: unknown) {
      setMsg({ text: getApiErrorDetail(err, 'Error al subir'), ok: false })
    } finally {
      setUploadingCat(null)
      if (fileRefs.current[category]) fileRefs.current[category]!.value = ''
    }
  }

  const handleDownloadTemplate = async (category?: string) => {
    try {
      const params = category ? { categoria: category } : undefined
      const res = await apiClient.get('/admin/import/template', { responseType: 'blob', params })
      const contentType = String(res.headers['content-type'] ?? '')
      if (contentType.includes('application/json')) {
        const text = await (res.data as Blob).text()
        const json = JSON.parse(text) as { message?: string }
        setMsg({ text: json.message ?? 'No se pudo descargar la plantilla', ok: false })
        return
      }

      const safeCat = category?.toLowerCase().replace(/\s+/g, '_') ?? 'general'
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `plantilla_preguntas_${safeCat}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setMsg({ text: '✅ Plantilla CSV descargada', ok: true })
      setTimeout(() => setMsg(null), 3000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorDetail(err, 'No se pudo descargar la plantilla CSV'), ok: false })
    }
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    setSaving(true)
    try {
      const res = await apiClient.post('/categories', { name: newCatName, color: newCatColor })
      setCategories((prev) => [...prev, res.data])
      setNewCatName('')
      setNewCatColor(PRESET_COLORS[0])
      setShowAddCategory(false)
      setMsg({ text: `✅ Categoría "${res.data.name}" creada`, ok: true })
      setTimeout(() => setMsg(null), 3000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al crear categoría'), ok: false })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    const trackSuffix = isSuperAdminMode ? ` del balotario ${trackLabel(activeTrackType)}` : ''
    if (!confirm(`¿Eliminar las preguntas de "${name}"${trackSuffix}?${isSuperAdminMode ? ' La categoría solo se borra si queda vacía en todos los balotarios.' : ' También se eliminará la categoría si queda vacía.'}`)) return
    try {
      const trackQuery = isSuperAdminMode ? `?trackType=${activeTrackType}` : ''
      const res = await apiClient.delete(`/categories/${id}${trackQuery}`)
      setCategories((prev) => {
        const remaining = prev.filter((c) => c.id !== id)
        if (selectedCategory === name) {
          setSelectedCategory(remaining[0]?.name || '')
        }
        return res.data?.categoryDeactivated === false ? prev : remaining
      })
      await loadAll()
      const deletedCount = res.data?.deletedQuestions as number | undefined
      setMsg({
        text:
          deletedCount != null
            ? `🗑️ ${deletedCount} preguntas eliminadas en ${name}${trackSuffix}`
            : `🗑️ Categoría eliminada`,
        ok: false,
      })
      setTimeout(() => setMsg(null), 4000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error'), ok: false })
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await apiClient.post(`/admin/Questions?forOwnTenant=${questionScope === 'own'}`, {
        examId: qForm.examId,
        questionText: qForm.questionText,
        category: qForm.category,
        difficulty: 1,
        yearValuation: qForm.yearValuation,
        orderIndex: qForm.orderIndex,
        explanation: qForm.explanation,
        trackType: resolvedTrackType,
        answerOptions: qForm.options,
      })
      setMsg({ text: '✅ Pregunta creada', ok: true })
      setQForm({ ...qForm, questionText: '', explanation: '', orderIndex: qForm.orderIndex + 1 })
      setShowAddForm(false)
      void loadAll()
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error'), ok: false })
    } finally {
      setSaving(false)
    }
  }

  const handleEditQuestion = async (q: Question) => {
    try {
      const res = await apiClient.get(`/admin/Questions/${q.id}`)
      setEditingQuestion(res.data)
    } catch {
      setEditingQuestion(q)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingQuestion) return
    setSaving(true)
    try {
      await apiClient.put(`/admin/Questions/${editingQuestion.id}`, {
        questionText: editingQuestion.questionText,
        explanation: editingQuestion.explanation ?? '',
        answerOptions: editingQuestion.answerOptions,
      })
      setMsg({ text: '✅ Pregunta actualizada', ok: true })
      setEditingQuestion(null)
      void loadAll()
    } catch {
      setMsg({ text: 'Error al actualizar', ok: false })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    try {
      await apiClient.delete(`/admin/Questions/${id}`)
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      setMsg({ text: '🗑️ Pregunta eliminada', ok: false })
      setTimeout(() => setMsg(null), 2000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al eliminar la pregunta'), ok: false })
    }
  }

  const handleDeleteAll = async () => {
    const trackSuffix = isSuperAdminMode ? ` del balotario ${trackLabel(activeTrackType)}` : ''
    if (!confirm(`⚠️ ¿Eliminar TODAS las preguntas${trackSuffix}?`)) return
    if (!confirm('¿Estás SEGURO? Esta acción no se puede deshacer.')) return
    try {
      const trackQuery = isSuperAdminMode ? `&trackType=${activeTrackType}` : ''
      const res = await apiClient.delete(
        `/admin/Questions/bulk?ownOnly=${questionScope === 'own'}${trackQuery}`
      )
      setMsg({
        text: `🗑️ ${res.data.deleted} preguntas eliminadas${trackSuffix}`,
        ok: false,
      })
      setTimeout(() => {
        setMsg(null)
        void loadAll()
      }, 2000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error'), ok: false })
    }
  }

  const scopedQuestions = questions
    .filter((q) => (questionScope === 'base' ? !q.tenantId : Boolean(q.tenantId)))
    .filter((q) => questionMatchesTrack(q, resolvedTrackType))

  const categorizedQuestions = scopedQuestions.filter((q) =>
    categories.some((cat) => categoryMatches(q.category, cat.name))
  )

  const uncategorizedCount = scopedQuestions.length - categorizedQuestions.length

  const explanationCoverage = {
    total: categorizedQuestions.length,
    withExplanation: categorizedQuestions.filter((q) => hasUsableExplanation(q.explanation)).length,
    withoutExplanation: categorizedQuestions.filter(
      (q) => !hasUsableExplanation(q.explanation) && !needsExplanationReview(q.explanation)
    ).length,
    needsReview: categorizedQuestions.filter((q) => needsExplanationReview(q.explanation)).length,
  }

  const filtered = scopedQuestions.filter((q) => {
    const matchCat = categoryMatches(q.category, selectedCategory)
    const matchSearch = search === '' || q.questionText.toLowerCase().includes(search.toLowerCase())
    const matchExplanation = matchesExplanationFilter(q.explanation, explanationFilter)
    return matchCat && matchSearch && matchExplanation
  })

  const counts = categories.reduce(
    (acc, cat) => {
      const catQuestions = scopedQuestions.filter((q) => categoryMatches(q.category, cat.name))
      acc[cat.name] = catQuestions.length
      return acc
    },
    {} as Record<string, number>
  )

  const missingExplanationByCategory = categories.reduce(
    (acc, cat) => {
      const catQuestions = scopedQuestions.filter((q) => categoryMatches(q.category, cat.name))
      acc[cat.name] = catQuestions.filter((q) => !hasUsableExplanation(q.explanation)).length
      return acc
    },
    {} as Record<string, number>
  )

  const selectedCategoryQuestions = scopedQuestions.filter((q) =>
    categoryMatches(q.category, selectedCategory)
  )
  const categoryExplanationCoverage = {
    withoutExplanation: selectedCategoryQuestions.filter(
      (q) => !hasUsableExplanation(q.explanation) && !needsExplanationReview(q.explanation)
    ).length,
    needsReview: selectedCategoryQuestions.filter((q) => needsExplanationReview(q.explanation)).length,
  }

  return {
    questions,
    categories,
    exams,
    loading,
    saving,
    uploadingCat,
    msg,
    editingQuestion,
    setEditingQuestion,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
    page,
    setPage,
    showAddForm,
    setShowAddForm,
    showAddCategory,
    setShowAddCategory,
    newCatName,
    setNewCatName,
    newCatColor,
    setNewCatColor,
    questionScope,
    setQuestionScope,
    activeTrackType,
    setActiveTrackType,
    explanationFilter,
    setExplanationFilter,
    explanationCoverage,
    categoryExplanationCoverage,
    missingExplanationByCategory,
    qForm,
    setQForm,
    fileRefs,
    scopedQuestions,
    categorizedCount: categorizedQuestions.length,
    uncategorizedCount,
    filtered,
    counts,
    loadAll,
    handleCSVUpload,
    handleDownloadTemplate,
    handleAddCategory,
    handleDeleteCategory,
    handleAddQuestion,
    handleEditQuestion,
    handleSaveEdit,
    handleDeleteQuestion,
    handleDeleteAll,
  }
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSWRConfig } from 'swr'
import { getApiErrorDetail, getApiErrorMessage } from '@/lib/api/errors'
import apiClient from '@/lib/api/client'
import { resolveApiBaseUrl } from '@/lib/api/apiBaseUrl'
import { prefetchAscensoQuestionCounts } from '@/lib/api/questionCounts'
import {
  ADMIN_QUESTIONS_PAGE_SIZE,
  CATEGORY_QUESTIONS_MAX,
} from '@/lib/constants/questions'
import {
  DEFAULT_QUESTION_TRACK,
  trackKeyFromValue,
  trackLabel,
} from '@/lib/constants/trackTypes'
import {
  defaultHierarchyForTrack,
  hierarchiesForTrack,
  hierarchyLabel,
} from '@/lib/constants/promotionGrades'
import { useQuestionCounts } from '@/hooks/useQuestionCounts'
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
  allowTrackSwitch?: boolean
}

export function useAdminQuestions({
  isSuperAdminMode,
  enabled,
  viewerTrackType,
  allowTrackSwitch = false,
}: UseAdminQuestionsOptions) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [exams, setExams] = useState<{ id: string; title: string }[]>([])
  const [metaLoaded, setMetaLoaded] = useState(false)
  const [bankLoading, setBankLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
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
  const [activeHierarchy, setActiveHierarchy] = useState(() =>
    defaultHierarchyForTrack(DEFAULT_QUESTION_TRACK)
  )
  const [explanationFilter, setExplanationFilter] = useState<ExplanationFilter>('all')
  const [qForm, setQForm] = useState<QuestionFormState>(EMPTY_QUESTION_FORM)

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const bankCacheRef = useRef<Map<string, Question[]>>(new Map())
  const trackRequestRef = useRef(0)
  const categoryRequestRef = useRef(0)
  const { mutate: globalMutate } = useSWRConfig()

  const browseMode = allowTrackSwitch && questionScope === 'base'
  const resolvedTrackType =
    isSuperAdminMode || allowTrackSwitch
      ? activeTrackType
      : (viewerTrackType ?? DEFAULT_QUESTION_TRACK)

  const trackKey = trackKeyFromValue(resolvedTrackType)
  const resolvedHierarchy = useMemo(() => {
    const valid = hierarchiesForTrack(resolvedTrackType).map((h) => h.value)
    return valid.some((v) => v === activeHierarchy)
      ? activeHierarchy
      : defaultHierarchyForTrack(resolvedTrackType)
  }, [resolvedTrackType, activeHierarchy])

  const changeActiveTrack = useCallback((track: number) => {
    setActiveTrackType(track)
    setActiveHierarchy(defaultHierarchyForTrack(track))
    setPage(1)
  }, [])

  const {
    total: remoteTotal,
    byCategory: remoteCounts,
    missingByCategory: remoteMissingByCategory,
    withExplanation: remoteWithExplanation,
    withoutExplanation: remoteWithoutExplanation,
    needsReview: remoteNeedsReview,
    isLoading: countsLoading,
    refresh: refreshCounts,
  } = useQuestionCounts(browseMode ? trackKey : null, browseMode ? resolvedHierarchy : null)

  useEffect(() => {
    if (resolvedHierarchy !== activeHierarchy) {
      setActiveHierarchy(resolvedHierarchy)
    }
  }, [resolvedHierarchy, activeHierarchy])

  useEffect(() => {
    if (!enabled || !browseMode) return
    prefetchAscensoQuestionCounts(globalMutate)
  }, [enabled, browseMode, globalMutate])

  const loadMeta = useCallback(async () => {
    if (metaLoaded) return
    try {
      const eRes = await apiClient.get('/exams/list')
      setExams(Array.isArray(eRes.data) ? eRes.data : [])
      setMetaLoaded(true)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorDetail(err, 'Error al cargar exámenes'), ok: false })
    }
  }, [metaLoaded])

  const loadCategories = useCallback(async (track: number, hierarchy: number) => {
    try {
      const cRes = await apiClient.get('/categories', {
        params: { trackType: track, promotionHierarchy: hierarchy },
      })
      const cats = Array.isArray(cRes.data) ? cRes.data : []
      setCategories(cats)
      setSelectedCategory((prev) => {
        if (prev && cats.some((c: Category) => c.name === prev)) return prev
        return cats[0]?.name || ''
      })
      setQForm((f) => ({
        ...f,
        category: cats.some((c: Category) => c.name === f.category)
          ? f.category
          : cats[0]?.name || '',
      }))
    } catch (err: unknown) {
      setMsg({ text: getApiErrorDetail(err, 'Error al cargar categorías'), ok: false })
    }
  }, [])

  const loadFullBank = useCallback(async (track: number, hierarchy: number) => {
    const cacheKey = `${track}-${hierarchy}`
    const requestId = ++trackRequestRef.current
    const cached = bankCacheRef.current.get(cacheKey)
    if (cached) {
      setQuestions(cached)
      setBankLoading(false)
    } else {
      setBankLoading(true)
    }

    try {
      const res = await apiClient.get(
        `/admin/Questions?pageSize=${ADMIN_QUESTIONS_PAGE_SIZE}&trackType=${track}&promotionHierarchy=${hierarchy}`
      )
      if (requestId !== trackRequestRef.current) return
      const qs = parseQuestionsResponse(res.data)
      bankCacheRef.current.set(cacheKey, qs)
      setQuestions(qs)
    } catch (err: unknown) {
      if (requestId !== trackRequestRef.current) return
      setMsg({ text: getApiErrorDetail(err, 'Error al cargar el banco de preguntas'), ok: false })
    } finally {
      if (requestId === trackRequestRef.current) setBankLoading(false)
    }
  }, [])

  const loadCategoryQuestions = useCallback(async (category: string, track: number, hierarchy: number) => {
    if (!category) {
      setQuestions([])
      return
    }
    const requestId = ++categoryRequestRef.current
    setListLoading(true)
    try {
      const res = await apiClient.get(
        `/admin/Questions?trackType=${track}&promotionHierarchy=${hierarchy}&category=${encodeURIComponent(category)}&pageSize=${CATEGORY_QUESTIONS_MAX}`
      )
      if (requestId !== categoryRequestRef.current) return
      setQuestions(parseQuestionsResponse(res.data))
    } catch (err: unknown) {
      if (requestId !== categoryRequestRef.current) return
      setMsg({ text: getApiErrorDetail(err, 'Error al cargar preguntas'), ok: false })
    } finally {
      if (requestId === categoryRequestRef.current) setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void loadMeta()
  }, [enabled, loadMeta])

  useEffect(() => {
    if (!enabled || !metaLoaded) return
    void loadCategories(resolvedTrackType, resolvedHierarchy)
  }, [enabled, metaLoaded, resolvedTrackType, resolvedHierarchy, loadCategories])

  useEffect(() => {
    if (!enabled || !metaLoaded) return
    if (browseMode) {
      setBankLoading(false)
      void loadCategoryQuestions(selectedCategory, resolvedTrackType, resolvedHierarchy)
      return
    }
    void loadFullBank(resolvedTrackType, resolvedHierarchy)
  }, [
    enabled,
    metaLoaded,
    browseMode,
    resolvedTrackType,
    resolvedHierarchy,
    selectedCategory,
    loadFullBank,
    loadCategoryQuestions,
  ])

  const invalidateBankCaches = useCallback(() => {
    bankCacheRef.current.clear()
    void refreshCounts()
  }, [refreshCounts])

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCat(category)
    setMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post(
        `/admin/import/questions?categoria=${encodeURIComponent(category)}&trackType=${resolvedTrackType}&promotionHierarchy=${resolvedHierarchy}&forOwnTenant=${questionScope === 'own'}`,
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
      invalidateBankCaches()
      if (browseMode) void loadCategoryQuestions(selectedCategory, resolvedTrackType, resolvedHierarchy)
      else void loadFullBank(resolvedTrackType, resolvedHierarchy)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorDetail(err, 'Error al subir'), ok: false })
    } finally {
      setUploadingCat(null)
      if (fileRefs.current[category]) fileRefs.current[category]!.value = ''
    }
  }

  const handleDownloadTemplate = async (category?: string) => {
    try {
      const params = new URLSearchParams({
        promotionHierarchy: String(resolvedHierarchy),
      })
      if (category?.trim()) params.set('categoria', category.trim())

      const res = await fetch(`${resolveApiBaseUrl()}/admin/import/template?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })

      const contentType = res.headers.get('content-type') ?? ''
      if (!res.ok || contentType.includes('application/json')) {
        const json = (await res.json().catch(() => null)) as { message?: string } | null
        setMsg({
          text: json?.message ?? `No se pudo descargar la plantilla (${res.status})`,
          ok: false,
        })
        return
      }

      const blob = await res.blob()
      const safeCat = category?.toLowerCase().replace(/\s+/g, '_') ?? 'general'
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plantilla_${hierarchyLabel(resolvedHierarchy).toLowerCase().replace(/\s+/g, '_')}_${safeCat}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setMsg({ text: '✅ Plantilla CSV descargada', ok: true })
      setTimeout(() => setMsg(null), 3000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'No se pudo descargar la plantilla CSV'), ok: false })
    }
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    setSaving(true)
    try {
      const res = await apiClient.post('/categories', {
        name: newCatName,
        color: newCatColor,
        trackType: resolvedTrackType,
        promotionHierarchy: resolvedHierarchy,
      })
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
    const trackSuffix = isSuperAdminMode || allowTrackSwitch
      ? ` de ${hierarchyLabel(resolvedHierarchy)} (${trackLabel(activeTrackType)})`
      : ''
    if (!confirm(`¿Eliminar las preguntas de "${name}"${trackSuffix}? La categoría solo se borra en ${hierarchyLabel(resolvedHierarchy)}.`)) return
    try {
      const res = await apiClient.delete(`/categories/${id}`)
      setCategories((prev) => {
        const remaining = prev.filter((c) => c.id !== id)
        if (selectedCategory === name) {
          setSelectedCategory(remaining[0]?.name || '')
        }
        return remaining
      })
      invalidateBankCaches()
      if (browseMode) void loadCategoryQuestions(selectedCategory, resolvedTrackType, resolvedHierarchy)
      else void loadFullBank(resolvedTrackType, resolvedHierarchy)
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
        promotionHierarchy: resolvedHierarchy,
        answerOptions: qForm.options,
      })
      setMsg({ text: '✅ Pregunta creada', ok: true })
      setQForm({ ...qForm, questionText: '', explanation: '', orderIndex: qForm.orderIndex + 1 })
      setShowAddForm(false)
      invalidateBankCaches()
      if (browseMode) void loadCategoryQuestions(selectedCategory, resolvedTrackType, resolvedHierarchy)
      else void loadFullBank(resolvedTrackType, resolvedHierarchy)
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
      invalidateBankCaches()
      if (browseMode) void loadCategoryQuestions(selectedCategory, resolvedTrackType, resolvedHierarchy)
      else void loadFullBank(resolvedTrackType, resolvedHierarchy)
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
      invalidateBankCaches()
      setMsg({ text: '🗑️ Pregunta eliminada', ok: false })
      setTimeout(() => setMsg(null), 2000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al eliminar la pregunta'), ok: false })
    }
  }

  const handleDeleteAll = async () => {
    const trackSuffix = isSuperAdminMode || allowTrackSwitch
      ? ` de ${hierarchyLabel(resolvedHierarchy)} (${trackLabel(activeTrackType)})`
      : ''
    if (!confirm(`⚠️ ¿Eliminar TODAS las preguntas${trackSuffix}?`)) return
    if (!confirm('¿Estás SEGURO? Esta acción no se puede deshacer.')) return
    try {
      const trackQuery =
        isSuperAdminMode || allowTrackSwitch
          ? `&trackType=${activeTrackType}&promotionHierarchy=${resolvedHierarchy}`
          : ''
      const res = await apiClient.delete(
        `/admin/Questions/bulk?ownOnly=${questionScope === 'own'}${trackQuery}`
      )
      setMsg({
        text: `🗑️ ${res.data.deleted} preguntas eliminadas${trackSuffix}`,
        ok: false,
      })
      invalidateBankCaches()
      setTimeout(() => {
        setMsg(null)
        if (browseMode) void loadCategoryQuestions(selectedCategory, resolvedTrackType, resolvedHierarchy)
        else void loadFullBank(resolvedTrackType, resolvedHierarchy)
      }, 2000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error'), ok: false })
    }
  }

  const loadAll = useCallback(async () => {
    invalidateBankCaches()
    if (browseMode) {
      await loadCategoryQuestions(selectedCategory, resolvedTrackType, resolvedHierarchy)
    } else {
      await loadFullBank(resolvedTrackType, resolvedHierarchy)
    }
  }, [
    browseMode,
    invalidateBankCaches,
    loadCategoryQuestions,
    loadFullBank,
    resolvedTrackType,
    resolvedHierarchy,
    selectedCategory,
  ])

  const scopedQuestions = useMemo(
    () => questions.filter((q) => (questionScope === 'base' ? !q.tenantId : Boolean(q.tenantId))),
    [questions, questionScope]
  )

  const counts = useMemo(() => {
    if (browseMode) {
      const merged: Record<string, number> = {}
      for (const cat of categories) {
        const fromApi = remoteCounts[cat.name]
        if (fromApi != null) {
          merged[cat.name] = fromApi
          continue
        }
        for (const [key, value] of Object.entries(remoteCounts)) {
          if (categoryMatches(key, cat.name)) {
            merged[cat.name] = value
            break
          }
        }
        if (merged[cat.name] == null) merged[cat.name] = 0
      }
      return merged
    }
    return categories.reduce(
      (acc, cat) => {
        acc[cat.name] = scopedQuestions.filter((q) => categoryMatches(q.category, cat.name)).length
        return acc
      },
      {} as Record<string, number>
    )
  }, [browseMode, categories, remoteCounts, scopedQuestions])

  const categorizedCount = browseMode
    ? remoteTotal || Object.values(counts).reduce((sum, n) => sum + n, 0)
    : scopedQuestions.filter((q) =>
        categories.some((cat) => categoryMatches(q.category, cat.name))
      ).length

  const uncategorizedCount = browseMode
    ? 0
    : scopedQuestions.length -
      scopedQuestions.filter((q) =>
        categories.some((cat) => categoryMatches(q.category, cat.name))
      ).length

  const explanationCoverage = useMemo(() => {
    if (browseMode) {
      return {
        total: categorizedCount,
        withExplanation: remoteWithExplanation,
        withoutExplanation: remoteWithoutExplanation,
        needsReview: remoteNeedsReview,
      }
    }
    const source = scopedQuestions.filter((q) =>
      categories.some((cat) => categoryMatches(q.category, cat.name))
    )
    return {
      total: source.length,
      withExplanation: source.filter((q) => hasUsableExplanation(q.explanation)).length,
      withoutExplanation: source.filter(
        (q) => !hasUsableExplanation(q.explanation) && !needsExplanationReview(q.explanation)
      ).length,
      needsReview: source.filter((q) => needsExplanationReview(q.explanation)).length,
    }
  }, [
    browseMode,
    categorizedCount,
    remoteWithExplanation,
    remoteWithoutExplanation,
    remoteNeedsReview,
    categories,
    scopedQuestions,
  ])

  const filtered = useMemo(
    () =>
      scopedQuestions.filter((q) => {
        const matchCat = categoryMatches(q.category, selectedCategory)
        const matchSearch =
          search === '' || q.questionText.toLowerCase().includes(search.toLowerCase())
        const matchExplanation = matchesExplanationFilter(q.explanation, explanationFilter)
        return matchCat && matchSearch && matchExplanation
      }),
    [scopedQuestions, selectedCategory, search, explanationFilter]
  )

  const missingExplanationByCategory = useMemo(() => {
    if (browseMode) {
      const merged: Record<string, number> = {}
      for (const cat of categories) {
        const fromApi = remoteMissingByCategory[cat.name]
        if (fromApi != null) {
          merged[cat.name] = fromApi
          continue
        }
        for (const [key, value] of Object.entries(remoteMissingByCategory)) {
          if (categoryMatches(key, cat.name)) {
            merged[cat.name] = value
            break
          }
        }
        if (merged[cat.name] == null) merged[cat.name] = 0
      }
      return merged
    }
    return categories.reduce(
      (acc, cat) => {
        const catQuestions = scopedQuestions.filter((q) => categoryMatches(q.category, cat.name))
        acc[cat.name] = catQuestions.filter((q) => !hasUsableExplanation(q.explanation)).length
        return acc
      },
      {} as Record<string, number>
    )
  }, [browseMode, categories, remoteMissingByCategory, scopedQuestions])

  const selectedCategoryQuestions = useMemo(
    () => scopedQuestions.filter((q) => categoryMatches(q.category, selectedCategory)),
    [scopedQuestions, selectedCategory]
  )

  const categoryExplanationCoverage = useMemo(
    () => ({
      withoutExplanation: selectedCategoryQuestions.filter(
        (q) => !hasUsableExplanation(q.explanation) && !needsExplanationReview(q.explanation)
      ).length,
      needsReview: selectedCategoryQuestions.filter((q) => needsExplanationReview(q.explanation)).length,
    }),
    [selectedCategoryQuestions]
  )

  const loading = !metaLoaded || (browseMode ? countsLoading && categorizedCount === 0 : bankLoading)

  return {
    questions,
    categories,
    exams,
    loading,
    listLoading,
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
    changeActiveTrack,
    activeHierarchy,
    setActiveHierarchy,
    explanationFilter,
    setExplanationFilter,
    explanationCoverage,
    categoryExplanationCoverage,
    missingExplanationByCategory,
    qForm,
    setQForm,
    fileRefs,
    scopedQuestions,
    categorizedCount,
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

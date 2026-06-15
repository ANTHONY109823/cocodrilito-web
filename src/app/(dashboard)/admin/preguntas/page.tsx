'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import {
  isSuperAdmin,
  isTenantAdmin,
  isAdminAgencia,
  isAdminAcademia,
} from '@/lib/auth/roles'
import { trackLabel, QUESTION_TRACK_OPTIONS, DEFAULT_QUESTION_TRACK } from '@/lib/constants/trackTypes'
import { NEON } from '@/lib/constants/theme'
import { useAdminQuestions } from '@/hooks/useAdminQuestions'
import { QuestionEditModal } from '@/components/admin/preguntas/QuestionEditModal'
import { QuestionAddForm, TrackSelector, NEON2 } from '@/components/admin/preguntas/QuestionAddForm'
import { TrackSwitchBar } from '@/components/admin/preguntas/TrackSwitchBar'
import { CategoryPanel, QuestionsList } from '@/components/admin/preguntas/CategoryPanel'
import { ExplanationCoverageBanner } from '@/components/admin/preguntas/ExplanationCoverage'
import { PAGE_SIZE } from '@/components/admin/preguntas/types'

export default function PreguntasPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const isSuperAdminMode = pathname.startsWith('/superadmin/preguntas') || isSuperAdmin(user?.role)
  const isAgencia = isAdminAgencia(user?.role, user?.tenantType)
  const isAcademia = isAdminAcademia(user?.role, user?.tenantType)
  const showOwnScope = isSuperAdminMode || isAcademia

  const viewerTrackType =
    QUESTION_TRACK_OPTIONS.find((t) => t.key === user?.activeTrackType)?.value ??
    DEFAULT_QUESTION_TRACK

  const allowTrackSwitch = isAgencia || (isAcademia && !isSuperAdminMode)

  const q = useAdminQuestions({
    isSuperAdminMode,
    enabled: Boolean(user),
    viewerTrackType,
    allowTrackSwitch,
  })

  const canEditCurrentScope =
    isSuperAdminMode || (q.questionScope === 'own' && isAcademia)
  const readOnly = isAgencia || !canEditCurrentScope

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!user) return
    if (isSuperAdminMode && !isSuperAdmin(user.role) && !pathname.startsWith('/superadmin/preguntas')) {
      router.push('/dashboard')
      return
    }
    if (!isSuperAdminMode && !isTenantAdmin(user.role)) {
      router.push('/dashboard')
    }
  }, [user, router, isSuperAdminMode, pathname])

  const totalPages = Math.ceil(q.filtered.length / PAGE_SIZE)
  const paginated = q.filtered.slice((q.page - 1) * PAGE_SIZE, q.page * PAGE_SIZE)
  const currentCat = q.categories.find((c) => c.name === q.selectedCategory)

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

      {q.editingQuestion && (
        <QuestionEditModal
          question={q.editingQuestion}
          categories={q.categories}
          saving={q.saving}
          onClose={() => q.setEditingQuestion(null)}
          onChange={q.setEditingQuestion}
          onSave={() => void q.handleSaveEdit()}
        />
      )}

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link
          href={isSuperAdminMode ? '/superadmin?tab=agencias' : '/admin'}
          className="text-gray-600 hover:text-gray-300 text-sm transition-colors"
        >
          ← {isSuperAdminMode ? 'SuperAdmin' : 'Panel Admin'}
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white">
            {isSuperAdminMode
              ? 'Banco de Preguntas de Ascenso'
              : isAcademia
                ? 'Banco de Preguntas (Academia)'
                : 'Banco de Preguntas de Ascenso'}
          </h1>
          <p className="text-gray-600 text-xs mt-0.5">
            {readOnly && isAgencia
              ? `${q.categorizedCount} preguntas en vista · balotario: ${trackLabel(q.activeTrackType)}`
              : `${q.categorizedCount} preguntas en vista · ${q.categories.length} categorías · balotario: ${trackLabel(isSuperAdminMode ? q.activeTrackType : allowTrackSwitch ? q.activeTrackType : viewerTrackType)}`}
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => void q.handleDownloadTemplate(q.selectedCategory || undefined)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'rgba(79,195,247,0.1)',
                color: NEON2,
                border: '1px solid rgba(79,195,247,0.2)',
              }}
            >
              ⬇️ Plantilla CSV
            </button>
            <button
              onClick={() => q.setShowAddForm(!q.showAddForm)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: q.showAddForm ? 'rgba(255,255,255,0.05)' : 'rgba(74,124,89,0.12)',
                color: q.showAddForm ? '#6B7280' : NEON,
                border: `1px solid ${q.showAddForm ? 'rgba(255,255,255,0.08)' : 'rgba(74,124,89,0.25)'}`,
              }}
            >
              {q.showAddForm ? '✕ Cancelar' : '+ Nueva pregunta'}
            </button>
            {q.categorizedCount > 0 && (
              <button
                onClick={() => void q.handleDeleteAll()}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'rgba(255,82,82,0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(255,82,82,0.2)',
                }}
              >
                Eliminar todo
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: 'base' as const, label: '📚 Banco de ascenso', hint: 'Preguntas compartidas de la plataforma' },
          ...(showOwnScope
            ? [{ key: 'own' as const, label: '🏷️ Propias de academia', hint: 'Preguntas de tu institución' }]
            : []),
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              q.setQuestionScope(s.key)
              q.setPage(1)
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
            title={s.hint}
            style={{
              backgroundColor: q.questionScope === s.key ? `${NEON}20` : 'rgba(0,5,2,0.5)',
              color: q.questionScope === s.key ? NEON : '#6B7280',
              border: `1px solid ${q.questionScope === s.key ? NEON : '#ffffff10'}`,
            }}
          >
            {s.label}
          </button>
        ))}
        <span className="text-xs text-gray-600 self-center ml-auto">{q.categorizedCount} en esta vista</span>
      </div>

      {allowTrackSwitch && (
        <TrackSwitchBar
          activeTrackType={q.activeTrackType}
          onChange={(track) => {
            q.setActiveTrackType(track)
            q.setPage(1)
          }}
          hint="Solo lectura — Simulacros.pe gestiona el banco. Tus alumnos ven el balotario que les asignes."
        />
      )}

      {isSuperAdminMode && !readOnly && (
        <TrackSelector
          activeTrackType={q.activeTrackType}
          onChange={(track) => {
            q.setActiveTrackType(track)
            q.setPage(1)
          }}
        />
      )}

      {q.msg && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm fade-in"
          style={{
            backgroundColor: q.msg.ok ? 'rgba(74,124,89,0.08)' : 'rgba(255,82,82,0.08)',
            border: `1px solid ${q.msg.ok ? 'rgba(74,124,89,0.2)' : 'rgba(255,82,82,0.2)'}`,
            color: q.msg.ok ? NEON : '#ef4444',
          }}
        >
          {q.msg.text}
        </div>
      )}

      <ExplanationCoverageBanner
        total={q.explanationCoverage.total}
        withExplanation={q.explanationCoverage.withExplanation}
        withoutExplanation={q.explanationCoverage.withoutExplanation}
        needsReview={q.explanationCoverage.needsReview}
      />

      {q.uncategorizedCount > 0 && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#fbbf24',
          }}
        >
          ⚠️ {q.uncategorizedCount} preguntas del balotario {trackLabel(q.activeTrackType)} no coinciden
          con ninguna categoría activa. Revisa el CSV o elimínalas con &quot;Eliminar todo&quot;.
        </div>
      )}

      {q.showAddForm && !readOnly && (
        <QuestionAddForm
          exams={q.exams}
          categories={q.categories}
          qForm={q.qForm}
          saving={q.saving}
          onChange={q.setQForm}
          onSubmit={(e) => void q.handleAddQuestion(e)}
        />
      )}

      <CategoryPanel
        categories={q.categories}
        counts={q.counts}
        missingExplanationByCategory={q.missingExplanationByCategory}
        loading={q.loading}
        readOnly={readOnly}
        isSuperAdminMode={isSuperAdminMode}
        selectedCategory={q.selectedCategory}
        uploadingCat={q.uploadingCat}
        showAddCategory={q.showAddCategory}
        newCatName={q.newCatName}
        newCatColor={q.newCatColor}
        saving={q.saving}
        fileRefs={q.fileRefs}
        onSelectCategory={(name) => {
          q.setSelectedCategory(name)
          q.setPage(1)
          q.setSearch('')
        }}
        onToggleAddCategory={() => q.setShowAddCategory(!q.showAddCategory)}
        onNewCatNameChange={q.setNewCatName}
        onNewCatColorChange={q.setNewCatColor}
        onAddCategory={() => void q.handleAddCategory()}
        onDeleteCategory={(id, name) => void q.handleDeleteCategory(id, name)}
        onCSVUpload={(e, cat) => void q.handleCSVUpload(e, cat)}
      />

      <QuestionsList
        currentCat={currentCat}
        paginated={paginated}
        filtered={q.filtered}
        loading={q.loading}
        readOnly={readOnly}
        search={q.search}
        onSearchChange={q.setSearch}
        page={q.page}
        pageSize={PAGE_SIZE}
        fileRefs={q.fileRefs}
        explanationFilter={q.explanationFilter}
        onExplanationFilterChange={(filter) => {
          q.setExplanationFilter(filter)
          q.setPage(1)
        }}
        explanationCoverage={q.categoryExplanationCoverage}
        onPageChange={q.setPage}
        onEdit={(question) => void q.handleEditQuestion(question)}
        onDelete={(id) => void q.handleDeleteQuestion(id)}
      />
    </div>
  )
}

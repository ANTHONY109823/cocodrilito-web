'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import {
  isSuperAdmin,
  isTenantAdmin,
  isAdminAgencia,
} from '@/lib/auth/roles'
import { trackLabel, DEFAULT_QUESTION_TRACK, resolveUserTrackKey } from '@/lib/constants/trackTypes'
import { hierarchyLabel } from '@/lib/constants/promotionGrades'
import { NEON } from '@/lib/constants/theme'
import { useAdminQuestions } from '@/hooks/useAdminQuestions'
import { QuestionEditModal } from '@/components/admin/preguntas/QuestionEditModal'
import { QuestionAddForm, TrackSelector, NEON2 } from '@/components/admin/preguntas/QuestionAddForm'
import { TrackSwitchBar } from '@/components/admin/preguntas/TrackSwitchBar'
import { HierarchySwitchBar } from '@/components/admin/preguntas/HierarchySwitchBar'
import { CategoryPanel, QuestionsList } from '@/components/admin/preguntas/CategoryPanel'
import { ExplanationCoverageBanner } from '@/components/admin/preguntas/ExplanationCoverage'
import { PAGE_SIZE } from '@/components/admin/preguntas/types'

export default function PreguntasPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const isSuperAdminMode = pathname.startsWith('/superadmin/preguntas') || isSuperAdmin(user?.role)
  const isAgencia = isAdminAgencia(user?.role, user?.tenantType)

  const viewerTrackType =
    resolveUserTrackKey(user) === 'AscensosOficiales' ? 2 : DEFAULT_QUESTION_TRACK

  const allowTrackSwitch = isAgencia && !isSuperAdminMode

  const q = useAdminQuestions({
    isSuperAdminMode,
    enabled: Boolean(user),
    viewerTrackType,
    allowTrackSwitch,
  })

  const readOnly = !isSuperAdminMode

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

  const paginated = q.filtered.slice((q.page - 1) * PAGE_SIZE, q.page * PAGE_SIZE)
  const currentCat = q.categories.find((c) => c.name === q.selectedCategory)

  return (
    <div className="max-w-5xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.2s ease forwards; }
        .input-q { width:100%; padding:10px 13px; border-radius:8px; background:var(--color-input-bg); border:1px solid var(--color-surface-border); color:var(--color-text-primary); font-size:14px; outline:none; transition: border-color 0.2s; }
        .input-q:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent); }
        .input-q::placeholder { color:var(--color-text-muted); }
        select.input-q option { background:var(--color-surface-card); color:var(--color-text-primary); }
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
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-sm font-medium transition-colors"
        >
          ← {isSuperAdminMode ? 'SuperAdmin' : 'Panel Admin'}
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Banco de Preguntas de Ascenso</h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            {readOnly && isAgencia
              ? `${q.countsPending ? '…' : q.categorizedCount} preguntas en vista · jerarquía: ${hierarchyLabel(q.activeHierarchy)}`
              : `${q.countsPending ? '…' : q.categorizedCount} preguntas en vista · ${q.categories.length} categorías · ${hierarchyLabel(q.activeHierarchy)} · ${trackLabel(isSuperAdminMode ? q.activeTrackType : allowTrackSwitch ? q.activeTrackType : viewerTrackType)}`}
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
                border: `1px solid ${q.showAddForm ? 'var(--color-surface-border)' : 'rgba(74,124,89,0.25)'}`,
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
        <span className="text-xs text-[var(--color-text-muted)] self-center">
          📚 Banco global de ascenso PNP
        </span>
        <span className="text-xs text-gray-600 self-center ml-auto">{q.countsPending ? '…' : q.categorizedCount} en esta vista</span>
      </div>

      {allowTrackSwitch && (
        <TrackSwitchBar
          activeTrackType={q.activeTrackType}
          onChange={q.changeActiveTrack}
          hint="Solo lectura — Simulacros.pe gestiona el banco. Tus alumnos ven el balotario según el grado al que postulan."
        />
      )}

      {isSuperAdminMode && !readOnly && (
        <TrackSelector
          activeTrackType={q.activeTrackType}
          onChange={q.changeActiveTrack}
        />
      )}

      <HierarchySwitchBar
        activeTrackType={q.activeTrackType}
        activeHierarchy={q.activeHierarchy}
        onChange={(hierarchy) => {
          q.setActiveHierarchy(hierarchy)
          q.setPage(1)
        }}
        hint={
          readOnly
            ? 'Consulta el banco por jerarquía. Cada CSV y cada alumno debe corresponder a una sola jerarquía.'
            : 'Sube ~1500 preguntas por jerarquía. No mezcles grados ni jerarquías en un mismo CSV.'
        }
      />

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

      {q.bankScopeReady && q.uncategorizedCount > 0 && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#fbbf24',
          }}
        >
          ⚠️ {q.uncategorizedCount} preguntas de {hierarchyLabel(q.activeHierarchy)}{' '}
          no coinciden con ninguna categoría activa. Revisa el CSV o elimínalas con &quot;Eliminar todo&quot;.
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
        loading={!q.categories.length && q.loading}
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
        loading={q.listLoading}
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

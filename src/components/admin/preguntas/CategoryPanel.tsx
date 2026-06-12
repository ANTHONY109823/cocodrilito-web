'use client'

import { NEON } from '@/lib/constants/theme'
import { PRESET_COLORS, type Category, type Question } from '@/components/admin/preguntas/types'

interface CategoryPanelProps {
  categories: Category[]
  counts: Record<string, number>
  loading: boolean
  readOnly: boolean
  isSuperAdminMode: boolean
  selectedCategory: string
  uploadingCat: string | null
  showAddCategory: boolean
  newCatName: string
  newCatColor: string
  saving: boolean
  fileRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  onSelectCategory: (name: string) => void
  onToggleAddCategory: () => void
  onNewCatNameChange: (name: string) => void
  onNewCatColorChange: (color: string) => void
  onAddCategory: () => void
  onDeleteCategory: (id: string, name: string) => void
  onCSVUpload: (e: React.ChangeEvent<HTMLInputElement>, category: string) => void
}

export function CategoryPanel({
  categories,
  counts,
  loading,
  readOnly,
  isSuperAdminMode,
  selectedCategory,
  uploadingCat,
  showAddCategory,
  newCatName,
  newCatColor,
  saving,
  fileRefs,
  onSelectCategory,
  onToggleAddCategory,
  onNewCatNameChange,
  onNewCatColorChange,
  onAddCategory,
  onDeleteCategory,
  onCSVUpload,
}: CategoryPanelProps) {
  return (
    <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-gray-400 text-xs font-medium">Categorías</p>
        {(!readOnly || isSuperAdminMode) && (
          <button
            onClick={onToggleAddCategory}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: showAddCategory ? 'rgba(255,255,255,0.05)' : 'rgba(74,124,89,0.1)',
              color: showAddCategory ? '#6B7280' : NEON,
              border: `1px solid ${showAddCategory ? 'rgba(255,255,255,0.08)' : 'rgba(74,124,89,0.2)'}`,
            }}
          >
            {showAddCategory ? '✕ Cancelar' : '+ Agregar categoría'}
          </button>
        )}
      </div>

      {showAddCategory && (
        <div
          className="px-4 py-3 fade-in"
          style={{ background: 'rgba(74,124,89,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <input
              className="input-q flex-1 min-w-48"
              placeholder="Nombre de la categoría (ej. ETICA POLICIAL)"
              value={newCatName}
              onChange={(e) => onNewCatNameChange(e.target.value.toUpperCase())}
            />
            <div className="flex gap-1.5 shrink-0">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onNewCatColorChange(c)}
                  className="w-6 h-6 rounded-full transition-all"
                  style={{
                    backgroundColor: c,
                    transform: newCatColor === c ? 'scale(1.25)' : 'scale(1)',
                    boxShadow: newCatColor === c ? `0 0 8px ${c}80` : 'none',
                  }}
                />
              ))}
            </div>
            <button
              onClick={onAddCategory}
              disabled={saving || !newCatName.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`,
                color: '#000',
                opacity: saving || !newCatName.trim() ? 0.5 : 1,
              }}
            >
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
              <div
                key={cat.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderBottom: idx < categories.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  borderLeft: isSelected ? `3px solid ${cat.color}` : '3px solid transparent',
                }}
                onClick={() => onSelectCategory(cat.name)}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color, opacity: 0.8 }} />
                <span className="flex-1 text-sm" style={{ color: isSelected ? '#e5e7eb' : '#9CA3AF' }}>
                  {cat.name}
                </span>
                <span className="text-xs tabular-nums" style={{ color: count > 0 ? '#6B7280' : '#374151' }}>
                  {count} {count === 1 ? 'pregunta' : 'preguntas'}
                </span>
                {!readOnly && (
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => fileRefs.current[cat.name]?.click()}
                      disabled={isUploading}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: isUploading ? 'rgba(255,255,255,0.05)' : `${cat.color}18`,
                        color: isUploading ? '#4B5563' : cat.color,
                        border: `1px solid ${cat.color}30`,
                      }}
                    >
                      {isUploading ? '⏳ Subiendo...' : '↑ CSV'}
                    </button>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      ref={(el) => {
                        fileRefs.current[cat.name] = el
                      }}
                      onChange={(e) => onCSVUpload(e, cat.name)}
                    />
                    <button
                      onClick={() => onDeleteCategory(cat.id, cat.name)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                      style={{ backgroundColor: 'rgba(255,82,82,0.06)', color: '#ef4444' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface QuestionsListProps {
  currentCat: Category | undefined
  paginated: Question[]
  filtered: Question[]
  loading: boolean
  readOnly: boolean
  search: string
  onSearchChange: (value: string) => void
  page: number
  pageSize: number
  fileRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  onPageChange: (page: number) => void
  onEdit: (q: Question) => void
  onDelete: (id: string) => void
}

export function QuestionsList({
  currentCat,
  paginated,
  filtered,
  loading,
  readOnly,
  search,
  onSearchChange,
  page,
  pageSize,
  fileRefs,
  onPageChange,
  onEdit,
  onDelete,
}: QuestionsListProps) {
  if (!currentCat) return null

  const totalPages = Math.ceil(filtered.length / pageSize)
  const letters = ['A', 'B', 'C', 'D']

  return (
    <>
      <div className="mb-3">
        <input
          className="input-q"
          placeholder={`Buscar en ${currentCat.name}...`}
          value={search}
          onChange={(e) => {
            onSearchChange(e.target.value)
            onPageChange(1)
          }}
        />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentCat.color }} />
            <p className="text-xs text-gray-400">
              {currentCat.name} · {filtered.length} {filtered.length === 1 ? 'pregunta' : 'preguntas'}
              {search && ` · "${search}"`}
            </p>
          </div>
          {filtered.length > pageSize && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: page === 1 ? '#374151' : '#9CA3AF',
                }}
              >
                ←
              </button>
              <span className="text-xs text-gray-600">
                {page}/{totalPages}
              </span>
              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: page === totalPages ? '#374151' : '#9CA3AF',
                }}
              >
                →
              </button>
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
            {!search && !readOnly && (
              <button
                onClick={() => fileRefs.current[currentCat.name]?.click()}
                className="inline-flex px-4 py-2 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: `${currentCat.color}15`,
                  color: currentCat.color,
                  border: `1px solid ${currentCat.color}25`,
                }}
              >
                ↑ Subir CSV de {currentCat.name}
              </button>
            )}
          </div>
        ) : (
          <div>
            {paginated.map((q, i) => {
              const globalIdx = (page - 1) * pageSize + i + 1
              return (
                <div
                  key={q.id}
                  className="px-4 py-4 flex items-start gap-3 transition-colors hover:bg-white/[0.015]"
                  style={{
                    borderBottom: i < paginated.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <span className="text-xs text-gray-700 w-6 shrink-0 pt-0.5 text-right tabular-nums">
                    {globalIdx}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm leading-relaxed mb-2">{q.questionText}</p>
                    {q.answerOptions && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        {q.answerOptions
                          .sort((a, b) => a.optionIndex - b.optionIndex)
                          .map((opt, oi) => (
                            <div key={oi} className="flex items-start gap-1.5">
                              <span
                                className="text-xs font-semibold shrink-0 mt-px"
                                style={{ color: opt.isCorrect ? currentCat.color : '#4B5563' }}
                              >
                                {letters[oi]}.
                              </span>
                              <span
                                className="text-xs leading-relaxed"
                                style={{ color: opt.isCorrect ? '#d1d5db' : '#6B7280' }}
                              >
                                {opt.optionText}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => onEdit(q)}
                        className="px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                        style={{ backgroundColor: 'rgba(79,195,247,0.08)', color: '#60a5fa' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(q.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                        style={{ backgroundColor: 'rgba(255,82,82,0.08)', color: '#ef4444' }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {filtered.length > pageSize && (
          <div
            className="flex items-center justify-center gap-2 px-4 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: page === 1 ? '#374151' : '#9CA3AF',
              }}
            >
              ««
            </button>
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: page === 1 ? '#374151' : '#9CA3AF',
              }}
            >
              ← Anterior
            </button>
            <span className="text-xs text-gray-600 px-2">
              Página {page} de {totalPages} · {filtered.length} preguntas
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: page === totalPages ? '#374151' : '#9CA3AF',
              }}
            >
              Siguiente →
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: page === totalPages ? '#374151' : '#9CA3AF',
              }}
            >
              »»
            </button>
          </div>
        )}
      </div>
    </>
  )
}

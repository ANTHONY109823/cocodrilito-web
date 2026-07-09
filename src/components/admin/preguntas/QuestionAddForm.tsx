'use client'

import { ASCENSO_TRACK_OPTIONS, trackLabel } from '@/lib/constants/trackTypes'
import { NEON, primaryMix } from '@/lib/constants/theme'
import type { QuestionFormState } from '@/components/admin/preguntas/types'
import { OPTION_LETTERS } from '@/components/admin/preguntas/types'

const NEON2 = '#4FC3F7'

interface QuestionAddFormProps {
  exams: { id: string; title: string }[]
  categories: { id: string; name: string }[]
  qForm: QuestionFormState
  saving: boolean
  onChange: (form: QuestionFormState) => void
  onSubmit: (e: React.FormEvent) => void
}

export function QuestionAddForm({
  exams,
  categories,
  qForm,
  saving,
  onChange,
  onSubmit,
}: QuestionAddFormProps) {
  return (
    <div
      className="rounded-xl p-5 mb-4 fade-in"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className="text-[var(--color-text-primary)] font-medium text-sm mb-4">Nueva pregunta manual</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Examen *</label>
          <select
            className="input-q"
            value={qForm.examId}
            onChange={(e) => onChange({ ...qForm, examId: e.target.value })}
            required
          >
            <option value="">Selecciona un examen</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Pregunta *</label>
          <textarea
            className="input-q"
            rows={3}
            placeholder="Escribe la pregunta..."
            value={qForm.questionText}
            onChange={(e) => onChange({ ...qForm, questionText: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoría</label>
            <select
              className="input-q"
              value={qForm.category}
              onChange={(e) => onChange({ ...qForm, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Año</label>
            <input
              className="input-q"
              type="number"
              value={qForm.yearValuation}
              onChange={(e) => onChange({ ...qForm, yearValuation: Number(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Opciones — <span style={{ color: NEON }}>toca la letra para marcar correcta</span>
          </label>
          {qForm.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...qForm,
                    options: qForm.options.map((o, j) => ({ ...o, isCorrect: j === i })),
                  })
                }
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                style={{
                  backgroundColor: opt.isCorrect ? NEON : 'rgba(255,255,255,0.06)',
                  color: opt.isCorrect ? '#000' : '#6B7280',
                  border: `1px solid ${opt.isCorrect ? NEON : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {OPTION_LETTERS[i]}
              </button>
              <input
                className="input-q flex-1"
                placeholder={`Opción ${OPTION_LETTERS[i]}`}
                value={opt.optionText}
                onChange={(e) =>
                  onChange({
                    ...qForm,
                    options: qForm.options.map((o, j) =>
                      j === i ? { ...o, optionText: e.target.value } : o
                    ),
                  })
                }
                required
              />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Explicación (opcional)</label>
          <textarea
            className="input-q"
            rows={2}
            placeholder="¿Por qué es correcta?"
            value={qForm.explanation}
            onChange={(e) => onChange({ ...qForm, explanation: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`,
            color: 'var(--color-text-primary)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Guardando...' : 'Guardar pregunta'}
        </button>
      </form>
    </div>
  )
}

interface TrackSelectorProps {
  activeTrackType: number
  onChange: (track: number) => void
}

export function TrackSelector({ activeTrackType, onChange }: TrackSelectorProps) {
  return (
    <div
      className="rounded-2xl p-4 mb-5 space-y-3"
      style={{ background: 'var(--color-surface-card)', border: `1px solid ${primaryMix(25)}` }}
    >
      <div
        className="rounded-xl px-3 py-2 text-xs text-gray-400"
        style={{ background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.15)' }}
      >
        <strong className="text-gray-300">Importación solo CSV</strong> — un archivo por categoría (botón ↑ CSV).
        Balotarios: <span className="text-gray-300">Suboficiales</span> y{' '}
        <span className="text-gray-300">Oficiales</span> por separado. No uses Excel (.xlsx). Si editas en Excel,
        guarda como <span className="text-gray-300">CSV UTF-8</span>.
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[var(--color-text-primary)] font-semibold text-sm mb-1">Balotario de preguntas</div>
          <p className="text-xs text-gray-500">
            Elige el balotario y verás o subirás preguntas del mismo. Capacidad hasta 3000 por balotario.
          </p>
        </div>
        <div className="w-full md:max-w-xs">
          <label className="block text-xs text-gray-500 mb-1.5">Balotario activo</label>
          <select
            className="input-admin select-dark"
            value={activeTrackType}
            onChange={(e) => onChange(Number(e.target.value))}
          >
            {ASCENSO_TRACK_OPTIONS.map((track) => (
              <option key={track.value} value={track.value}>
                {track.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export { trackLabel, NEON2 }

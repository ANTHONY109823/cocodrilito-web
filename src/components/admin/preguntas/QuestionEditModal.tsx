'use client'

import { Button, Input, Modal } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

export interface EditableQuestion {
  id: string
  questionText: string
  category: string
  yearValuation: number
  explanation?: string | null
  answerOptions?: {
    id: string
    optionText: string
    isCorrect: boolean
    optionIndex: number
  }[]
}

interface QuestionEditModalProps {
  question: EditableQuestion
  categories: { id: string; name: string }[]
  saving: boolean
  onClose: () => void
  onChange: (question: EditableQuestion) => void
  onSave: () => void
}

const letters = ['A', 'B', 'C', 'D']

export function QuestionEditModal({
  question,
  categories,
  saving,
  onClose,
  onChange,
  onSave,
}: QuestionEditModalProps) {
  return (
    <Modal open={true} title="Editar pregunta" onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-[#6B8A75]">Texto de la pregunta</label>
          <textarea
            className="w-full rounded-lg border border-[rgba(189,255,223,0.18)] bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#318F48]"
            rows={4}
            value={question.questionText}
            onChange={(e) => onChange({ ...question, questionText: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-[#6B8A75]">Categoría</label>
            <select
              className="w-full rounded-lg border border-[rgba(189,255,223,0.18)] bg-[#0D1A10] px-3 py-2 text-sm text-white outline-none focus:border-[#318F48]"
              value={question.category}
              onChange={(e) => onChange({ ...question, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-[#6B8A75]">Año</label>
            <Input
              type="number"
              value={String(question.yearValuation)}
              onChange={(e) =>
                onChange({ ...question, yearValuation: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-[#6B8A75]">
            Explicación oficial (normativa, doctrina o criterio PNP)
          </label>
          <textarea
            className="w-full rounded-lg border border-[rgba(189,255,223,0.18)] bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#318F48]"
            rows={4}
            placeholder="Ej: Art. 166 Constitución — La PNP garantiza el orden interno..."
            value={question.explanation ?? ''}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          />
          <p className="mt-1 text-[11px] text-[#6B8A75]">
            Usa texto curado y verificable. Para marcar revisión pendiente escribe [REVISAR] al inicio.
          </p>
        </div>

        {question.answerOptions && (
          <div>
            <label className="mb-2 block text-xs text-[#6B8A75]">
              Opciones — <span className="text-[#318F48]">toca la letra para marcar correcta</span>
            </label>
            {question.answerOptions
              .sort((a, b) => a.optionIndex - b.optionIndex)
              .map((opt, i) => (
                <div key={opt.id ?? i} className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...question,
                        answerOptions: question.answerOptions!.map((o, j) => ({
                          ...o,
                          isCorrect: j === i,
                        })),
                      })
                    }
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all',
                      opt.isCorrect
                        ? 'border border-[#318F48] bg-[#318F48] text-black'
                        : 'border border-[rgba(189,255,223,0.12)] bg-white/5 text-[#6B8A75]'
                    )}
                  >
                    {letters[i]}
                  </button>
                  <Input
                    className="flex-1"
                    value={opt.optionText}
                    onChange={(e) =>
                      onChange({
                        ...question,
                        answerOptions: question.answerOptions!.map((o, j) =>
                          j === i ? { ...o, optionText: e.target.value } : o
                        ),
                      })
                    }
                  />
                </div>
              ))}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" size="md" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" fullWidth loading={saving} onClick={onSave}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </Modal>
  )
}

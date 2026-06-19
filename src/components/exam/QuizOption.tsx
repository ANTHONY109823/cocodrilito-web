'use client'

import { cn } from '@/lib/utils/cn'

export type QuizOptionVariant = 'neutral' | 'selected' | 'correct' | 'wrong'

const rowClass: Record<QuizOptionVariant, string> = {
  neutral: 'quiz-option-row--neutral',
  selected: 'quiz-option-row--selected',
  correct: 'quiz-option-row--correct',
  wrong: 'quiz-option-row--wrong',
}

const badgeClass: Record<QuizOptionVariant, string> = {
  neutral: 'quiz-option-badge--neutral',
  selected: 'quiz-option-badge--selected',
  correct: 'quiz-option-badge--correct',
  wrong: 'quiz-option-badge--wrong',
}

export interface QuizOptionProps {
  letter: string
  text: string
  variant?: QuizOptionVariant
  tag?: string | null
  onClick?: () => void
  className?: string
  compact?: boolean
}

export function QuizOption({
  letter,
  text,
  variant = 'neutral',
  tag = null,
  onClick,
  className,
  compact = false,
}: QuizOptionProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'quiz-option-row',
        rowClass[variant],
        compact && 'quiz-option-row--compact',
        onClick && 'quiz-option-row--interactive',
        className
      )}
    >
      <span className={cn('quiz-option-badge', badgeClass[variant])}>{letter}</span>
      <span className="quiz-option-text">{text}</span>
      {tag ? (
        <span
          className={cn(
            'quiz-option-tag',
            variant === 'correct' && 'quiz-option-tag--correct',
            variant === 'wrong' && 'quiz-option-tag--wrong'
          )}
        >
          {tag}
        </span>
      ) : null}
    </Tag>
  )
}

export interface Question {
  id: string
  questionText: string
  category: string
  difficulty: number
  status: string
  yearValuation: number
  trackType?: string | null
  tenantId?: string | null
  answerOptions?: {
    id: string
    optionText: string
    isCorrect: boolean
    optionIndex: number
  }[]
}

export interface Category {
  id: string
  name: string
  color: string
  orderIndex: number
}

export interface QuestionFormState {
  examId: string
  questionText: string
  category: string
  yearValuation: number
  orderIndex: number
  explanation: string
  options: {
    optionText: string
    isCorrect: boolean
    optionIndex: number
  }[]
}

export const PRESET_COLORS = [
  '#4FC3F7', '#A78BFA', '#F59E0B', '#EF4444',
  '#10B981', '#F472B6', '#60A5FA', '#34D399',
  '#FB923C', '#818CF8',
]

export const PAGE_SIZE = 50
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const

export const EMPTY_QUESTION_FORM: QuestionFormState = {
  examId: '',
  questionText: '',
  category: '',
  yearValuation: 2025,
  orderIndex: 1,
  explanation: '',
  options: [
    { optionText: '', isCorrect: true, optionIndex: 0 },
    { optionText: '', isCorrect: false, optionIndex: 1 },
    { optionText: '', isCorrect: false, optionIndex: 2 },
    { optionText: '', isCorrect: false, optionIndex: 3 },
  ],
}

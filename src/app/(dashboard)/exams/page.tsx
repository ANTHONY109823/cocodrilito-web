'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { examsApi } from '@/lib/api/exams'
import apiClient from '@/lib/api/client'

interface Exam {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  timeLimitSeconds: number
  passingScore: number
  isPremium: boolean
  yearValuation: number
}

const difficultyColors: Record<string, string> = {
  Basic: '#1D9E75',
  Intermediate: '#EF9F27',
  Advanced: '#D85A30',
}

const difficultyLabels: Record<string, string> = {
  Basic: 'Básico',
  Intermediate: 'Intermedio',
  Advanced: 'Avanzado',
}

export default function ExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      const res = await apiClient.get('/exams/list')
      setExams(res.data)
    } catch {
      setExams([{
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Examen de Doctrina PNP 2025',
        description: 'Examen oficial de doctrina policial',
        category: 'DOCTRINA',
        difficulty: 'Basic',
        timeLimitSeconds: 3600,
        passingScore: 70,
        isPremium: false,
        yearValuation: 2025,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (examId: string) => {
    setStarting(examId)
    try {
      const res = await examsApi.start(examId)
      const sessionId = res.data.sessionId
      router.push(`/exam/${sessionId}?examId=${examId}`)
    } catch {
      alert('Error al iniciar el examen. Intenta de nuevo.')
    } finally {
      setStarting(null)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Simulacros disponibles</h1>
        <p className="text-gray-400 mt-1">
          Elige un examen y demuestra que no eres fósil 🐊
        </p>
      </div>

      {loading ? (
        <div className="text-gray-400">Cargando exámenes...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="card flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: '#1A2E24', color: '#1D9E75' }}>
                    {exam.category}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: difficultyColors[exam.difficulty] + '22',
                      color: difficultyColors[exam.difficulty]
                    }}>
                    {difficultyLabels[exam.difficulty] || exam.difficulty}
                  </span>
                </div>

                <h3 className="text-white font-semibold mb-2">{exam.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{exam.description}</p>

                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                  <span>⏱ {Math.round(exam.timeLimitSeconds / 60)} min</span>
                  <span>✅ Aprueba con {exam.passingScore}%</span>
                  <span>📅 {exam.yearValuation}</span>
                </div>
              </div>

              <button
                onClick={() => handleStart(exam.id)}
                disabled={starting === exam.id}
                className="btn-primary"
                style={{ marginTop: 'auto' }}>
                {starting === exam.id ? 'Iniciando...' : 'Iniciar simulacro'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
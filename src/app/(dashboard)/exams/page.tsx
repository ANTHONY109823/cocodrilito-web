'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { examsApi } from '@/lib/api/exams'
import Link from 'next/link'

const NEON = '#00C87A'
const GOLD = '#FFD700'
const BLUE = '#4FC3F7'

interface Exam {
  id: string
  title: string
  description: string
  category: string
  difficulty: number
  timeLimitSeconds: number
  passingScore: number
  yearValuation: number
  isPremium: boolean
  totalQuestions?: number
}

const difficultyLabel = (d: number) => {
  if (d === 1) return { label: 'Básico', color: NEON }
  if (d === 2) return { label: 'Intermedio', color: GOLD }
  return { label: 'Avanzado', color: '#FF5252' }
}

export default function ExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      const res = await apiClient.get('/exams/list')
      setExams(res.data)
    } catch (err: any) {
      if (err.response?.status === 403) {
        setBlocked(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (examId: string) => {
    setStarting(examId)
    try {
      const res = await examsApi.start(examId)
      router.push(`/exam/${res.data.sessionId}`)
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push('/premium?blocked=1')
      }
    } finally {
      setStarting(null)
    }
  }

  if (blocked) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-white mb-3">Acceso restringido</h2>
        <p className="text-gray-400 text-sm mb-6">Necesitas un plan activo para acceder a los simulacros.</p>
        <Link href="/premium?blocked=1"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: `linear-gradient(135deg, ${NEON}, #009A5E)`, color: '#000' }}>
          Ver planes →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .exam-card:hover { transform: translateY(-2px); }
        .exam-card { transition: all 0.2s ease; }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard"
          className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-1">
          ← Inicio
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Simulacros disponibles</h1>
          <p className="text-gray-500 text-sm mt-0.5">Elige un examen y demuestra que no eres fósil 🐊</p>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl h-48 animate-pulse"
              style={{ backgroundColor: 'rgba(0,8,4,0.6)' }} />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(0,8,4,0.8)', border: `1px solid ${NEON}15` }}>
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-white font-bold mb-2">Próximamente</h3>
          <p className="text-gray-500 text-sm">El banco de preguntas se cargará cuando se publique el balotario oficial en junio.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 fade-in">
          {exams.map(exam => {
            const diff = difficultyLabel(exam.difficulty)
            const mins = Math.floor(exam.timeLimitSeconds / 60)
            const isStarting = starting === exam.id
            return (
              <div key={exam.id} className="exam-card rounded-2xl p-5"
                style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${NEON}15` }}>
                {/* BADGES */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: `${NEON}15`, color: NEON }}>
                    {exam.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${diff.color}15`, color: diff.color }}>
                    {diff.label}
                  </span>
                  {exam.isPremium && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
                      ⭐ Premium
                    </span>
                  )}
                </div>

                <h3 className="text-white font-bold text-base mb-1">{exam.title}</h3>
                <p className="text-gray-500 text-xs mb-4">{exam.description}</p>

                {/* STATS */}
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                  <span>⏱ {mins} min</span>
                  <span>✅ Aprueba con {exam.passingScore}%</span>
                  <span>📅 {exam.yearValuation}</span>
                </div>

                <button onClick={() => handleStart(exam.id)} disabled={isStarting}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{
                    background: isStarting ? 'rgba(0,200,122,0.3)' : `linear-gradient(135deg, ${NEON}, #009A5E)`,
                    color: '#000',
                    boxShadow: isStarting ? 'none' : `0 0 15px ${NEON}30`
                  }}>
                  {isStarting ? 'Iniciando...' : 'Iniciar simulacro →'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
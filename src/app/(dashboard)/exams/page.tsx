'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { examsApi } from '@/lib/api/exams'
import Link from 'next/link'

const NEON = '#00C87A'
const SIMULACRO_SIZE = 100

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
}

interface Category {
  id: string
  name: string
  color: string
  orderIndex: number
}

export default function ExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({})
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [examsRes, catsRes, countsRes] = await Promise.all([
        apiClient.get('/exams/list'),
        apiClient.get('/categories'),
        examsApi.getQuestionCounts(),
      ])
      const examsData = Array.isArray(examsRes.data) ? examsRes.data : examsRes.data?.items || []
      const catsData = Array.isArray(catsRes.data) ? catsRes.data : []
      const byCategory = countsRes.data?.byCategory || []
      const total = countsRes.data?.total ?? 0

      const counts: Record<string, number> = {}
      byCategory.forEach((row: { category: string; count: number }) => {
        counts[row.category] = row.count
      })

      setExams(examsData)
      setCategories(catsData)
      setTotalQuestions(total)
      setQuestionCounts(counts)
    } catch (err: any) {
      if (err.response?.status === 403) setBlocked(true)
    } finally { setLoading(false) }
  }

  const handleStartSimulacro = async (examId: string) => {
    setStarting('completo')
    try {
      const res = await examsApi.start(examId, { mode: 'simulacro' })
      router.push(`/exam/${res.data.sessionId}`)
    } catch (err: any) {
      if (err.response?.status === 403) router.push('/premium?blocked=1')
    } finally { setStarting(null) }
  }

  const handleStartCategory = async (examId: string, categoryName: string) => {
    setStarting(categoryName)
    try {
      const res = await examsApi.start(examId, { mode: 'categoria', category: categoryName })
      router.push(`/exam/${res.data.sessionId}`)
    } catch (err: any) {
      if (err.response?.status === 403) router.push('/premium?blocked=1')
    } finally { setStarting(null) }
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

  const mainExam = exams[0]
  const simulacroCount = Math.min(SIMULACRO_SIZE, totalQuestions)

  return (
    <div className="max-w-4xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .exam-card { transition: all 0.2s ease; }
        .exam-card:hover { transform: translateY(-2px); }
      `}</style>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors">
          ← Inicio
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Simulacros</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {totalQuestions} preguntas en el banco · Simulacro oficial de {simulacroCount} preguntas
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="rounded-2xl h-40 animate-pulse" style={{ backgroundColor: 'rgba(0,8,4,0.6)' }} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ backgroundColor: 'rgba(0,8,4,0.6)' }} />
            ))}
          </div>
        </div>
      ) : !mainExam ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(0,8,4,0.8)', border: `1px solid ${NEON}15` }}>
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-white font-bold mb-2">Próximamente</h3>
          <p className="text-gray-500 text-sm">El banco se cargará con el balotario oficial en junio.</p>
        </div>
      ) : (
        <div className="space-y-4 fade-in">

          <div className="exam-card rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,30,18,0.95), rgba(0,15,8,0.95))',
              border: `2px solid ${NEON}30`,
              boxShadow: `0 0 30px ${NEON}10`
            }}>
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏆</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{ backgroundColor: `${NEON}20`, color: NEON }}>
                      SIMULACRO COMPLETO
                    </span>
                  </div>
                  <h2 className="text-white font-bold text-xl mb-1">{mainExam.title}</h2>
                  <p className="text-gray-400 text-sm mb-3">
                    {simulacroCount} preguntas aleatorias mezcladas por categoría
                    (como el examen real: bloques de cada tema)
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span>⏱ {Math.floor(mainExam.timeLimitSeconds / 60)} min</span>
                    <span>✅ Aprueba con {mainExam.passingScore}%</span>
                    <span>🎲 Orden aleatorio</span>
                    <span>📊 Banco: {totalQuestions} preguntas</span>
                  </div>
                </div>
                <button
                  onClick={() => handleStartSimulacro(mainExam.id)}
                  disabled={starting === 'completo' || simulacroCount === 0}
                  className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 shrink-0"
                  style={{
                    background: simulacroCount === 0 ? 'rgba(0,200,122,0.2)' : `linear-gradient(135deg, ${NEON}, #009A5E)`,
                    color: simulacroCount === 0 ? '#374151' : '#000',
                    boxShadow: simulacroCount > 0 ? `0 0 20px ${NEON}40` : 'none'
                  }}>
                  {starting === 'completo' ? 'Iniciando...' : simulacroCount === 0 ? 'Sin preguntas' : `Iniciar ${simulacroCount} preguntas →`}
                </button>
              </div>
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Repaso por categoría</p>
              <p className="text-gray-600 text-xs mb-3">Todas las preguntas de la categoría, en orden</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(cat => {
                  const count = questionCounts[cat.name] || 0
                  const isStarting = starting === cat.name
                  return (
                    <div key={cat.id}
                      className="exam-card rounded-xl p-4 flex flex-col justify-between"
                      style={{
                        background: 'rgba(0,8,4,0.9)',
                        border: `1px solid ${cat.color}20`,
                      }}>
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color, opacity: 0.8 }} />
                          <span className="text-xs font-semibold" style={{ color: cat.color }}>
                            {cat.name}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs">
                          {count === 0
                            ? 'Sin preguntas aún'
                            : `Repaso completo · ${count} pregunta${count !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartCategory(mainExam.id, cat.name)}
                        disabled={isStarting || count === 0}
                        className="w-full py-2 rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor: count === 0 ? 'rgba(255,255,255,0.04)' : `${cat.color}18`,
                          color: count === 0 ? '#374151' : cat.color,
                          border: `1px solid ${count === 0 ? 'rgba(255,255,255,0.06)' : cat.color + '30'}`,
                          cursor: count === 0 ? 'not-allowed' : 'pointer'
                        }}>
                        {isStarting ? 'Iniciando...' : count === 0 ? 'Próximamente' : `Repasar ${count} →`}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

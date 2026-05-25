'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { examsApi } from '@/lib/api/exams'
import { saveExamSessionMeta } from '@/lib/examSession'
import Link from 'next/link'

import { NEON } from '@/lib/constants/theme'
const SIMULACRO_SIZE = 100

interface Exam {
  id: string
  title: string
  timeLimitSeconds: number
  passingScore: number
}

interface Category {
  id: string
  name: string
  color: string
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [examsRes, catsRes, countsRes] = await Promise.all([
        apiClient.get('/exams/list'),
        apiClient.get('/categories'),
        examsApi.getQuestionCounts(),
      ])

      const examsData = (Array.isArray(examsRes.data) ? examsRes.data : []).map((e: Exam & { Id?: string }) => ({
        ...e,
        id: e.id || (e as { Id?: string }).Id || '',
      }))
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
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
      if (ax.response?.status === 403) {
        setBlocked(true)
      } else {
        setError(ax.response?.data?.message || ax.message || 'Error al cargar simulacros')
      }
    } finally {
      setLoading(false)
    }
  }

  const startExam = async (
    examId: string,
    label: string,
    options?: { mode?: string; category?: string }
  ) => {
    if (!examId) {
      setError('No hay examen configurado en el servidor.')
      return
    }
    setStarting(label)
    setError(null)
    try {
      const res = await examsApi.start(examId, options)
      const sessionId = res.data?.sessionId ?? res.data?.SessionId
      if (!sessionId) {
        setError('El servidor no devolvió un ID de sesión. ¿Migración pendiente en Railway?')
        return
      }
      saveExamSessionMeta(sessionId, res.data ?? {}, options?.category)
      router.push(`/exam/${sessionId}`)
    } catch (err: unknown) {
      const ax = err as {
        response?: { status?: number; data?: { message?: string; code?: string } }
        message?: string
      }
      const status = ax.response?.status
      const msg = ax.response?.data?.message || ax.message || 'Error al iniciar'

      if (status === 403 || ax.response?.data?.code === 'NO_ACTIVE_SUBSCRIPTION') {
        router.push('/premium?blocked=1')
        return
      }
      setError(status ? `[${status}] ${msg}` : msg)
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
          style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000' }}>
          Ver planes →
        </Link>
      </div>
    )
  }

  const mainExam = exams[0]
  const simulacroCount = Math.min(SIMULACRO_SIZE, totalQuestions)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors">
          ← Inicio
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Simulacros</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {totalQuestions} preguntas en el banco · Simulacro de {simulacroCount} preguntas
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-center py-12">Cargando...</div>
      ) : !mainExam?.id ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(0,8,4,0.8)', border: `1px solid ${NEON}15` }}>
          <p className="text-gray-500 text-sm">No hay examen activo en la base de datos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(0,30,18,0.95), rgba(0,15,8,0.95))',
              border: `2px solid ${NEON}30`,
            }}>
            <h2 className="text-white font-bold text-xl mb-1">{mainExam.title || 'Examen General PNP'}</h2>
            <p className="text-gray-400 text-sm mb-3">
              {simulacroCount} preguntas aleatorias mezcladas por categoría (como examen real)
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 flex-wrap">
              <span>⏱ {Math.floor((mainExam.timeLimitSeconds || 3600) / 60)} min</span>
              <span>✅ Aprueba con {mainExam.passingScore || 70}%</span>
              <span>🎲 Orden aleatorio</span>
            </div>
            <button
              type="button"
              onClick={() => startExam(mainExam.id, 'completo', { mode: 'simulacro' })}
              disabled={!!starting || simulacroCount === 0}
              className="px-8 py-3 rounded-xl font-bold text-sm"
              style={{
                background: simulacroCount === 0 ? 'rgba(74,124,89,0.2)' : `linear-gradient(135deg, ${NEON}, #2D5A3D)`,
                color: simulacroCount === 0 ? '#374151' : '#000',
                opacity: starting ? 0.7 : 1,
              }}>
              {starting === 'completo' ? 'Iniciando...' : `Iniciar ${simulacroCount} preguntas →`}
            </button>
          </div>

          {categories.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Repaso por categoría</p>
              <p className="text-gray-600 text-xs mb-3">Todas las preguntas de la categoría</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(cat => {
                  const count = questionCounts[cat.name] || 0
                  return (
                    <div key={cat.id} className="rounded-xl p-4 flex flex-col justify-between"
                      style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${cat.color}20` }}>
                      <div className="mb-3">
                        <span className="text-xs font-semibold" style={{ color: cat.color }}>{cat.name}</span>
                        <p className="text-gray-500 text-xs mt-1">
                          {count === 0 ? 'Sin preguntas' : `Repaso completo · ${count} preguntas`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startExam(mainExam.id, cat.name, { mode: 'categoria', category: cat.name })}
                        disabled={!!starting || count === 0}
                        className="w-full py-2 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: count === 0 ? 'rgba(255,255,255,0.04)' : `${cat.color}18`,
                          color: count === 0 ? '#374151' : cat.color,
                          border: `1px solid ${count === 0 ? 'rgba(255,255,255,0.06)' : cat.color + '30'}`,
                          opacity: starting ? 0.7 : 1,
                        }}>
                        {starting === cat.name ? 'Iniciando...' : count === 0 ? 'Próximamente' : 'Iniciar simulacro →'}
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

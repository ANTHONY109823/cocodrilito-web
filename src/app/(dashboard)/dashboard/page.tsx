'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { gamificationApi } from '@/lib/api/gamification'
import Link from 'next/link'

interface GamificationStatus {
  currentLeague: string
  totalXp: number
  currentStreakDays: number
  fossilRiskScore: number
  examsCompleted: number
  badges: string[]
}

const leagueColors: Record<string, string> = {
  'Cocodrilo Élite': '#EF9F27',
  'Cocodrilo Veterano': '#1D9E75',
  'Cocodrilo Activo': '#378ADD',
  'Lagarto': '#6B8E6B',
  'Tortuga': '#8B7355',
  'Fósil en Peligro': '#D85A30',
}

export default function DashboardPage() {
  const { user, loadFromStorage } = useAuthStore()
  const [gami, setGami] = useState<GamificationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFromStorage()
    loadGamification()
  }, [])

  const loadGamification = async () => {
    try {
      const res = await gamificationApi.getMyStatus()
      setGami(res.data)
    } catch {
      console.error('Error cargando gamificación')
    } finally {
      setLoading(false)
    }
  }

  const leagueColor = gami ? (leagueColors[gami.currentLeague] || '#888') : '#888'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          ¡Bienvenido, {user?.fullName?.split(' ')[0] || user?.fullName}
        </h1>
        <p className="text-gray-400 mt-1">
          {user?.rank} — {user?.unit}
        </p>
      </div>

      {loading ? (
        <div className="text-gray-400">Cargando tu perfil...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card text-center">
              <div className="text-3xl font-bold" style={{ color: leagueColor }}>
                {gami?.currentLeague || 'Sin liga'}
              </div>
              <div className="text-gray-500 text-sm mt-1">Liga actual</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {gami?.totalXp || 0}
              </div>
              <div className="text-gray-500 text-sm mt-1">XP total</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-blue-400">
                {gami?.currentStreakDays || 0}🔥
              </div>
              <div className="text-gray-500 text-sm mt-1">Días de racha</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-green-400">
                {gami?.examsCompleted || 0}
              </div>
              <div className="text-gray-500 text-sm mt-1">Exámenes hechos</div>
            </div>
          </div>

          {gami && gami.fossilRiskScore > 40 && (
            <div className="mb-6 p-4 rounded-xl border"
              style={{ backgroundColor: '#2A1010', borderColor: '#D85A30' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">☠️</span>
                <div>
                  <div className="text-red-400 font-semibold">
                    ¡Alerta Anti-Fósil! Riesgo: {gami.fossilRiskScore}/100
                  </div>
                  <div className="text-red-500 text-sm">
                    Estás perdiendo tu liga. ¡Haz un examen ahora!
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h3 className="text-white font-semibold mb-4">Acciones rápidas</h3>
              <div className="space-y-3">
                <Link href="/exams"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-2xl">📝</span>
                  <div>
                    <div className="text-white font-medium">Iniciar simulacro</div>
                    <div className="text-gray-500 text-sm">Practica con preguntas reales</div>
                  </div>
                </Link>
                <Link href="/ranking"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-white font-medium">Ver ranking</div>
                    <div className="text-gray-500 text-sm">¿Dónde estás en la tabla?</div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="card">
              <h3 className="text-white font-semibold mb-4">Mis logros</h3>
              {gami?.badges && gami.badges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {gami.badges.map((badge, i) => (
                    <span key={i}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: '#1A2E24', color: '#1D9E75' }}>
                      🏆 {badge}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Completa exámenes para desbloquear badges
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold">Plan actual: {user?.planType}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {user?.planType === 'Free'
                    ? 'Actualiza a Premium para acceso ilimitado'
                    : 'Tienes acceso completo a todos los exámenes'}
                </p>
              </div>
              {user?.planType === 'Free' && (
                <Link href="/premium"
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: '#EF9F27', color: '#000' }}>
                  Ir Premium
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
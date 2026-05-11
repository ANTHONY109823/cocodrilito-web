'use client'

import { useEffect, useState } from 'react'
import { gamificationApi } from '@/lib/api/gamification'
import { useAuthStore } from '@/lib/store/authStore'

interface RankingEntry {
  position: number
  userId: string
  fullName: string
  rank: string
  unit: string
  averageScore: number
  examsCompleted: number
  bestScore: number
}

interface MyRanking {
  position: number
  averageScore: number
  examsCompleted: number
  bestScore: number
}

export default function RankingPage() {
  const { user, loadFromStorage } = useAuthStore()
  const [entries, setEntries] = useState<RankingEntry[]>([])
  const [myRanking, setMyRanking] = useState<MyRanking | null>(null)
  const [period, setPeriod] = useState('alltime')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadFromStorage()
  }, [])
  
  useEffect(() => {
    if (user) {
      loadRanking()
    }
  }, [period, user])

  const loadRanking = async () => {
    setLoading(true)
    try {
      const [globalRes, myRes] = await Promise.all([
        gamificationApi.getGlobalRanking(period),
        gamificationApi.getMyRanking(period),
      ])
      setEntries(globalRes.data.entries)
      setMyRanking(myRes.data)
    } catch {
      console.error('Error cargando ranking')
    } finally {
      setLoading(false)
    }
  }

  const medalEmoji = (pos: number) =>
    pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`

  const periods = [
    { value: 'weekly', label: 'Esta semana' },
    { value: 'monthly', label: 'Este mes' },
    { value: 'alltime', label: 'Histórico' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Ranking 🏆</h1>
        <p className="text-gray-400 mt-1">¿Eres cocodrilo o fósil?</p>
      </div>

      {/* Mi posición */}
      {myRanking && (
        <div className="card mb-6" style={{ borderColor: '#1D9E75' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold" style={{ color: '#1D9E75' }}>
                {medalEmoji(myRanking.position)}
              </div>
              <div>
                <div className="text-white font-semibold">{user?.fullName}</div>
                <div className="text-gray-400 text-sm">{user?.rank} — {user?.unit}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-xl font-bold text-white">{myRanking.averageScore}%</div>
                <div className="text-gray-500 text-xs">Promedio</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{myRanking.examsCompleted}</div>
                <div className="text-gray-500 text-xs">Exámenes</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{myRanking.bestScore}%</div>
                <div className="text-gray-500 text-xs">Mejor</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtro de período */}
      <div className="flex gap-2 mb-6">
        {periods.map((p) => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: period === p.value ? '#1D9E75' : '#1A2E24',
              color: period === p.value ? '#fff' : '#9CA3AF',
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Tabla de ranking */}
      {loading ? (
        <div className="text-gray-400">Cargando ranking...</div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🦴</div>
          <p className="text-gray-400">No hay datos para este período.</p>
          <p className="text-gray-500 text-sm mt-1">¡Sé el primero en hacer un examen!</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1A2E24' }}>
                <th className="text-left p-4 text-gray-500 text-sm font-medium">#</th>
                <th className="text-left p-4 text-gray-500 text-sm font-medium">Efectivo</th>
                <th className="text-right p-4 text-gray-500 text-sm font-medium">Promedio</th>
                <th className="text-right p-4 text-gray-500 text-sm font-medium">Exámenes</th>
                <th className="text-right p-4 text-gray-500 text-sm font-medium">Mejor</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isMe = entry.userId === user?.id
                return (
                  <tr key={entry.userId}
                    style={{
                      borderBottom: '1px solid #1A2E24',
                      backgroundColor: isMe ? '#1A2E24' : 'transparent',
                    }}>
                    <td className="p-4 text-lg font-bold" style={{
                      color: entry.position <= 3 ? '#EF9F27' : '#6B7280'
                    }}>
                      {medalEmoji(entry.position)}
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium flex items-center gap-2">
                        {entry.fullName}
                        {isMe && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#1D9E75', color: '#fff' }}>
                            tú
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs">{entry.rank}</div>
                    </td>
                    <td className="p-4 text-right font-bold"
                      style={{ color: entry.averageScore >= 70 ? '#1D9E75' : '#D85A30' }}>
                      {entry.averageScore}%
                    </td>
                    <td className="p-4 text-right text-gray-400">{entry.examsCompleted}</td>
                    <td className="p-4 text-right text-white font-medium">{entry.bestScore}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
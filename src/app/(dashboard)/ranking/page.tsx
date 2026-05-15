'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'

const NEON = '#00C87A'
const GOLD = '#FFD700'
const SILVER = '#C0C0C0'
const BRONZE = '#CD7F32'

interface RankingEntry {
  position: number
  userId: string
  fullName: string
  rank: string
  unit: string
  totalXp: number
  examsCompleted: number
  currentLeague: string
  correctAnswers: number
}

interface MyRanking {
  position: number
  totalXp: number
  currentLeague: string
  correctAnswers: number
}

const leagueEmoji: Record<string, string> = {
  'Cola Cortada': '🏆',
  'Creo que nos cortan la cola': '✂️',
  'Lagartito': '🦎',
  'Cocodrilito': '🐊',
  'Dinosaurio': '🦕',
}

const medalColor = (pos: number) => {
  if (pos === 1) return GOLD
  if (pos === 2) return SILVER
  if (pos === 3) return BRONZE
  return '#4B5563'
}

export default function RankingPage() {
  const { user } = useAuthStore()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [myRanking, setMyRanking] = useState<MyRanking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
  }, [])

  const loadRanking = async () => {
    try {
      const [globalRes, myRes] = await Promise.all([
        apiClient.get('/rankings/global'),
        apiClient.get('/rankings/me'),
      ])
      const globalData = Array.isArray(globalRes.data)
        ? globalRes.data
        : globalRes.data?.items || globalRes.data?.data || []
      setRanking(globalData)
      setMyRanking(myRes.data)
    } catch { } finally { setLoading(false) }
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .rank-row { transition: all 0.2s; }
        .rank-row:hover { transform: translateX(4px); }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard"
          className="text-gray-500 hover:text-white text-sm transition-colors">
          ← Inicio
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Ranking PNP 🏆</h1>
          <p className="text-gray-500 text-sm mt-0.5">Los mejores efectivos del simulacro</p>
        </div>
      </div>

      {/* MI POSICIÓN */}
      {myRanking && (
        <div className="rounded-2xl p-4 mb-4 fade-in"
          style={{
            background: 'rgba(0,200,122,0.06)',
            border: `1px solid ${NEON}25`,
            boxShadow: `0 0 20px ${NEON}10`
          }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: `${NEON}20`, color: NEON }}>
                #{myRanking.position}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Tu posición</div>
                <div className="text-gray-500 text-xs">{user?.fullName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold" style={{ color: NEON }}>
                {leagueEmoji[myRanking.currentLeague]} {myRanking.currentLeague}
              </div>
              <div className="text-gray-500 text-xs">{myRanking.correctAnswers} correctas</div>
            </div>
          </div>
        </div>
      )}

      {/* TOP 3 */}
      {!loading && ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-4 fade-in">
          {[ranking[1], ranking[0], ranking[2]].map((entry, i) => {
            if (!entry) return null
            const actualPos = i === 0 ? 2 : i === 1 ? 1 : 3
            const color = medalColor(actualPos)
            const size = actualPos === 1 ? 'py-6' : 'py-4'
            return (
              <div key={entry.userId}
                className={`rounded-2xl p-3 ${size} text-center`}
                style={{
                  background: `rgba(${actualPos === 1 ? '255,215,0' : actualPos === 2 ? '192,192,192' : '205,127,50'},0.06)`,
                  border: `1px solid ${color}25`
                }}>
                <div className="text-2xl mb-1">
                  {actualPos === 1 ? '🥇' : actualPos === 2 ? '🥈' : '🥉'}
                </div>
                <div className="text-white font-bold text-xs truncate">
                  {entry.fullName.split(' ')[0]}
                </div>
                <div className="text-xs mt-0.5" style={{ color }}>{entry.correctAnswers} ✓</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {leagueEmoji[entry.currentLeague]}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* LISTA COMPLETA */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 rounded-2xl animate-pulse"
              style={{ backgroundColor: 'rgba(0,8,4,0.6)' }} />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-12 rounded-2xl"
          style={{ background: 'rgba(0,8,4,0.8)', border: `1px solid ${NEON}15` }}>
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-gray-500 text-sm">Sé el primero en el ranking</p>
          <Link href="/exams"
            className="inline-block mt-4 px-5 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: NEON, color: '#000' }}>
            Hacer simulacro →
          </Link>
        </div>
      ) : (
        <div className="space-y-2 fade-in">
          {ranking.map((entry, i) => {
            const isMe = entry.userId === user?.id
            const color = medalColor(entry.position)
            return (
              <div key={entry.userId}
                className="rank-row rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: isMe ? 'rgba(0,200,122,0.06)' : 'rgba(0,5,2,0.8)',
                  border: `1px solid ${isMe ? NEON : '#ffffff08'}${isMe ? '30' : ''}`,
                }}>
                {/* POSICIÓN */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                  style={{
                    backgroundColor: entry.position <= 3 ? `${color}20` : '#ffffff08',
                    color: entry.position <= 3 ? color : '#6B7280'
                  }}>
                  {entry.position <= 3
                    ? (entry.position === 1 ? '🥇' : entry.position === 2 ? '🥈' : '🥉')
                    : `#${entry.position}`}
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm truncate">
                      {entry.fullName}
                      {isMe && <span className="text-xs ml-1" style={{ color: NEON }}>(tú)</span>}
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs truncate">
                    {entry.rank} · {entry.unit}
                  </div>
                </div>

                {/* STATS */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold" style={{ color: NEON }}>
                    {entry.correctAnswers} ✓
                  </div>
                  <div className="text-xs text-gray-600">
                    {leagueEmoji[entry.currentLeague]} {entry.currentLeague}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
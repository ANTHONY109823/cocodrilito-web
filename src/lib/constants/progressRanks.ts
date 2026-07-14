export type ProgressRankName = 'Bronce' | 'Plata' | 'Oro' | 'Diamante' | 'Leyenda'

export const PROGRESS_RANKS: {
  name: ProgressRankName
  threshold: number
  emoji: string
}[] = [
  { name: 'Bronce', threshold: 0, emoji: '🥉' },
  { name: 'Plata', threshold: 250, emoji: '🥈' },
  { name: 'Oro', threshold: 600, emoji: '🥇' },
  { name: 'Diamante', threshold: 1000, emoji: '💎' },
  { name: 'Leyenda', threshold: 1500, emoji: '👑' },
]

export const MAX_PROGRESS_POINTS = 1500

export function rankEmoji(rank?: string | null): string {
  const found = PROGRESS_RANKS.find(
    (r) => r.name.toLowerCase() === (rank ?? '').toLowerCase()
  )
  return found?.emoji ?? '🥉'
}

export function formatProgressPoints(n: number): string {
  return `${Math.max(0, n).toLocaleString('es-PE')} pts`
}

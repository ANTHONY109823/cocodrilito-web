import { PROGRESS_RANKS, rankEmoji, type ProgressRankName } from '@/lib/constants/progressRanks'

/** @deprecated usar rankEmoji / PROGRESS_RANKS — se mantiene por compatibilidad. */
export const leagueEmoji: Record<string, string> = Object.fromEntries(
  PROGRESS_RANKS.map((r) => [r.name, r.emoji])
)

/** Resuelve rango por puntos (cliente). Preferir currentRank del API. */
export function getLeague(progressPoints: number): ProgressRankName {
  let rank: ProgressRankName = 'Bronce'
  for (const r of PROGRESS_RANKS) {
    if (progressPoints >= r.threshold) rank = r.name
    else break
  }
  return rank
}

export { rankEmoji }

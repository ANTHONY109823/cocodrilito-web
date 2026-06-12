export const leagueEmoji: Record<string, string> = {
  'Cola Cortada': '🏆',
  'Creo que nos cortan la cola': '✂️',
  Lagartito: '🦎',
  Cocodrilito: '🐊',
  Dinosaurio: '🦕',
}

/** Liga gamificada según respuestas correctas acumuladas (aprox. por mejor puntaje). */
export function getLeague(correctOrScore: number): string {
  if (correctOrScore >= 100) return 'Cola Cortada'
  if (correctOrScore >= 75) return 'Creo que nos cortan la cola'
  if (correctOrScore >= 50) return 'Lagartito'
  if (correctOrScore >= 25) return 'Cocodrilito'
  return 'Dinosaurio'
}

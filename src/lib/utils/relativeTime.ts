const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function formatRelativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Sin acceso registrado'

  const then = new Date(isoDate).getTime()
  if (Number.isNaN(then)) return 'Fecha inválida'

  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - then) / 1000))

  if (diffSec < MINUTE) return 'hace un momento'
  if (diffSec < 2 * MINUTE) return 'hace 1 minuto'
  if (diffSec < HOUR) return `hace ${Math.floor(diffSec / MINUTE)} minutos`

  if (diffSec < 2 * HOUR) return 'hace 1 hora'
  if (diffSec < DAY) return `hace ${Math.floor(diffSec / HOUR)} horas`

  const diffDays = Math.floor(diffSec / DAY)
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`

  return new Date(isoDate).toLocaleString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: diffDays > 365 ? 'numeric' : undefined,
  })
}

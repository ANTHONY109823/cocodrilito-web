/** Partículas con valores estables (sin Math.random en render). */
export type FloatingParticle = {
  id: number
  width: string
  height: string
  left: string
  top: string
  backgroundColor: string
  animation: string
  animationDelay: string
}

const COLORS = ['#318F48', '#4FC3F7', '#FFD700'] as const

function pseudo(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  const frac = x - Math.floor(x)
  return min + frac * (max - min)
}

export function createFloatingParticles(count: number): FloatingParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    width: `${pseudo(i, 2, 6)}px`,
    height: `${pseudo(i + 1, 2, 6)}px`,
    left: `${pseudo(i + 2, 0, 100)}%`,
    top: `${pseudo(i + 3, 0, 100)}%`,
    backgroundColor: COLORS[i % 3],
    animation: `float ${pseudo(i + 4, 4, 10)}s ease-in-out infinite`,
    animationDelay: `${pseudo(i + 5, 0, 4)}s`,
  }))
}

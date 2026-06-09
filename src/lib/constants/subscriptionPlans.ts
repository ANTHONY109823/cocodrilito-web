/** Precios fijos — proceso de ascenso de suboficiales (30 / 60 / 180 días). */
export const SUBSCRIPTION_PLANS = [
  { days: 30, label: 'Mensual', price: 15, sub: '30 días' },
  { days: 60, label: 'Bimestral', price: 30, sub: '60 días' },
  { days: 180, label: 'Full Proceso', price: 45, sub: '180 días' },
] as const

export function getPriceForDays(days: number): number {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.days === days)
  return plan?.price ?? 45
}

export function inferDaysFromAmount(amount: number): number {
  if (amount <= 15) return 30
  if (amount <= 30) return 60
  return 180
}

export function formatPlanPrice(price: number): string {
  return `S/. ${price.toFixed(2)}`
}

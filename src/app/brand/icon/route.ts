import { resolveTenantIconResponse } from '@/lib/tenant/resolveTenantIconResponse'

export const revalidate = 600

/** Icono dinámico por tenant (fuera de app/icon para evitar favicon.ico estático de Next). */
export async function GET() {
  return resolveTenantIconResponse()
}

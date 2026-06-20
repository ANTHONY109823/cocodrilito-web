import { resolveTenantIconResponse } from '@/lib/tenant/resolveTenantIconResponse'

export const revalidate = 600

export async function GET() {
  return resolveTenantIconResponse()
}

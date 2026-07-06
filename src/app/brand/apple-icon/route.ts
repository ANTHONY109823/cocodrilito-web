import { resolveTenantAppleIconResponse } from '@/lib/tenant/resolveTenantIconResponse'

export const revalidate = 86400

export async function GET() {
  return resolveTenantAppleIconResponse()
}

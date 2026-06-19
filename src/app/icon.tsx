import { resolveTenantIconResponse } from '@/lib/tenant/resolveTenantIconResponse'

export const revalidate = 600

export default async function Icon() {
  return resolveTenantIconResponse()
}

import { resolveTenantIconResponse } from '@/lib/tenant/resolveTenantIconResponse'

export const revalidate = 600

export default function Icon() {
  return resolveTenantIconResponse()
}

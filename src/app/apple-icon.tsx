import { resolveTenantIconResponse } from '@/lib/tenant/resolveTenantIconResponse'

export const revalidate = 600

export default function AppleIcon() {
  return resolveTenantIconResponse()
}

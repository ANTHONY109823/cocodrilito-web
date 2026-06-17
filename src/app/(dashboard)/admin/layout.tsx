'use client'

import { useAuthStore } from '@/lib/store/authStore'
import { getTenantBadge } from '@/lib/auth/roles'
import { INFO, infoMix } from '@/lib/constants/theme'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const badge = getTenantBadge(user?.role)

  return (
    <div>
      {(badge || user?.tenantName) && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {badge && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full tracking-wide"
              style={{
                backgroundColor: infoMix(20),
                color: INFO,
                border: `1px solid ${infoMix(40)}`,
              }}
            >
              {badge}
            </span>
          )}
          {user?.tenantName && (
            <span className="text-sm font-medium text-gray-400">{user.tenantName}</span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

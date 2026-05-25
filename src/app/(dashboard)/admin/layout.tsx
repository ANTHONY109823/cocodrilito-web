'use client'

import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { getTenantBadge } from '@/lib/auth/roles'
import { NEON, INFO, WARNING, policeGreenRgba } from '@/lib/constants/theme'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const badge = getTenantBadge(user?.role, user?.tenantType)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {badge && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full tracking-wide"
              style={{
                backgroundColor: badge === 'AGENCIA' ? `${INFO}20` : `${WARNING}20`,
                color: badge === 'AGENCIA' ? INFO : WARNING,
                border: `1px solid ${badge === 'AGENCIA' ? INFO : WARNING}40`,
              }}
            >
              {badge}
            </span>
          )}
          {user?.tenantName && (
            <span className="text-sm text-gray-500">{user.tenantName}</span>
          )}
        </div>
        <Link href="/admin/preguntas" className="text-xs" style={{ color: NEON }}>
          Banco de preguntas →
        </Link>
      </div>
      {children}
    </div>
  )
}

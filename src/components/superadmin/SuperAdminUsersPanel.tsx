'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { superadminApi } from '@/lib/api/superadmin'
import { SkeletonTable } from '@/components/Skeleton'
import { DANGER, NEON, SURFACE_BORDER, WARNING, policeGreenRgba } from '@/lib/constants/theme'

export interface SuperAdminUserRow {
  id: string
  fullName: string
  email: string
  dni: string
  role: string
  rank?: string | null
  unit?: string | null
  planType?: string
  tenantId?: string | null
  tenantName?: string | null
  tenantSlug?: string | null
  isActive: boolean
  createdAt: string
  subscription?: { expiresAt: string; startsAt?: string } | null
}

const ROLE_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: 'Student', label: 'Alumnos' },
  { value: 'AdminAgencia', label: 'Admin agencia' },
  { value: 'AdminAcademia', label: 'Admin agencia (legacy)' },
  { value: 'SuperAdmin', label: 'SuperAdmin' },
]

function roleLabel(role: string): string {
  switch (role) {
    case 'Student': return 'Alumno'
    case 'AdminAgencia': return 'Admin agencia'
    case 'AdminAcademia': return 'Admin agencia'
    case 'SuperAdmin': return 'SuperAdmin'
    default: return role
  }
}

function roleColor(role: string): string {
  if (role === 'Student') return NEON
  if (role.startsWith('Admin')) return WARNING
  return '#9CA3AF'
}

interface SuperAdminUsersPanelProps {
  tenantId?: string
  tenantName?: string
  compact?: boolean
}

export function SuperAdminUsersPanel({ tenantId, tenantName, compact }: SuperAdminUsersPanelProps) {
  const [users, setUsers] = useState<SuperAdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const pageSize = compact ? 20 : 50

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      if (tenantId) {
        const res = await superadminApi.getTenantUsers(tenantId)
        let list = (res.data as SuperAdminUserRow[]) ?? []
        if (roleFilter) list = list.filter((u) => u.role === roleFilter)
        if (search) {
          const term = search.toLowerCase()
          list = list.filter((u) =>
            u.fullName.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            (u.dni ?? '').includes(term))
        }
        setUsers(list)
        setTotal(list.length)
      } else {
        const res = await superadminApi.getUsers(page, pageSize, {
          role: roleFilter || undefined,
          search: search || undefined,
        })
        const data = res.data as { users: SuperAdminUserRow[]; total: number }
        setUsers(data.users ?? [])
        setTotal(data.total ?? 0)
      }
    } catch {
      setUsers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, tenantId, roleFilter, search])

  useEffect(() => { void loadUsers() }, [loadUsers])

  useEffect(() => { setPage(1) }, [roleFilter, search, tenantId])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'var(--color-surface-card)', border: `1px solid ${SURFACE_BORDER}` }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-semibold">
            {tenantName ? `Usuarios de ${tenantName}` : 'Todos los usuarios de la plataforma'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {total} cuenta{total !== 1 ? 's' : ''} — alumnos, admins y más
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
            <select
              className="input-admin text-xs"
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>{o.label}</option>
              ))}
            </select>
            {!compact && (
              <>
                <input
                  className="input-admin text-xs min-w-[200px]"
                  style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
                  placeholder="Buscar nombre, email o DNI…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput.trim()) }}
                />
                <button type="button" onClick={() => setSearch(searchInput.trim())}
                  className="px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: policeGreenRgba(0.15), color: NEON, border: `1px solid ${policeGreenRgba(0.3)}` }}>
                  Buscar
                </button>
              </>
            )}
          </div>
      </div>

      {loading ? (
        <SkeletonTable rows={compact ? 3 : 6} />
      ) : users.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No hay usuarios que coincidan</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-xl px-4 py-3 flex flex-wrap items-start justify-between gap-3"
              style={{ background: 'rgba(0,5,2,0.5)', border: `1px solid ${policeGreenRgba(0.12)}` }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-medium text-sm">{u.fullName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${roleColor(u.role)}18`, color: roleColor(u.role) }}>
                    {roleLabel(u.role)}
                  </span>
                  {!u.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${DANGER}20`, color: DANGER }}>
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {u.email} · DNI {u.dni || '—'}
                  {u.rank ? ` · ${u.rank}` : ''}
                  {u.unit ? ` · ${u.unit}` : ''}
                </div>
                {u.subscription && (
                  <div className="text-xs mt-1" style={{ color: NEON }}>
                    Plan activo hasta {new Date(u.subscription.expiresAt).toLocaleDateString('es-PE')}
                  </div>
                )}
                {!tenantId && u.tenantName && u.tenantId && (
                  <div className="text-xs mt-1">
                    <Link href={`/superadmin/tenants/${u.tenantId}`}
                      className="hover:underline" style={{ color: NEON }}>
                      {u.tenantName}
                      {u.tenantSlug ? ` (${u.tenantSlug})` : ''}
                    </Link>
                  </div>
                )}
                <div className="text-[10px] text-gray-600 mt-0.5">
                  Alta: {new Date(u.createdAt).toLocaleString('es-PE')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!tenantId && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}>
            ← Anterior
          </button>
          <span className="text-xs text-gray-500">{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, normalizeUser } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { isSuperAdmin } from '@/lib/auth/roles'
import {
  superadminApi,
  type DashboardStats,
  type TenantSummary,
} from '@/lib/api/superadmin'
import { SkeletonCard, SkeletonTable } from '@/components/Skeleton'
import { toast } from '@/components/Toast'
import {
  NEON,
  INFO,
  WARNING,
  DANGER,
  SURFACE_BORDER,
  policeGreenRgba,
} from '@/lib/constants/theme'

type TabKey =
  | 'overview'
  | 'agencias'
  | 'academias'
  | 'users'
  | 'questions'
  | 'payments'
  | 'audit'

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  details?: string | null
  createdAt: string
}

interface PlatformUser {
  id: string
  fullName: string
  email: string
  dni: string
  role: string
  tenantId?: string | null
  isActive: boolean
  createdAt: string
}

export default function SuperAdminPage() {
  const router = useRouter()
  const { user, loadFromStorage, setUser } = useAuthStore()
  const { startImpersonation } = useImpersonationStore()

  const [tab, setTab] = useState<TabKey>('overview')
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [newTenant, setNewTenant] = useState({
    name: '',
    slug: '',
    tenantType: 'Academia',
    contactEmail: '',
    monthlyFee: 0,
  })

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  useEffect(() => {
    if (user && !isSuperAdmin(user.role)) {
      router.push('/dashboard')
    }
  }, [user, router])

  const loadTabData = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'overview' || tab === 'payments') {
        const res = await superadminApi.getDashboard()
        setDashboard(res.data)
      }
      if (['overview', 'agencias', 'academias', 'payments'].includes(tab)) {
        const res = await superadminApi.getTenants()
        setTenants(res.data)
      }
      if (tab === 'users') {
        const res = await superadminApi.getUsers()
        setUsers((res.data as { users: PlatformUser[] }).users ?? [])
      }
      if (tab === 'audit') {
        const res = await superadminApi.getAuditLog()
        setAuditLogs((res.data as { logs: AuditLogEntry[] }).logs ?? [])
      }
    } catch {
      toast('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    if (!user || !isSuperAdmin(user.role)) return
    void loadTabData()
  }, [user, tab, loadTabData])

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await superadminApi.createTenant(newTenant)
      toast('Tenant creado correctamente', 'success')
      setShowCreate(false)
      setNewTenant({ name: '', slug: '', tenantType: 'Academia', contactEmail: '', monthlyFee: 0 })
      loadTabData()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Error al crear tenant', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleImpersonate = async (tenant: TenantSummary) => {
    try {
      await superadminApi.impersonateTenant(tenant.id)
      startImpersonation({
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantType: tenant.tenantType,
      })
      if (user) {
        setUser(normalizeUser({
          ...user,
          role: tenant.tenantType === 'Agencia' ? 'AdminAgencia' : 'AdminAcademia',
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantType: tenant.tenantType,
        }))
      }
      toast(`Impersonando ${tenant.name}`, 'info')
      router.push('/admin')
    } catch {
      toast('No se pudo impersonar el tenant', 'error')
    }
  }

  const agencias = tenants.filter((t) => t.tenantType === 'Agencia')
  const academias = tenants.filter((t) => t.tenantType === 'Academia')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '📊 Vista General' },
    { key: 'agencias', label: '🏢 Agencias' },
    { key: 'academias', label: '🎓 Academias' },
    { key: 'users', label: '👥 Usuarios' },
    { key: 'questions', label: '📝 Preguntas' },
    { key: 'payments', label: '💳 Pagos' },
    { key: 'audit', label: '📋 Audit Log' },
  ]

  const statCard = (label: string, value: string | number, color = NEON) => (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${SURFACE_BORDER}` }}
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  )

  const tenantList = (list: TenantSummary[]) => {
    if (loading) return <SkeletonTable rows={4} />
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 rounded-2xl"
          style={{ border: `1px solid ${SURFACE_BORDER}` }}>
          No hay tenants en esta categoría
        </div>
      )
    }
    return (
      <div className="space-y-3">
        {list.map((t) => (
          <div key={t.id} className="rounded-2xl p-4 flex flex-wrap items-center gap-3 justify-between"
            style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${policeGreenRgba(0.2)}` }}>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-semibold">{t.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: policeGreenRgba(0.15), color: NEON }}>
                  {t.tenantType}
                </span>
                {!t.isActive || t.suspended ? (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${DANGER}20`, color: DANGER }}>
                    {t.suspended ? 'Suspendido' : 'Inactivo'}
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t.slug} · {t.students} alumnos · {t.examsCompleted} exámenes · S/. {t.monthlyFee}/mes
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href={`/superadmin/tenants/${t.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: policeGreenRgba(0.12), color: NEON, border: `1px solid ${policeGreenRgba(0.25)}` }}>
                Detalle
              </Link>
              <button type="button" onClick={() => handleImpersonate(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: `${WARNING}15`, color: WARNING, border: `1px solid ${WARNING}30` }}>
                🎭 Impersonar
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Panel SuperAdmin ⚡</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión global de la plataforma Cocodrilito</p>
        </div>
        <button type="button" onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: '#000' }}>
          ➕ Nuevo tenant
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateTenant} className="rounded-2xl p-5 mb-6 space-y-4"
          style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${NEON}25` }}>
          <h2 className="text-white font-bold">Crear tenant</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'Nombre', type: 'text' },
              { key: 'slug', label: 'Slug (opcional)', type: 'text' },
              { key: 'contactEmail', label: 'Email contacto', type: 'email' },
              { key: 'monthlyFee', label: 'Cuota mensual (S/.)', type: 'number' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                  style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
                  type={f.type}
                  value={(newTenant as Record<string, string | number>)[f.key]}
                  onChange={(e) => setNewTenant({
                    ...newTenant,
                    [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                  })}
                  required={f.key !== 'slug'}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
                value={newTenant.tenantType}
                onChange={(e) => setNewTenant({ ...newTenant, tenantType: e.target.value })}
              >
                <option value="Agencia">Agencia</option>
                <option value="Academia">Academia</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={creating}
            className="px-6 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: NEON, color: '#000', opacity: creating ? 0.7 : 1 }}>
            {creating ? 'Creando...' : 'Crear tenant'}
          </button>
        </form>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className="px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t.key ? NEON : 'rgba(0,10,5,0.8)',
              color: tab === t.key ? '#000' : '#9CA3AF',
              border: `1px solid ${tab === t.key ? NEON : '#ffffff10'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        loading && !dashboard ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : dashboard ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statCard('Tenants totales', dashboard.totalTenants)}
              {statCard('Tenants activos', dashboard.activeTenants, INFO)}
              {statCard('Estudiantes', dashboard.totalStudents)}
              {statCard('Exámenes hoy', dashboard.totalExamsToday, WARNING)}
              {statCard('Exámenes del mes', dashboard.totalExamsThisMonth)}
              {statCard('Pagos pendientes', dashboard.pendingPayments, DANGER)}
              {statCard('Ingreso mensual', `S/. ${dashboard.monthlyRevenue}`, WARNING)}
              {statCard('Agencias activas', `${dashboard.agencias.active}/${dashboard.agencias.total}`)}
            </div>
            {dashboard.topTenantsByActivity?.length > 0 && (
              <div className="rounded-2xl p-4"
                style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${SURFACE_BORDER}` }}>
                <h3 className="text-white font-semibold mb-3">Top tenants por actividad</h3>
                <div className="space-y-2">
                  {dashboard.topTenantsByActivity.map((t, i) => (
                    <div key={t.tenantId} className="flex justify-between text-sm">
                      <span className="text-gray-300">{i + 1}. {t.tenantName}</span>
                      <span style={{ color: NEON }}>{t.examsCompleted} exámenes</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null
      )}

      {tab === 'agencias' && tenantList(agencias)}
      {tab === 'academias' && tenantList(academias)}

      {tab === 'users' && (
        loading ? <SkeletonTable /> : (
          <div className="overflow-x-auto rounded-2xl"
            style={{ border: `1px solid ${SURFACE_BORDER}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(0,10,5,0.9)' }}>
                  {['Nombre', 'Email', 'Rol', 'Estado', 'Registro'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderTop: `1px solid ${SURFACE_BORDER}` }}>
                    <td className="px-4 py-3 text-white">{u.fullName}</td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    <td className="px-4 py-3"><span style={{ color: NEON }}>{u.role}</span></td>
                    <td className="px-4 py-3">{u.isActive ? '✅ Activo' : '⛔ Inactivo'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('es-PE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'questions' && (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${SURFACE_BORDER}` }}>
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-white font-bold text-lg mb-2">Banco global de preguntas</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Las preguntas base son compartidas por todos los tenants. Los admins de tenant pueden
            agregar preguntas propias desde su panel.
          </p>
          <Link href="/admin/preguntas"
            className="inline-flex px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: '#000' }}>
            Ir al banco de preguntas →
          </Link>
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-4">
          {dashboard && (
            <div className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: `${WARNING}10`, border: `1px solid ${WARNING}30` }}>
              <span className="text-3xl">💳</span>
              <div>
                <p className="text-white font-semibold">{dashboard.pendingPayments} pagos pendientes</p>
                <p className="text-gray-500 text-sm">Ingreso mensual estimado: S/. {dashboard.monthlyRevenue}</p>
              </div>
            </div>
          )}
          <p className="text-gray-500 text-sm">
            Registra pagos desde el detalle de cada tenant. Tenants con cuota mensual:
          </p>
          {tenantList(tenants.filter((t) => t.monthlyFee > 0))}
        </div>
      )}

      {tab === 'audit' && (
        loading ? <SkeletonTable /> : (
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Sin registros de auditoría</p>
            ) : auditLogs.map((log) => (
              <div key={log.id} className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${SURFACE_BORDER}` }}>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-bold" style={{ color: INFO }}>{log.action}</span>
                  <span className="text-gray-500">{log.entityType} · {log.entityId}</span>
                  <span className="text-gray-600 text-xs ml-auto">
                    {new Date(log.createdAt).toLocaleString('es-PE')}
                  </span>
                </div>
                {log.details && <p className="text-gray-400 text-xs mt-1">{log.details}</p>}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

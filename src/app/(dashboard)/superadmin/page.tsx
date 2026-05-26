'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, normalizeUser } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { isSuperAdmin } from '@/lib/auth/roles'
import {
  superadminApi,
  type DashboardStats,
  type TenantSummary,
} from '@/lib/api/superadmin'
import { SkeletonTable } from '@/components/Skeleton'
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
  | 'agencias'
  | 'academias'
  | 'aprobaciones'
  | 'audit'

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  details?: string | null
  description?: string | null
  userFullName?: string | null
  createdAt: string
}

interface PendingSubscription {
  id: string
  userFullName?: string
  userEmail?: string
  tenantName?: string
  amountPaid: number
  paymentMethod: string
  paymentReference: string
  createdAt: string
}

export default function SuperAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loadFromStorage, setUser } = useAuthStore()
  const { startImpersonation } = useImpersonationStore()

  const tabParam = searchParams.get('tab') as TabKey | null
  const tab: TabKey = tabParam && ['agencias', 'academias', 'aprobaciones', 'audit'].includes(tabParam)
    ? tabParam
    : 'agencias'

  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [pendingSubs, setPendingSubs] = useState<PendingSubscription[]>([])
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
      if (['agencias', 'academias'].includes(tab)) {
        const res = await superadminApi.getTenants()
        setTenants(res.data)
      }
      if (tab === 'aprobaciones') {
        const [dashRes, subsRes] = await Promise.all([
          superadminApi.getDashboard(),
          superadminApi.getPendingSubscriptions(),
        ])
        setDashboard(dashRes.data)
        setPendingSubs(subsRes.data as PendingSubscription[])
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
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { message?: string; detail?: string } } }
      const detail = ax.response?.data?.detail
      toast(
        ax.response?.data?.message ||
          (ax.response?.status === 500
            ? `Error del servidor${detail ? `: ${detail}` : ''}`
            : 'No se pudo ingresar como agencia'),
        'error'
      )
    }
  }

  const handleDeleteTenant = async (tenant: TenantSummary) => {
    if (!confirm(`¿Desactivar la ${tenant.tenantType.toLowerCase()} "${tenant.name}"?`)) return
    try {
      await superadminApi.deleteTenant(tenant.id)
      toast(`${tenant.name} desactivada`, 'success')
      loadTabData()
    } catch {
      toast('No se pudo eliminar', 'error')
    }
  }

  const agencias = tenants.filter((t) => t.tenantType === 'Agencia')
  const academias = tenants.filter((t) => t.tenantType === 'Academia')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'agencias', label: '🏢 Agencias' },
    { key: 'academias', label: '🎓 Academias' },
    { key: 'aprobaciones', label: '💳 Aprobaciones' },
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
                {t.slug} · {t.students} usuarios · {t.examsCompleted} exámenes
                {t.contactPhone ? ` · ${t.contactPhone}` : ''}
                {t.monthlyFee > 0 ? ` · S/. ${t.monthlyFee}/mes` : ''}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">{t.contactEmail}</div>
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
                Ingresar como agencia
              </button>
              <button type="button" onClick={() => handleDeleteTenant(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: `${DANGER}12`, color: DANGER, border: `1px solid ${DANGER}25` }}>
                Eliminar
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
          <Link key={t.key} href={`/superadmin?tab=${t.key}`}
            className="px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t.key ? NEON : 'rgba(0,10,5,0.8)',
              color: tab === t.key ? '#000' : '#9CA3AF',
              border: `1px solid ${tab === t.key ? NEON : '#ffffff10'}`,
            }}>
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'agencias' && tenantList(agencias)}
      {tab === 'academias' && tenantList(academias)}

      {tab === 'aprobaciones' && (
        <div className="space-y-4">
          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {statCard('Pagos tenants pendientes', dashboard.pendingPayments, DANGER)}
              {statCard('Suscripciones pendientes', pendingSubs.length, WARNING)}
              {statCard('Ingreso mensual est.', `S/. ${dashboard.monthlyRevenue}`, INFO)}
            </div>
          )}
          {loading ? <SkeletonTable /> : pendingSubs.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No hay aprobaciones pendientes</p>
          ) : (
            pendingSubs.map((sub) => (
              <div key={sub.id} className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${SURFACE_BORDER}` }}>
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="text-white font-semibold">{sub.userFullName ?? 'Usuario'}</div>
                    <div className="text-gray-500 text-xs">{sub.userEmail} · {sub.tenantName ?? 'Sin tenant'}</div>
                    <div className="text-xs mt-1" style={{ color: WARNING }}>
                      S/. {sub.amountPaid} · {sub.paymentMethod} · Ref: {sub.paymentReference || '—'}
                    </div>
                  </div>
                  <div className="text-gray-600 text-xs self-center">
                    {new Date(sub.createdAt).toLocaleString('es-PE')}
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Las aprobaciones por tenant se gestionan desde el panel de cada agencia/academia (impersonar).
                </p>
              </div>
            ))
          )}
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
                  <span className="text-gray-500">{log.userFullName}</span>
                  <span className="text-gray-600 text-xs ml-auto">
                    {new Date(log.createdAt).toLocaleString('es-PE')}
                  </span>
                </div>
                <p className="text-gray-300 text-xs mt-1">{log.description ?? log.details}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

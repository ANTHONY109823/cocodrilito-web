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
import { getApiErrorMessage } from '@/lib/api/errors'
import { Modal, Button } from '@/components/ui'
import { CredentialsModal, type AdminCredentials } from '@/components/admin/CredentialsModal'
import { CreateTenantPanel, type CreateTenantFormState } from '@/components/superadmin/CreateTenantPanel'
import { TenantAccessUrl } from '@/components/tenant/TenantAccessUrl'
import {
  NEON,
  INFO,
  WARNING,
  DANGER,
  SURFACE_BORDER,
  policeGreenRgba,
} from '@/lib/constants/theme'

type TabKey =
  | 'inicio'
  | 'agencias'
  | 'academias'
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

export default function SuperAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loadFromStorage, setUser } = useAuthStore()
  const { startImpersonation } = useImpersonationStore()

  const tabParam = searchParams.get('tab') as TabKey | null
  const tab: TabKey = tabParam && ['inicio', 'agencias', 'academias', 'audit'].includes(tabParam)
    ? tabParam
    : 'inicio'

  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createType, setCreateType] = useState<'Agencia' | 'Academia'>('Agencia')
  const [creating, setCreating] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<AdminCredentials | null>(null)
  const [pendingAction, setPendingAction] = useState<
    { tenant: TenantSummary; kind: 'delete' | 'suspend' } | null
  >(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  useEffect(() => {
    if (user && !isSuperAdmin(user.role)) {
      router.push('/dashboard')
    }
  }, [user, router])

  const loadTabData = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'inicio') {
        const [dashRes, tenantsRes] = await Promise.all([
          superadminApi.getDashboard(),
          superadminApi.getTenants(),
        ])
        setDashboard(dashRes.data)
        setTenants(tenantsRes.data)
      }
      if (['agencias', 'academias'].includes(tab)) {
        const res = await superadminApi.getTenants()
        setTenants(res.data)
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

  const handleCreateTenant = async (data: CreateTenantFormState) => {
    setCreating(true)
    try {
      const res = await superadminApi.createTenant(data)
      const payload = res.data as {
        tenant?: { name?: string }
        admin?: {
          fullName: string
          email: string
          dni: string
          role: string
          temporaryPassword: string
        }
      }
      setShowCreate(false)
      if (payload.admin) {
        setCreatedCredentials({
          tenantName: payload.tenant?.name ?? data.name,
          fullName: payload.admin.fullName,
          email: payload.admin.email,
          dni: payload.admin.dni,
          role: payload.admin.role,
          temporaryPassword: payload.admin.temporaryPassword,
        })
      }
      toast('Institución y administrador creados correctamente', 'success')
      loadTabData()
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Error al crear tenant')
      toast(msg, 'error')
      throw err
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

  const handleReactivate = async (tenant: TenantSummary) => {
    try {
      await superadminApi.reactivateTenant(tenant.id)
      toast(`${tenant.name} reactivada`, 'success')
      loadTabData()
    } catch {
      toast('No se pudo reactivar', 'error')
    }
  }

  const confirmPendingAction = async () => {
    if (!pendingAction) return
    const { tenant, kind } = pendingAction
    setActionLoading(true)
    try {
      if (kind === 'delete') {
        await superadminApi.deleteTenant(tenant.id)
        toast(`${tenant.name} eliminada`, 'success')
      } else {
        await superadminApi.suspendTenant(tenant.id, suspendReason || 'Sin motivo especificado')
        toast(`${tenant.name} suspendida`, 'success')
      }
      setPendingAction(null)
      setSuspendReason('')
      setDeleteConfirmText('')
      loadTabData()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'No se pudo completar la acción', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const openCreate = (type: 'Agencia' | 'Academia') => {
    setCreateType(type)
    setShowCreate(true)
  }

  const agencias = tenants.filter((t) => t.tenantType === 'Agencia')
  const academias = tenants.filter((t) => t.tenantType === 'Academia')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'inicio', label: '🏠 Inicio' },
    { key: 'agencias', label: '🏢 Agencias' },
    { key: 'academias', label: '🎓 Academias' },
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
                    {t.suspended ? 'SUSPENDIDO' : 'Inactivo'}
                  </span>
                ) : null}
                {t.isExpired ? (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${DANGER}20`, color: DANGER }}>
                    EXPIRADO
                  </span>
                ) : t.accessExpiresAt ? (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: policeGreenRgba(0.15), color: NEON }}>
                    Vigente
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t.slug} · {t.students} usuarios · {t.examsCompleted} exámenes
                {t.contactPhone ? ` · ${t.contactPhone}` : ''}
                {t.monthlyFee > 0 ? ` · S/. ${t.monthlyFee}/mes` : ''}
              </div>
              {t.accessExpiresAt ? (
                <div className="text-xs mt-0.5" style={{ color: t.isExpired ? DANGER : '#6B8A75' }}>
                  Vigencia: {t.accessStartsAt ? new Date(t.accessStartsAt).toLocaleDateString('es-PE') : '—'}
                  {' → '}
                  {new Date(t.accessExpiresAt).toLocaleDateString('es-PE')}
                </div>
              ) : null}
              <TenantAccessUrl slug={t.slug} compact />
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
                Ingresar
              </button>
              {t.suspended || !t.isActive ? (
                <button type="button" onClick={() => handleReactivate(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: policeGreenRgba(0.12), color: NEON, border: `1px solid ${policeGreenRgba(0.25)}` }}>
                  Reactivar
                </button>
              ) : (
                <button type="button" onClick={() => { setSuspendReason(''); setPendingAction({ tenant: t, kind: 'suspend' }) }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: `${WARNING}12`, color: WARNING, border: `1px solid ${WARNING}25` }}>
                  Suspender
                </button>
              )}
              <button type="button" onClick={() => { setDeleteConfirmText(''); setPendingAction({ tenant: t, kind: 'delete' }) }}
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Panel SuperAdmin ⚡</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gestión global de la plataforma Simulacros.pe</p>
      </div>

      <CreateTenantPanel
        open={showCreate}
        loading={creating}
        defaultTenantType={createType}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateTenant}
      />

      <CredentialsModal
        open={createdCredentials != null}
        credentials={createdCredentials}
        onClose={() => setCreatedCredentials(null)}
      />

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

      {tab === 'inicio' && (
        loading ? <SkeletonTable rows={4} /> : dashboard ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statCard('Instituciones', dashboard.totalTenants)}
              {statCard('Activas', dashboard.activeTenants, INFO)}
              {statCard('Estudiantes', dashboard.totalStudents, NEON)}
              {statCard('Ingreso mensual est.', `S/. ${dashboard.monthlyRevenue}`, WARNING)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statCard('Agencias', `${dashboard.agencias.active}/${dashboard.agencias.total}`)}
              {statCard('Academias', `${dashboard.academias.active}/${dashboard.academias.total}`)}
              {statCard('Exámenes hoy', dashboard.totalExamsToday, INFO)}
              {statCard('Exámenes del mes', dashboard.totalExamsThisMonth, INFO)}
            </div>
            {dashboard.pendingPayments > 0 && (
              <div className="rounded-2xl p-4 text-sm"
                style={{ background: `${DANGER}10`, border: `1px solid ${DANGER}30`, color: DANGER }}>
                ⚠️ {dashboard.pendingPayments} pago(s) de instituciones pendiente(s) de regularizar.
              </div>
            )}
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${SURFACE_BORDER}` }}>
              <h3 className="text-white font-semibold mb-3">Instituciones más activas</h3>
              {dashboard.topTenantsByActivity.length === 0 ? (
                <p className="text-gray-500 text-sm">Aún no hay actividad registrada.</p>
              ) : (
                <div className="space-y-2">
                  {dashboard.topTenantsByActivity.map((t) => (
                    <div key={t.tenantId} className="flex justify-between text-sm py-1.5"
                      style={{ borderBottom: `1px solid ${policeGreenRgba(0.1)}` }}>
                      <span className="text-gray-300">{t.tenantName}</span>
                      <span style={{ color: NEON }}>{t.examsCompleted} exámenes</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">No se pudieron cargar las métricas</p>
        )
      )}

      {tab === 'agencias' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => openCreate('Agencia')}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: '#000' }}>
              ➕ Nueva agencia
            </button>
          </div>
          {tenantList(agencias)}
        </div>
      )}

      {tab === 'academias' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => openCreate('Academia')}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: '#000' }}>
              ➕ Nueva academia
            </button>
          </div>
          {tenantList(academias)}
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

      <Modal
        open={pendingAction != null}
        onClose={() => { if (!actionLoading) { setPendingAction(null); setSuspendReason(''); setDeleteConfirmText('') } }}
        title={pendingAction?.kind === 'delete' ? '⚠️ Eliminar institución' : '⏸️ Suspender institución'}
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={actionLoading}
              onClick={() => { setPendingAction(null); setSuspendReason(''); setDeleteConfirmText('') }}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={actionLoading}
              disabled={pendingAction?.kind === 'delete' &&
                deleteConfirmText.trim().toLowerCase() !== (pendingAction?.tenant.name ?? '').trim().toLowerCase()}
              onClick={confirmPendingAction}
            >
              {pendingAction?.kind === 'delete' ? 'Eliminar definitivamente' : 'Suspender'}
            </Button>
          </>
        }
      >
        {pendingAction?.kind === 'delete' ? (
          <div className="space-y-3">
            <p>
              ¿Seguro que deseas eliminar <strong className="text-white">{pendingAction?.tenant.name}</strong>?
              Se cancelarán las suscripciones activas y sus usuarios quedarán bloqueados.
            </p>
            <div className="rounded-lg px-3 py-2 text-xs" style={{ background: `${DANGER}10`, color: DANGER }}>
              Verificación de seguridad: escribe el nombre exacto de la institución para confirmar.
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Escribe «{pendingAction?.tenant.name}» para habilitar el botón
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'rgba(0,5,2,0.8)', border: `1px solid ${DANGER}40` }}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={pendingAction?.tenant.name}
                autoComplete="off"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p>
              Al suspender <strong className="text-white">{pendingAction?.tenant.name}</strong>, todos sus usuarios
              quedarán bloqueados hasta que la reactives.
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Motivo (opcional)</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
                rows={2}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Ej: Falta de pago"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

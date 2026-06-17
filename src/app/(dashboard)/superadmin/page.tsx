'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, normalizeUser } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { isSuperAdmin, displayInstitutionType } from '@/lib/auth/roles'
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
import { SystemHealthPanel } from '@/components/superadmin/SystemHealthPanel'
import { SuperAdminUsersPanel } from '@/components/superadmin/SuperAdminUsersPanel'
import { DANGER, GOLD, INFO, INPUT_BG, NEON, POLICE_GREEN_DARK, PURPLE_ACCENT, RED_BRIGHT, SKY, SURFACE, SURFACE_BORDER, SURFACE_CARD, TEXT_MUTED, WARNING, dangerMix, goldBrightMix, infoMix, policeGreenRgba, primaryMix, purpleMix, redBrightMix, skyMix, warningMix } from '@/lib/constants/theme'
type TabKey =
  | 'inicio'
  | 'agencias'
  | 'usuarios'
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

function SuperAdminPageLoading() {
  return <p className="py-12 text-center text-[var(--color-text-muted)]">Cargando panel...</p>
}

export default function SuperAdminPage() {
  return (
    <Suspense fallback={<SuperAdminPageLoading />}>
      <SuperAdminPageContent />
    </Suspense>
  )
}

function SuperAdminPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabKey | 'academias' | null
  const tab: TabKey =
    tabParam === 'academias' || tabParam === 'agencias'
      ? 'agencias'
      : tabParam && ['inicio', 'usuarios', 'audit'].includes(tabParam)
        ? tabParam
        : 'inicio'

  const { user, loadFromStorage, setUser } = useAuthStore()
  const { startImpersonation } = useImpersonationStore()

  const [dashboard, setDashboard] = useState<DashboardStats | null>(null)
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<AdminCredentials | null>(null)
  const [pendingAction, setPendingAction] = useState<
    { tenant: TenantSummary; kind: 'delete' | 'suspend' } | null
  >(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const tenantsCacheRef = useRef<TenantSummary[]>([])

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  useEffect(() => {
    if (user && !isSuperAdmin(user.role)) {
      router.push('/dashboard')
    }
  }, [user, router])

  const loadTabData = useCallback(async () => {
    if (tab === 'agencias' && tenantsCacheRef.current.length > 0) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      if (tab === 'inicio') {
        const [dashRes, tenantsRes] = await Promise.all([
          superadminApi.getDashboard(),
          tenantsCacheRef.current.length > 0
            ? Promise.resolve({ data: tenantsCacheRef.current })
            : superadminApi.getTenants(),
        ])
        setDashboard(dashRes.data)
        if (tenantsCacheRef.current.length === 0) {
          setTenants(tenantsRes.data)
          tenantsCacheRef.current = tenantsRes.data
        }
      }
      if (tab === 'agencias' && tenantsCacheRef.current.length === 0) {
        const res = await superadminApi.getTenants()
        setTenants(res.data)
        tenantsCacheRef.current = res.data
      }
      if (tab === 'audit') {
        const res = await superadminApi.getAuditLog()
        setAuditLogs((res.data as { logs: AuditLogEntry[] }).logs ?? [])
      }
    } catch (err) {
      toast(getApiErrorMessage(err, 'Error al cargar datos'), 'error')
    } finally {
      setLoading(false)
    }
  }, [tab])

  const refreshTabData = useCallback(() => {
    tenantsCacheRef.current = []
    void loadTabData()
  }, [loadTabData])

  useEffect(() => {
    if (!user || !isSuperAdmin(user.role)) return
    void loadTabData()
  }, [user, tab, loadTabData])

  const handleCreateTenant = async (data: CreateTenantFormState) => {
    setCreating(true)
    try {
      const { branding, ...payload } = data
      const res = await superadminApi.createTenant(payload)
      const responseData = res.data as {
        tenant?: { id?: string; name?: string }
        admin?: {
          fullName: string
          email: string
          dni: string
          role: string
          temporaryPassword: string
        }
      }

      const tenantId = responseData.tenant?.id
      if (!tenantId) {
        throw new Error('No se recibió el ID de la institución creada')
      }

      if (branding.logoFile) {
        await superadminApi.uploadTenantLogo(tenantId, branding.logoFile)
      }
      if (branding.backgroundFile) {
        await superadminApi.uploadTenantLoginBackground(tenantId, branding.backgroundFile)
      }

      setShowCreate(false)
      if (responseData.admin) {
        setCreatedCredentials({
          tenantName: responseData.tenant?.name ?? data.name,
          fullName: responseData.admin.fullName,
          email: responseData.admin.email,
          dni: responseData.admin.dni,
          role: responseData.admin.role,
          temporaryPassword: responseData.admin.temporaryPassword,
        })
      }
      toast('Institución y administrador creados correctamente', 'success')
      router.push('/superadmin?tab=agencias')
      refreshTabData()
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
          tenantSlug: tenant.slug,
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
      refreshTabData()
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
      refreshTabData()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'No se pudo completar la acción', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const openCreate = () => {
    setShowCreate(true)
  }

  const agencias = useMemo(() => tenants, [tenants])

  const institutionStats = useMemo(() => {
    if (!dashboard) return null
    return {
      total: dashboard.agencias.total + dashboard.academias.total,
      active: dashboard.agencias.active + dashboard.academias.active,
      students: dashboard.agencias.students + dashboard.academias.students,
    }
  }, [dashboard])

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'inicio', label: '🏠 Inicio' },
    { key: 'agencias', label: '🏢 Agencias' },
    { key: 'usuarios', label: '👥 Usuarios' },
    { key: 'audit', label: '📋 Audit Log' },
  ]

  const kpiCard = (
    label: string,
    value: string | number,
    opts?: { color?: string; icon?: string; sub?: string }
  ) => (
    <div
      className="rounded-2xl p-4 min-h-[108px] flex flex-col justify-between"
      style={{
        background: 'linear-gradient(145deg, var(--color-surface-card), var(--color-surface-elevated))',
        border: `1px solid ${policeGreenRgba(0.22)}`,
        boxShadow: 'inset 0 1px 0 rgba(189,255,223,0.06)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
        {opts?.icon ? <span className="text-base opacity-80">{opts.icon}</span> : null}
      </div>
      <div>
        <div className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: opts?.color ?? NEON }}>
          {value}
        </div>
        {opts?.sub ? <div className="text-[10px] text-gray-600 mt-1">{opts.sub}</div> : null}
      </div>
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
            style={{ background: 'var(--color-surface-elevated)', border: `1px solid ${policeGreenRgba(0.2)}` }}>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[var(--color-text-primary)] font-semibold">{t.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: policeGreenRgba(0.15), color: NEON }}>
                  {displayInstitutionType(t.tenantType)}
                </span>
                {!t.isActive || t.suspended ? (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${dangerMix(20)}`, color: DANGER }}>
                    {t.suspended ? 'SUSPENDIDO' : 'Inactivo'}
                  </span>
                ) : null}
                {t.isExpired ? (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${dangerMix(20)}`, color: DANGER }}>
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
                {t.slug} · {t.students} alumno{t.students !== 1 ? 's' : ''}
                {(t.admins ?? 0) > 0 ? ` · ${t.admins} admin` : ''} · {t.examsCompleted} exámenes
                {t.contactPhone ? ` · ${t.contactPhone}` : ''}
                {t.monthlyFee > 0 ? ` · S/. ${t.monthlyFee}/mes` : ''}
              </div>
              {t.accessExpiresAt ? (
                <div className="text-xs mt-0.5" style={{ color: t.isExpired ? DANGER : TEXT_MUTED }}>
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
                style={{ backgroundColor: `${warningMix(15)}`, color: WARNING, border: `1px solid ${warningMix(30)}` }}>
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
                  style={{ backgroundColor: `${warningMix(12)}`, color: WARNING, border: `1px solid ${warningMix(25)}` }}>
                  Suspender
                </button>
              )}
              <button type="button" onClick={() => { setDeleteConfirmText(''); setPendingAction({ tenant: t, kind: 'delete' }) }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: `${dangerMix(12)}`, color: DANGER, border: `1px solid ${dangerMix(25)}` }}>
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1">Powered by Simulacros.pe</p>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Panel SuperAdmin</h1>
          <p className="text-gray-500 text-sm mt-0.5">Métricas globales y registro de instituciones</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={openCreate}
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: 'var(--color-text-primary)' }}>
            ➕ Registrar agencia
          </button>
        </div>
      </div>

      <CreateTenantPanel
        open={showCreate}
        loading={creating}
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
              backgroundColor: tab === t.key ? NEON : SURFACE_CARD,
              color: tab === t.key ? '#000' : '#9CA3AF',
              border: `1px solid ${tab === t.key ? NEON : 'var(--color-surface-border)'}`,
            }}>
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'inicio' && (
        loading ? <SkeletonTable rows={4} /> : dashboard ? (
          <div className="space-y-4">
            <SystemHealthPanel />

            <div className="rounded-2xl p-4"
              style={{ background: 'var(--color-surface-card)', border: `1px solid ${warningMix(35)}` }}>
              <h3 className="text-[var(--color-text-primary)] font-semibold text-sm mb-1">Registro de cuentas</h3>
              <p className="text-xs text-gray-500 mb-3">
                Crea instituciones con logo y fondo personalizado para su página de login.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {kpiCard('Instituciones registradas', dashboard.totalTenants, {
                  icon: '🏢',
                  sub: `+${dashboard.newTenantsThisMonth ?? 0} este mes`,
                })}
                {kpiCard('Admins de institución', dashboard.totalAdmins ?? 0, {
                  icon: '👤',
                  color: INFO,
                  sub: 'Cuentas administradoras activas',
                })}
                {kpiCard('Alumnos registrados', dashboard.totalStudents, {
                  icon: '🎓',
                  sub: `+${dashboard.newStudentsThisMonth ?? 0} este mes`,
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {kpiCard('Activas', dashboard.activeTenants, { icon: '✅', color: INFO })}
              {kpiCard('Ingreso mensual est.', `S/. ${dashboard.monthlyRevenue}`, { icon: '💰', color: WARNING })}
              {kpiCard('Agencias', institutionStats ? `${institutionStats.active}/${institutionStats.total}` : '—', { icon: '🏢' })}
              {kpiCard('Alumnos PNP', institutionStats?.students ?? 0, { icon: '👥', color: INFO })}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {kpiCard('Exámenes hoy', dashboard.totalExamsToday, { icon: '📝', color: INFO })}
              {kpiCard('Exámenes del mes', dashboard.totalExamsThisMonth, { icon: '📊', color: INFO })}
            </div>
            {dashboard.pendingPayments > 0 && (
              <div className="rounded-2xl p-4 text-sm"
                style={{ background: `${dangerMix(10)}`, border: `1px solid ${dangerMix(30)}`, color: DANGER }}>
                ⚠️ {dashboard.pendingPayments} pago(s) de instituciones pendiente(s) de regularizar.
              </div>
            )}
            <div className="rounded-2xl p-4"
              style={{ background: 'var(--color-surface-card)', border: `1px solid ${SURFACE_BORDER}` }}>
              <h3 className="text-[var(--color-text-primary)] font-semibold mb-3">Instituciones más activas</h3>
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
            <button type="button" onClick={openCreate}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: 'var(--color-text-primary)' }}>
              ➕ Nueva agencia
            </button>
          </div>
          {tenantList(agencias)}
        </div>
      )}

      {tab === 'usuarios' && (
        <SuperAdminUsersPanel />
      )}

      {tab === 'audit' && (
        loading ? <SkeletonTable /> : (
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Sin registros de auditoría</p>
            ) : auditLogs.map((log) => (
              <div key={log.id} className="rounded-xl px-4 py-3 text-sm"
                style={{ background: 'var(--color-surface-elevated)', border: `1px solid ${SURFACE_BORDER}` }}>
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
              ¿Seguro que deseas eliminar <strong className="text-[var(--color-text-primary)]">{pendingAction?.tenant.name}</strong>?
              Se cancelarán las suscripciones activas y sus usuarios quedarán bloqueados.
            </p>
            <div className="rounded-lg px-3 py-2 text-xs" style={{ background: `${dangerMix(10)}`, color: DANGER }}>
              Verificación de seguridad: escribe el nombre exacto de la institución para confirmar.
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Escribe «{pendingAction?.tenant.name}» para habilitar el botón
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--color-input-bg)', border: `1px solid ${dangerMix(40)}` }}
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
              Al suspender <strong className="text-[var(--color-text-primary)]">{pendingAction?.tenant.name}</strong>, todos sus usuarios
              quedarán bloqueados hasta que la reactives.
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Motivo (opcional)</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
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

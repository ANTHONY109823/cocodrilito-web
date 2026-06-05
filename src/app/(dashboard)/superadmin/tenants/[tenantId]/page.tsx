'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, normalizeUser } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { isSuperAdmin } from '@/lib/auth/roles'
import { superadminApi, type TenantAdminInfo, type TenantDetail } from '@/lib/api/superadmin'
import { Skeleton, SkeletonCard } from '@/components/Skeleton'
import { toast } from '@/components/Toast'
import { Modal, Button } from '@/components/ui'
import { CredentialsModal, type AdminCredentials } from '@/components/admin/CredentialsModal'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'
import { NEON, DANGER, WARNING, SURFACE_BORDER, policeGreenRgba } from '@/lib/constants/theme'

interface TenantStats {
  totalUsers: number
  activeUsers: number
  examsThisMonth: number
  totalExams: number
  activePlans: number
}

interface TenantUser {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
}

export default function TenantDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const { user, loadFromStorage, setUser } = useAuthStore()
  const { startImpersonation } = useImpersonationStore()

  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [stats, setStats] = useState<TenantStats | null>(null)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [tenantAdmin, setTenantAdmin] = useState<TenantAdminInfo | null>(null)
  const [hasAdmin, setHasAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEditAdmin, setShowEditAdmin] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetCredentials, setResetCredentials] = useState<AdminCredentials | null>(null)
  const [adminForm, setAdminForm] = useState({ fullName: '', email: '', dni: '' })
  const [newPassword, setNewPassword] = useState('')

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    periodStart: '',
    periodEnd: '',
    markAsPaid: true,
    notes: '',
  })

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  useEffect(() => {
    if (user && !isSuperAdmin(user.role)) router.push('/dashboard')
  }, [user, router])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, sRes, uRes, aRes] = await Promise.all([
        superadminApi.getTenant(tenantId),
        superadminApi.getTenantStats(tenantId),
        superadminApi.getTenantUsers(tenantId),
        superadminApi.getTenantAdmin(tenantId),
      ])
      setTenant(tRes.data)
      setStats(sRes.data as TenantStats)
      setUsers(uRes.data as TenantUser[])
      setHasAdmin(aRes.data.exists)
      setTenantAdmin(aRes.data.admin)
      if (aRes.data.admin) {
        setAdminForm({
          fullName: aRes.data.admin.fullName,
          email: aRes.data.admin.email,
          dni: aRes.data.admin.dni,
        })
      }
      if (tRes.data.monthlyFee) {
        setPaymentForm((p) => ({ ...p, amount: Number(tRes.data.monthlyFee) }))
      }
    } catch {
      toast('Error al cargar tenant', 'error')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!user || !isSuperAdmin(user.role) || !tenantId) return
    void loadAll()
  }, [user, tenantId, loadAll])

  const handleSuspend = async () => {
    const reason = prompt('Motivo de suspensión:')
    if (!reason) return
    try {
      await superadminApi.suspendTenant(tenantId, reason)
      toast('Tenant suspendido', 'success')
      loadAll()
    } catch {
      toast('Error al suspender', 'error')
    }
  }

  const handleReactivate = async () => {
    try {
      await superadminApi.reactivateTenant(tenantId)
      toast('Tenant reactivado', 'success')
      loadAll()
    } catch {
      toast('Error al reactivar', 'error')
    }
  }

  const handleImpersonate = async () => {
    if (!tenant) return
    try {
      await superadminApi.impersonateTenant(tenantId)
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
      toast('Error al impersonar', 'error')
    }
  }

  const handleSaveAdmin = async () => {
    setSaving(true)
    try {
      await superadminApi.updateTenantAdmin(tenantId, adminForm)
      toast('Administrador actualizado', 'success')
      setShowEditAdmin(false)
      loadAll()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Error al actualizar administrador', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    const pwdError = validatePassword(newPassword)
    if (pwdError) {
      toast(pwdError, 'error')
      return
    }
    setSaving(true)
    try {
      const res = await superadminApi.resetTenantAdminPassword(tenantId, newPassword)
      setShowResetPassword(false)
      setNewPassword('')
      setResetCredentials({
        tenantName: tenant?.name,
        fullName: res.data.credentials.fullName,
        email: res.data.credentials.email,
        dni: res.data.credentials.dni,
        role: res.data.credentials.role,
        temporaryPassword: res.data.credentials.temporaryPassword,
      })
      toast('Contraseña restablecida', 'success')
      loadAll()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Error al restablecer contraseña', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await superadminApi.registerPayment(tenantId, paymentForm)
      toast('Pago registrado', 'success')
    } catch {
      toast('Error al registrar pago', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-16 text-gray-500">
        Tenant no encontrado
        <Link href="/superadmin" className="block mt-4" style={{ color: NEON }}>← Volver</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/superadmin" className="text-sm mb-4 inline-block" style={{ color: NEON }}>
        ← Volver al panel SuperAdmin
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {tenant.slug} · {tenant.tenantType} · {tenant.contactEmail}
          </p>
          {tenant.suspendedAt && (
            <p className="text-sm mt-2" style={{ color: DANGER }}>
              Suspendido: {tenant.suspendedReason}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={handleImpersonate}
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ backgroundColor: `${WARNING}20`, color: WARNING, border: `1px solid ${WARNING}40` }}>
            🎭 Impersonar
          </button>
          {tenant.suspendedAt || !tenant.isActive ? (
            <button type="button" onClick={handleReactivate}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ backgroundColor: NEON, color: '#000' }}>
              Reactivar
            </button>
          ) : (
            <button type="button" onClick={handleSuspend}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ backgroundColor: `${DANGER}20`, color: DANGER, border: `1px solid ${DANGER}40` }}>
              Suspender
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Usuarios', value: stats.totalUsers },
            { label: 'Activos', value: stats.activeUsers },
            { label: 'Exámenes mes', value: stats.examsThisMonth },
            { label: 'Planes activos', value: stats.activePlans },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${SURFACE_BORDER}` }}>
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="text-xl font-bold" style={{ color: NEON }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-4 mb-6"
        style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${NEON}30` }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-white font-semibold">Administrador del tenant</h3>
            <p className="text-xs text-gray-500 mt-1">
              SuperAdmin gestiona la cuenta de acceso del Admin {tenant.tenantType}.
            </p>
          </div>
          {hasAdmin && tenantAdmin && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowEditAdmin(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: `${NEON}20`, color: NEON, border: `1px solid ${NEON}40` }}>
                Editar
              </button>
              <button type="button" onClick={() => setShowResetPassword(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: `${WARNING}20`, color: WARNING, border: `1px solid ${WARNING}40` }}>
                Restablecer contraseña
              </button>
            </div>
          )}
        </div>

        {!hasAdmin || !tenantAdmin ? (
          <p className="text-sm text-gray-500">
            No hay administrador asignado. Elimina y recrea la institución desde el panel SuperAdmin con credenciales de acceso.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-500">Nombre</div>
              <div className="text-white">{tenantAdmin.fullName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-white break-all">{tenantAdmin.email}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">DNI</div>
              <div className="text-white">{tenantAdmin.dni}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Estado</div>
              <div style={{ color: tenantAdmin.mustChangePassword ? WARNING : NEON }}>
                {tenantAdmin.mustChangePassword ? 'Debe cambiar contraseña' : 'Activo'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${SURFACE_BORDER}` }}>
          <h3 className="text-white font-semibold mb-3">Configuración</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>Cuota mensual: S/. {tenant.monthlyFee}</li>
            <li>Color primario: {tenant.primaryColor || NEON}</li>
            <li>Gamificación: {tenant.gamificationEnabled ? '✅' : '❌'}</li>
            <li>Ranking público: {tenant.rankingPublic ? '✅' : '❌'}</li>
            <li>Tracks: {(tenant.allowedTrackTypes || []).join(', ') || '—'}</li>
          </ul>
        </div>

        <form onSubmit={handlePayment} className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${WARNING}25` }}>
          <h3 className="text-white font-semibold">Registrar pago</h3>
          <input type="number" step="0.01" placeholder="Monto S/."
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" required
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
              value={paymentForm.periodStart}
              onChange={(e) => setPaymentForm({ ...paymentForm, periodStart: e.target.value })}
            />
            <input type="date" required
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
              value={paymentForm.periodEnd}
              onChange={(e) => setPaymentForm({ ...paymentForm, periodEnd: e.target.value })}
            />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: WARNING, color: '#000', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando...' : 'Registrar pago'}
          </button>
        </form>
      </div>

      <Modal
        open={showEditAdmin}
        onClose={() => !saving && setShowEditAdmin(false)}
        title="Editar administrador"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setShowEditAdmin(false)}>Cancelar</Button>
            <Button size="sm" loading={saving} onClick={handleSaveAdmin}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre completo</label>
            <input className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
              value={adminForm.fullName}
              onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email de acceso</label>
            <input type="email" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">DNI</label>
            <input maxLength={8} className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
              value={adminForm.dni}
              onChange={(e) => setAdminForm({ ...adminForm, dni: e.target.value.replace(/\D/g, '') })} />
          </div>
        </div>
      </Modal>

      <Modal
        open={showResetPassword}
        onClose={() => !saving && setShowResetPassword(false)}
        title="Restablecer contraseña del administrador"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setShowResetPassword(false)}>Cancelar</Button>
            <Button size="sm" loading={saving} onClick={handleResetPassword}>Restablecer</Button>
          </>
        }
      >
        <p className="text-sm text-gray-400 mb-3">
          Define una nueva contraseña temporal. El administrador deberá cambiarla en su próximo ingreso.
        </p>
        <input type="password" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
          style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nueva contraseña temporal"
        />
        <PasswordPolicyHint password={newPassword} />
      </Modal>

      <CredentialsModal
        open={resetCredentials != null}
        credentials={resetCredentials}
        onClose={() => setResetCredentials(null)}
      />

      <div className="rounded-2xl p-4"
        style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${SURFACE_BORDER}` }}>
        <h3 className="text-white font-semibold mb-3">Usuarios del tenant ({users.length})</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {users.map((u) => (
            <div key={u.id} className="flex justify-between text-sm py-2"
              style={{ borderBottom: `1px solid ${policeGreenRgba(0.1)}` }}>
              <span className="text-gray-300">{u.fullName} · {u.email}</span>
              <span style={{ color: u.isActive ? NEON : DANGER }}>{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

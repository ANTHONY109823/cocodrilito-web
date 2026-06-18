'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, normalizeUser } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { displayInstitutionType, isSuperAdmin } from '@/lib/auth/roles'
import { superadminApi, type TenantAdminInfo, type TenantDetail } from '@/lib/api/superadmin'
import { Skeleton, SkeletonCard } from '@/components/Skeleton'
import { toast } from '@/components/Toast'
import { Modal, Button } from '@/components/ui'
import { CredentialsModal, type AdminCredentials } from '@/components/admin/CredentialsModal'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'
import { DANGER, GOLD, INFO, INPUT_BG, NEON, POLICE_GREEN_DARK, PURPLE_ACCENT, RED_BRIGHT, SKY, SURFACE, SURFACE_BORDER, SURFACE_CARD, TEXT_MUTED, WARNING, dangerMix, goldBrightMix, infoMix, policeGreenRgba, primaryMix, purpleMix, redBrightMix, skyMix, warningMix } from '@/lib/constants/theme'
import { TenantAccessUrl } from '@/components/tenant/TenantAccessUrl'
import { TenantLoginBrandingFields, emptyLoginBranding } from '@/components/superadmin/TenantLoginBrandingFields'
import {
  TenantBrandingUploadFields,
  emptyTenantBrandingFiles,
  type TenantBrandingFiles,
} from '@/components/superadmin/TenantBrandingUploadFields'
import { TenantPlansSection } from '@/components/admin/TenantPlansSection'
import { resolveLoginBranding, type TenantLoginBranding } from '@/lib/constants/defaultLoginBranding'
import { SuperAdminUsersPanel } from '@/components/superadmin/SuperAdminUsersPanel'

interface TenantStats {
  totalStudents: number
  activeStudents: number
  totalAdmins: number
  totalUsers: number
  activeUsers: number
  examsThisMonth: number
  totalExams: number
  activePlans: number
}

export default function TenantDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const { user, loadFromStorage, setUser } = useAuthStore()
  const { startImpersonation } = useImpersonationStore()

  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [stats, setStats] = useState<TenantStats | null>(null)
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

  const [accessForm, setAccessForm] = useState({ startsAt: '', days: 30 })
  const [savingAccess, setSavingAccess] = useState(false)
  const [tenantForm, setTenantForm] = useState({ name: '', slug: '' })
  const [savingTenant, setSavingTenant] = useState(false)
  const [loginBranding, setLoginBranding] = useState<TenantLoginBranding>(emptyLoginBranding())
  const [savingLoginBranding, setSavingLoginBranding] = useState(false)
  const [brandingFiles, setBrandingFiles] = useState<TenantBrandingFiles>(emptyTenantBrandingFiles())
  const [savingBranding, setSavingBranding] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  useEffect(() => {
    if (user && !isSuperAdmin(user.role)) router.push('/dashboard')
  }, [user, router])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, sRes, aRes] = await Promise.all([
        superadminApi.getTenant(tenantId),
        superadminApi.getTenantStats(tenantId),
        superadminApi.getTenantAdmin(tenantId),
      ])
      setTenant(tRes.data)
      setTenantForm({ name: tRes.data.name, slug: tRes.data.slug })
      setLoginBranding(resolveLoginBranding(tRes.data.loginConfig))
      setStats(sRes.data as TenantStats)
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
      const startsAt = tRes.data.accessStartsAt
      const expiresAt = tRes.data.accessExpiresAt
      if (startsAt) {
        const startDate = new Date(startsAt)
        const days = expiresAt
          ? Math.max(1, Math.round((new Date(expiresAt).getTime() - startDate.getTime()) / 86400000))
          : 30
        setAccessForm({ startsAt: startDate.toISOString().slice(0, 10), days })
      } else {
        setAccessForm({ startsAt: new Date().toISOString().slice(0, 10), days: 30 })
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
          role: 'AdminAgencia',
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
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

  const computedExpiry = (() => {
    if (!accessForm.startsAt || !accessForm.days) return null
    const d = new Date(accessForm.startsAt)
    d.setDate(d.getDate() + Number(accessForm.days))
    return d
  })()

  const tenantFormDirty = tenant
    ? tenantForm.name.trim() !== tenant.name || tenantForm.slug.trim() !== tenant.slug
    : false

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    if (!tenantForm.name.trim() || !tenantForm.slug.trim()) {
      toast('Nombre y slug son obligatorios', 'error')
      return
    }
    setSavingTenant(true)
    try {
      const res = await superadminApi.updateTenant(tenantId, {
        name: tenantForm.name.trim(),
        slug: tenantForm.slug.trim(),
      })
      const updated = res.data as TenantDetail
      setTenant(updated)
      setTenantForm({ name: updated.name, slug: updated.slug })
      toast('Institución actualizada', 'success')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Error al actualizar la institución', 'error')
    } finally {
      setSavingTenant(false)
    }
  }

  const handleSaveLoginBranding = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingLoginBranding(true)
    try {
      const res = await superadminApi.updateTenant(tenantId, { loginConfig: loginBranding })
      const updated = res.data as TenantDetail
      setTenant(updated)
      setLoginBranding(resolveLoginBranding(updated.loginConfig))
      toast('Panel de login actualizado', 'success')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Error al guardar el panel de login', 'error')
    } finally {
      setSavingLoginBranding(false)
    }
  }

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandingFiles.logoFile && !brandingFiles.backgroundFile) {
      toast('Selecciona al menos un archivo para actualizar', 'error')
      return
    }

    setSavingBranding(true)
    try {
      let updated = tenant
      if (brandingFiles.logoFile) {
        const logoRes = await superadminApi.uploadTenantLogo(tenantId, brandingFiles.logoFile)
        updated = updated ? { ...updated, logoUrl: logoRes.data.logoUrl } : updated
      }
      if (brandingFiles.backgroundFile) {
        const bgRes = await superadminApi.uploadTenantLoginBackground(tenantId, brandingFiles.backgroundFile)
        updated = updated
          ? { ...updated, loginBackgroundUrl: bgRes.data.loginBackgroundUrl }
          : updated
      }
      if (updated) setTenant(updated)
      setBrandingFiles(emptyTenantBrandingFiles())
      toast('Identidad visual actualizada', 'success')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Error al subir las imágenes', 'error')
    } finally {
      setSavingBranding(false)
    }
  }

  const handleSetAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessForm.startsAt || accessForm.days <= 0) {
      toast('Indica una fecha de activación y los días pagados', 'error')
      return
    }
    setSavingAccess(true)
    try {
      const res = await superadminApi.setTenantAccess(tenantId, {
        startsAt: accessForm.startsAt,
        days: Number(accessForm.days),
      })
      setTenant(res.data)
      toast('Vigencia de acceso actualizada', 'success')
      loadAll()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Error al guardar la vigencia', 'error')
    } finally {
      setSavingAccess(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await superadminApi.deleteTenant(tenantId)
      toast('Institución eliminada', 'success')
      router.push('/superadmin?tab=agencias')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Error al eliminar la institución', 'error')
    } finally {
      setDeleting(false)
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
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{tenant.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {tenant.slug} · {displayInstitutionType(tenant.tenantType)} · {tenant.contactEmail}
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
            style={{ backgroundColor: `${warningMix(20)}`, color: WARNING, border: `1px solid ${warningMix(40)}` }}>
            🎭 Impersonar
          </button>
          {tenant.suspendedAt || !tenant.isActive ? (
            <button type="button" onClick={handleReactivate}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ backgroundColor: NEON, color: 'var(--color-text-primary)' }}>
              Reactivar
            </button>
          ) : (
            <button type="button" onClick={handleSuspend}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ backgroundColor: `${dangerMix(20)}`, color: DANGER, border: `1px solid ${dangerMix(40)}` }}>
              Suspender
            </button>
          )}
          <button type="button" onClick={() => { setDeleteConfirmText(''); setShowDelete(true) }}
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ backgroundColor: `${dangerMix(12)}`, color: DANGER, border: `1px solid ${dangerMix(30)}` }}>
            🗑️ Eliminar
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Alumnos', value: stats.totalStudents ?? stats.totalUsers },
            { label: 'Alumnos activos', value: stats.activeStudents ?? stats.activeUsers },
            { label: 'Admins', value: stats.totalAdmins ?? 0 },
            { label: 'Exámenes mes', value: stats.examsThisMonth },
            { label: 'Planes activos', value: stats.activePlans },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background: 'var(--color-surface-card)', border: `1px solid ${SURFACE_BORDER}` }}>
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="text-xl font-bold" style={{ color: NEON }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSetAccess} className="rounded-2xl p-4 mb-6"
        style={{ background: 'var(--color-surface-card)', border: `1px solid ${primaryMix(30)}` }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-[var(--color-text-primary)] font-semibold">Vigencia de acceso</h3>
            <p className="text-xs text-gray-500 mt-1">
              Registra desde qué fecha la agencia tiene acceso y por cuántos días pagó.
              La fecha de expiración se calcula automáticamente.
            </p>
          </div>
          {tenant.accessExpiresAt && (
            <span className="text-xs px-2 py-1 rounded-full self-start"
              style={
                new Date(tenant.accessExpiresAt) < new Date()
                  ? { backgroundColor: `${dangerMix(20)}`, color: DANGER }
                  : { backgroundColor: `${primaryMix(20)}`, color: NEON }
              }>
              {new Date(tenant.accessExpiresAt) < new Date() ? 'EXPIRADO' : 'VIGENTE'}
            </span>
          )}
        </div>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha de activación</label>
            <input type="date" required
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
              value={accessForm.startsAt}
              onChange={(e) => setAccessForm({ ...accessForm, startsAt: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Días pagados</label>
            <input type="number" min={1} required
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
              value={accessForm.days}
              onChange={(e) => setAccessForm({ ...accessForm, days: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expira (automático)</label>
            <div className="px-3 py-2 rounded-lg text-sm"
              style={{ background: SURFACE, border: '1px solid var(--color-surface-border)', color: NEON }}>
              {computedExpiry ? computedExpiry.toLocaleDateString('es-PE') : '—'}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center mt-3">
          <button type="submit" disabled={savingAccess}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: NEON, color: 'var(--color-text-primary)', opacity: savingAccess ? 0.7 : 1 }}>
            {savingAccess ? 'Guardando...' : 'Guardar vigencia'}
          </button>
          {tenant.accessStartsAt && (
            <span className="text-xs text-gray-500">
              Actual: {new Date(tenant.accessStartsAt).toLocaleDateString('es-PE')}
              {tenant.accessExpiresAt ? ` → ${new Date(tenant.accessExpiresAt).toLocaleDateString('es-PE')}` : ''}
            </span>
          )}
        </div>
      </form>

      <div className="rounded-2xl p-4 mb-6"
        style={{ background: 'var(--color-surface-card)', border: `1px solid ${primaryMix(30)}` }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-[var(--color-text-primary)] font-semibold">Administrador del tenant</h3>
            <p className="text-xs text-gray-500 mt-1">
              SuperAdmin gestiona la cuenta de acceso del administrador de la agencia.
            </p>
          </div>
          {hasAdmin && tenantAdmin && (
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowEditAdmin(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: `${primaryMix(20)}`, color: NEON, border: `1px solid ${primaryMix(40)}` }}>
                Editar
              </button>
              <button type="button" onClick={() => setShowResetPassword(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: `${warningMix(20)}`, color: WARNING, border: `1px solid ${warningMix(40)}` }}>
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
              <div className="text-[var(--color-text-primary)]">{tenantAdmin.fullName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-[var(--color-text-primary)] break-all">{tenantAdmin.email}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">DNI</div>
              <div className="text-[var(--color-text-primary)]">{tenantAdmin.dni}</div>
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

      <form onSubmit={handleSaveBranding} className="rounded-2xl p-4 mb-6 space-y-4"
        style={{ background: 'var(--color-surface-card)', border: `1px solid ${infoMix(35)}` }}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-[var(--color-text-primary)] font-semibold">Identidad visual</h3>
            <p className="text-xs text-gray-500 mt-1">
              Logo e imagen de fondo del login de {tenant.slug}.simulacros.pe
            </p>
          </div>
          <button type="submit" disabled={savingBranding}
            className="px-4 py-2 rounded-xl text-xs font-bold shrink-0"
            style={{
              backgroundColor: INFO,
              color: 'var(--color-text-primary)',
              opacity: savingBranding ? 0.6 : 1,
            }}>
            {savingBranding ? 'Subiendo...' : 'Guardar imágenes'}
          </button>
        </div>
        <TenantBrandingUploadFields
          value={brandingFiles}
          onChange={setBrandingFiles}
          disabled={savingBranding}
          existingLogoUrl={tenant.logoUrl}
          existingBackgroundUrl={tenant.loginBackgroundUrl}
        />
      </form>

      <form onSubmit={handleSaveLoginBranding} className="rounded-2xl p-4 mb-6 space-y-4"
        style={{ background: 'var(--color-surface-card)', border: `1px solid ${warningMix(35)}` }}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-[var(--color-text-primary)] font-semibold">Panel de inicio de sesión</h3>
            <p className="text-xs text-gray-500 mt-1">
              Textos, beneficios, estadísticas y redes que verán alumnos y admin de esta agencia.
            </p>
          </div>
          <button type="submit" disabled={savingLoginBranding}
            className="px-4 py-2 rounded-xl text-xs font-bold shrink-0"
            style={{
              backgroundColor: WARNING,
              color: 'var(--color-text-primary)',
              opacity: savingLoginBranding ? 0.6 : 1,
            }}>
            {savingLoginBranding ? 'Guardando...' : 'Guardar panel de login'}
          </button>
        </div>
        <TenantLoginBrandingFields value={loginBranding} onChange={setLoginBranding} />
      </form>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <form onSubmit={handleSaveTenant} className="rounded-2xl p-4 space-y-4"
          style={{ background: 'var(--color-surface-card)', border: `1px solid ${primaryMix(35)}` }}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-[var(--color-text-primary)] font-semibold">Configuración de la institución</h3>
              <p className="text-xs text-gray-500 mt-1">
                Edita el nombre y el slug (URL de acceso de la agencia).
              </p>
            </div>
            <button type="submit" disabled={savingTenant || !tenantFormDirty}
              className="px-4 py-2 rounded-xl text-xs font-bold shrink-0"
              style={{
                backgroundColor: NEON,
                color: 'var(--color-text-primary)',
                opacity: savingTenant || !tenantFormDirty ? 0.55 : 1,
              }}>
              {savingTenant ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
                value={tenantForm.name}
                onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug (subdominio)</label>
              <input
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
                value={tenantForm.slug}
                onChange={(e) => setTenantForm({ ...tenantForm, slug: e.target.value })}
                placeholder="jraasecurity"
                required
              />
              <p className="text-[10px] text-gray-600 mt-1">
                Solo el prefijo: {tenantForm.slug.trim() || 'nombre'}.simulacros.pe
              </p>
            </div>
          </div>

          <TenantAccessUrl slug={tenantForm.slug.trim() || tenant.slug} />

          <ul className="text-sm text-gray-400 space-y-1 pt-2 border-t border-white/10">
            <li>Cuota mensual: S/. {tenant.monthlyFee}</li>
            <li>Color primario: {tenant.primaryColor || NEON}</li>
            <li>Gamificación: {tenant.gamificationEnabled ? '✅' : '❌'}</li>
            <li>Ranking público: {tenant.rankingPublic ? '✅' : '❌'}</li>
            <li>Tracks: {(tenant.allowedTrackTypes || []).join(', ') || '—'}</li>
          </ul>
        </form>

        <form onSubmit={handlePayment} className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--color-surface-card)', border: `1px solid ${warningMix(25)}` }}>
          <h3 className="text-[var(--color-text-primary)] font-semibold">Registrar pago</h3>
          <input type="number" step="0.01" placeholder="Monto S/."
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" required
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
              value={paymentForm.periodStart}
              onChange={(e) => setPaymentForm({ ...paymentForm, periodStart: e.target.value })}
            />
            <input type="date" required
              className="px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
              value={paymentForm.periodEnd}
              onChange={(e) => setPaymentForm({ ...paymentForm, periodEnd: e.target.value })}
            />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: WARNING, color: 'var(--color-text-primary)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando...' : 'Registrar pago'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl p-4 mb-6"
        style={{ background: 'var(--color-surface-card)', border: `1px solid ${goldBrightMix(30)}` }}>
        <TenantPlansSection
          tenantId={tenantId}
          description="Planes de suscripción que verán los alumnos de esta agencia al contratar acceso."
        />
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
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
              value={adminForm.fullName}
              onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email de acceso</label>
            <input type="email" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">DNI</label>
            <input maxLength={8} className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
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
          style={{ background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }}
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

      <Modal
        open={showDelete}
        onClose={() => !deleting && setShowDelete(false)}
        title="⚠️ Eliminar institución"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setShowDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              disabled={deleteConfirmText.trim().toLowerCase() !== tenant.name.trim().toLowerCase()}
              onClick={handleDelete}
            >
              Eliminar definitivamente
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>
            ¿Seguro que deseas eliminar <strong className="text-[var(--color-text-primary)]">{tenant.name}</strong>?
            Se cancelarán las suscripciones activas y sus usuarios quedarán bloqueados.
          </p>
          <div className="rounded-lg px-3 py-2 text-xs" style={{ background: `${dangerMix(10)}`, color: DANGER }}>
            Verificación de seguridad: escribe el nombre exacto de la institución para confirmar.
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Escribe «{tenant.name}» para habilitar el botón
            </label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--color-input-bg)', border: `1px solid ${dangerMix(40)}` }}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={tenant.name}
              autoComplete="off"
            />
          </div>
        </div>
      </Modal>

      <SuperAdminUsersPanel
        tenantId={tenantId}
        tenantName={tenant.name}
        compact
      />
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import apiClient from '@/lib/api/client'
import { getApiErrorMessage } from '@/lib/api/errors'
import { isTenantAdmin, isAdminAgencia, getPostLoginPath } from '@/lib/auth/roles'
import { tenantAdminApi, type AdminDashboardData, type TenantProfile } from '@/lib/api/tenantAdmin'
import { formatRelativeTime } from '@/lib/utils/relativeTime'
import { NEON } from '@/lib/constants/theme'
import {
  SUBSCRIPTION_PLANS,
  formatPlanPrice,
  inferDaysFromAmount,
} from '@/lib/constants/subscriptionPlans'
import { ASCENSO_TRACK_OPTIONS, DEFAULT_QUESTION_TRACK } from '@/lib/constants/trackTypes'
import { TenantAccessUrl } from '@/components/tenant/TenantAccessUrl'
import { Modal, Button } from '@/components/ui'
import { CredentialsModal, type AdminCredentials } from '@/components/admin/CredentialsModal'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'

interface User {
  id: string
  fullName: string
  email: string
  dni: string
  rank: string
  unit: string
  planType: string
  role: string
  isActive: boolean
  createdByAdmin: boolean
  createdAt: string
  subscription?: { expiresAt: string; startsAt: string } | null
}

interface Subscription {
  id: string
  userId: string
  planType: string
  planDurationDays?: number | null
  paymentMethod: string
  amountPaid: number
  paymentReference: string
  status: string
  createdAt: string
}

const NEON2 = '#4FC3F7'
const GOLD = '#FFD700'
const RED = '#FF5252'
const PURPLE = '#A855F7'

type AdminTab = 'dashboard' | 'users'
type UserSubTab = 'activos' | 'inactivos' | 'crear'

export default function AdminPage() {
  const { user, loadFromStorage } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab')
  const rawSub = searchParams.get('sub')

  const tab: AdminTab =
    rawTab === 'users' || rawTab === 'inactive' || rawTab === 'create'
      ? 'users'
      : 'dashboard'

  const userSub: UserSubTab =
    rawTab === 'inactive' || rawSub === 'inactivos'
      ? 'inactivos'
      : rawTab === 'create' || rawSub === 'crear'
        ? 'crear'
        : 'activos'

  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null)

  const [dashData, setDashData] = useState<AdminDashboardData | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)
  const [uploadingExcel, setUploadingExcel] = useState(false)

  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ fullName: '', email: '', dni: '', rank: '', unit: '' })

  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string } | null>(null)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [studentCredentials, setStudentCredentials] = useState<AdminCredentials | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  const [form, setForm] = useState({
    fullName: '', dni: '', email: '', password: '',
    rank: '', unit: '', planDays: 180,
    trackType: DEFAULT_QUESTION_TRACK,
    activationDate: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    if (rawTab === 'inactive') router.replace('/admin?tab=users&sub=inactivos')
    else if (rawTab === 'create') router.replace('/admin?tab=users&sub=crear')
    else if (rawTab === 'subscriptions' || rawTab === 'ventas' || rawTab === 'plans') router.replace('/admin')
  }, [rawTab, router])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'dashboard') {
        const [dashRes, profileRes, subsRes] = await Promise.all([
          tenantAdminApi.getDashboard(),
          tenantAdminApi.getProfile(),
          apiClient.get('/subscriptions/pending'),
        ])
        setDashData(dashRes.data)
        setTenantProfile(profileRes.data)
        setSubscriptions(subsRes.data)
      } else if (tab === 'users') {
        const res = await apiClient.get('/admin/users')
        setUsers(res.data)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [tab, user])

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingExcel(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/admin/users/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setMsg({ text: `✅ ${res.data.created} usuarios importados`, ok: true })
      if (res.data.errors?.length > 0) console.warn('Errores:', res.data.errors)
      void loadData()
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al importar'), ok: false })
    } finally {
      setUploadingExcel(false)
      if (excelInputRef.current) excelInputRef.current.value = ''
    }
  }

  const handleDownloadExcelTemplate = () => {
    const csv = 'Nombre Completo,DNI,Email,Contraseña,Grado,Unidad,Días\nJuan Pérez Torres,12345678,juan@gmail.com,Ejemplo1234,Suboficial de 3ra,Comisaría Lima Norte,180\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plantilla_usuarios.csv'; a.click()
  }

  useEffect(() => { loadFromStorage() }, [])

  useEffect(() => {
    if (!user) return
    if (!isTenantAdmin(user.role)) {
      router.replace(getPostLoginPath(user.role))
      return
    }
    void loadData()
  }, [user, loadData, router, tab])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwdError = validatePassword(form.password)
    if (pwdError) {
      setMsg({ text: pwdError, ok: false })
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      await apiClient.post('/admin/users', {
        ...form,
        startsAt: form.activationDate,
      })
      setMsg({ text: '✅ Usuario creado exitosamente', ok: true })
      setForm({
        fullName: '', dni: '', email: '', password: '', rank: '', unit: '', planDays: 180,
        trackType: DEFAULT_QUESTION_TRACK,
        activationDate: new Date().toISOString().slice(0, 10),
      })
      setTimeout(() => { router.push('/admin?tab=users&sub=activos'); setMsg(null) }, 2000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al crear usuario'), ok: false })
    } finally { setSaving(false) }
  }

  const inferDays = (amount: number) => inferDaysFromAmount(amount)

  const handleApprove = async (sub: Subscription) => {
    try {
      const days = sub.planDurationDays && sub.planDurationDays > 0
        ? sub.planDurationDays
        : inferDays(sub.amountPaid)
      await apiClient.put(`/subscriptions/${sub.id}/approve`, { durationDays: days })
      setSubscriptions(prev => prev.filter(s => s.id !== sub.id))
      setDashData(prev => prev
        ? { ...prev, pendingSubscriptions: Math.max(0, prev.pendingSubscriptions - 1) }
        : prev)
      setMsg({ text: `✅ Suscripción aprobada — ${days} días activados`, ok: true })
      setTimeout(() => setMsg(null), 3000)
    } catch { setMsg({ text: 'Error al aprobar', ok: false }) }
  }

  const confirmReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setModalLoading(true)
    try {
      await apiClient.put(`/subscriptions/${rejectTarget}/reject`, { reason: rejectReason.trim() })
      setSubscriptions(prev => prev.filter(s => s.id !== rejectTarget))
      setDashData(prev => prev
        ? { ...prev, pendingSubscriptions: Math.max(0, prev.pendingSubscriptions - 1) }
        : prev)
      setMsg({ text: 'Pago rechazado', ok: false })
      setTimeout(() => setMsg(null), 2500)
      setRejectTarget(null)
      setRejectReason('')
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al rechazar'), ok: false })
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    const target = users.find((u) => u.id === id)
    if (target) setDeactivateTarget({ id, name: target.fullName })
  }

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return
    setModalLoading(true)
    try {
      await apiClient.delete(`/admin/users/${deactivateTarget.id}`)
      setUsers((prev) => prev.map((u) => u.id === deactivateTarget.id ? { ...u, isActive: false } : u))
      setMsg({ text: '⛔ Usuario desactivado', ok: false })
      setTimeout(() => setMsg(null), 2000)
      setDeactivateTarget(null)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al desactivar'), ok: false })
    } finally {
      setModalLoading(false)
    }
  }

  const handleReactivate = async (id: string) => {
    try {
      await apiClient.put(`/admin/users/${id}/reactivate`, {})
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u))
      setMsg({ text: '✅ Usuario reactivado', ok: true })
      setTimeout(() => setMsg(null), 2000)
    } catch { }
  }

  const handleExtend = async (id: string, days: number) => {
    try {
      await apiClient.put(`/admin/users/${id}/extend`, { planDays: days })
      setMsg({ text: `✅ Suscripción extendida ${days} días`, ok: true })
      setTimeout(() => { setMsg(null); loadData() }, 2000)
    } catch { }
  }

  const confirmResetPassword = async () => {
    if (!resetPasswordTarget) return
    const pwdError = validatePassword(resetPasswordValue)
    if (pwdError) {
      setMsg({ text: pwdError, ok: false })
      return
    }
    setModalLoading(true)
    try {
      const res = await apiClient.put(`/admin/users/${resetPasswordTarget.id}/reset-password`, {
        newPassword: resetPasswordValue,
      })
      const creds = res.data.credentials as {
        fullName: string
        email: string
        dni: string
        role: string
        temporaryPassword: string
      }
      setResetPasswordTarget(null)
      setResetPasswordValue('')
      setStudentCredentials({
        fullName: creds.fullName,
        email: creds.email,
        dni: creds.dni,
        role: creds.role,
        temporaryPassword: creds.temporaryPassword,
      })
      setMsg({ text: '🔑 Contraseña restablecida', ok: true })
      setTimeout(() => setMsg(null), 3000)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al restablecer contraseña'), ok: false })
    } finally {
      setModalLoading(false)
    }
  }

  const confirmDeletePermanent = async () => {
    if (!deleteTarget) return
    setModalLoading(true)
    try {
      await apiClient.delete(`/admin/users/${deleteTarget.id}/permanent`)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setMsg({ text: '🗑️ Usuario eliminado permanentemente', ok: false })
      setTimeout(() => setMsg(null), 3000)
      setDeleteTarget(null)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al eliminar'), ok: false })
    } finally {
      setModalLoading(false)
    }
  }

  const openEditUser = (u: User) => {
    setEditTarget(u)
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      dni: u.dni,
      rank: u.rank,
      unit: u.unit,
    })
  }

  const confirmSaveEdit = async () => {
    if (!editTarget) return
    setModalLoading(true)
    try {
      await apiClient.put(`/admin/users/${editTarget.id}`, editForm)
      setUsers(prev => prev.map(u => u.id === editTarget.id ? { ...u, ...editForm } : u))
      setMsg({ text: '✅ Usuario actualizado', ok: true })
      setTimeout(() => setMsg(null), 2500)
      setEditTarget(null)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al actualizar usuario'), ok: false })
    } finally {
      setModalLoading(false)
    }
  }

  const [referenceNow] = useState(() => Date.now())

  const daysLeft = (expiresAt?: string | null) => {
    if (!expiresAt) return null
    return Math.ceil((new Date(expiresAt).getTime() - referenceNow) / 86400000)
  }

  const students = users.filter(u => u.role === 'Student')
  const activeUsers = students.filter(u => u.isActive)
  const inactiveUsers = students.filter(u => !u.isActive)
  const pendingPayment = students.filter(u => u.isActive && u.planType === 'Free')

  const createExpiry = (() => {
    if (!form.activationDate || !form.planDays) return null
    const d = new Date(form.activationDate)
    d.setDate(d.getDate() + Number(form.planDays))
    return d
  })()

  const userSubTabs: { key: UserSubTab; label: string; count: number | null; href: string }[] = [
    { key: 'activos', label: 'Activos', count: activeUsers.length, href: '/admin?tab=users&sub=activos' },
    { key: 'inactivos', label: 'Inactivos', count: inactiveUsers.length, href: '/admin?tab=users&sub=inactivos' },
    { key: 'crear', label: 'Crear usuario', count: null, href: '/admin?tab=users&sub=crear' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        .input-admin { width:100%; padding:10px 14px; border-radius:10px; background:rgba(0,5,2,0.8); border:1px solid #ffffff15; color:#fff; font-size:13px; outline:none; }
        .input-admin:focus { border-color: ${NEON}50; }
        .input-admin::placeholder { color:#4B5563; }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {user?.tenantName ? `${user.tenantName}` : 'Panel Admin'} 🛡️
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isAdminAgencia(user?.role, user?.tenantType)
              ? 'Gestión de tu agencia'
              : 'Gestión de tu academia'}
          </p>
        </div>
        <div className="flex gap-4 text-right text-sm">
          <div><span className="font-bold" style={{ color: NEON }}>{activeUsers.length}</span> <span className="text-gray-500">activos</span></div>
          <div><span className="font-bold" style={{ color: GOLD }}>{pendingPayment.length}</span> <span className="text-gray-500">sin pago</span></div>
          <div><span className="font-bold" style={{ color: RED }}>{inactiveUsers.length}</span> <span className="text-gray-500">inactivos</span></div>
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium fade-in"
          style={{ backgroundColor: msg.ok ? 'rgba(74,124,89,0.1)' : 'rgba(255,82,82,0.1)', border: `1px solid ${msg.ok ? NEON : RED}40`, color: msg.ok ? NEON : RED }}>
          {msg.text}
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="fade-in space-y-4">
          {loading ? (
            <p className="text-gray-500 text-center py-12">Cargando dashboard...</p>
          ) : dashData ? (
            <>
              {tenantProfile && (
                <TenantAccessUrl
                  slug={tenantProfile.slug}
                  customDomain={tenantProfile.customDomain}
                />
              )}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Alumnos registrados', value: dashData.totalUsers, color: NEON },
                  { label: 'Exámenes realizados', value: dashData.examsCompleted, color: NEON2 },
                  { label: 'Tasa aprobación', value: `${dashData.passRate}%`, color: GOLD },
                  { label: 'Suscripciones activas', value: dashData.activeSubscriptions, color: NEON },
                  { label: 'Pagos pendientes', value: dashData.pendingSubscriptions, color: GOLD },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-4"
                    style={{ background: 'rgba(0,10,5,0.9)', border: '1px solid #ffffff10' }}>
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-4" style={{ background: 'rgba(0,10,5,0.9)', border: '1px solid #ffffff10' }}>
                  <h3 className="text-white font-semibold mb-3">🏆 Top alumnos</h3>
                  {dashData.ranking.length === 0 ? (
                    <p className="text-gray-500 text-sm">Sin datos aún</p>
                  ) : dashData.ranking.map((r) => (
                    <div key={r.userId} className="flex justify-between text-sm py-1.5 border-b border-white/5">
                      <span className="text-gray-300">{r.position}. {r.fullName}</span>
                      <span style={{ color: NEON }}>{r.avgScore}% · {r.examsCount} ex.</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl p-4" style={{ background: 'rgba(0,10,5,0.9)', border: '1px solid #ffffff10' }}>
                  <h3 className="text-white font-semibold mb-3">👤 Accesos recientes</h3>
                  {dashData.recentAccess.length === 0 ? (
                    <p className="text-gray-500 text-sm">Ningún alumno ha iniciado sesión aún</p>
                  ) : dashData.recentAccess.map((u) => (
                    <div key={u.id} className="flex justify-between gap-2 text-sm py-1.5 border-b border-white/5">
                      <span className="text-gray-300 truncate">{u.fullName}</span>
                      <span className="text-gray-500 text-xs shrink-0">
                        {formatRelativeTime(u.lastLogin)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {dashData.pendingSubscriptions > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${GOLD}20` }}>
                  <h3 className="text-white font-semibold mb-3">Pagos por aprobar</h3>
                  <div className="space-y-3">
                    {subscriptions.map(sub => {
                      const days = inferDays(sub.amountPaid)
                      return (
                        <div key={sub.id} className="rounded-xl p-4"
                          style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${GOLD}15` }}>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-bold" style={{ color: GOLD }}>S/. {sub.amountPaid}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>{sub.paymentMethod}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${NEON}10`, color: NEON }}>→ {days} días</span>
                              </div>
                              <div className="text-gray-400 text-xs">
                                Ref: <span className="text-white">{sub.paymentReference || 'Sin referencia'}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleApprove(sub)}
                                className="px-4 py-2 rounded-lg text-sm font-bold"
                                style={{ backgroundColor: NEON, color: '#000' }}>
                                Aprobar {days}d
                              </button>
                              <button type="button" onClick={() => { setRejectReason(''); setRejectTarget(sub.id) }}
                                className="px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ backgroundColor: `${RED}15`, color: RED, border: `1px solid ${RED}30` }}>
                                Rechazar
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {tab === 'users' && (
        <div className="fade-in space-y-4">
          <div className="flex gap-2 flex-wrap border-b border-white/10 pb-3">
            {userSubTabs.map((st) => (
              <Link key={st.key} href={st.href}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: userSub === st.key ? (st.key === 'inactivos' ? RED : NEON) : 'rgba(0,10,5,0.8)',
                  color: userSub === st.key ? '#000' : '#9CA3AF',
                  border: `1px solid ${userSub === st.key ? (st.key === 'inactivos' ? RED : NEON) : '#ffffff10'}`,
                }}>
                {st.label}
                {st.count !== null && st.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: userSub === st.key ? '#000' : st.key === 'inactivos' ? RED : NEON, color: '#fff' }}>
                    {st.count}
                  </span>
                )}
              </Link>
            ))}
          </div>

      {userSub === 'activos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {activeUsers.length} usuario{activeUsers.length !== 1 ? 's' : ''} activo{activeUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-gray-500 text-center py-12">Cargando usuarios...</div>
            ) : activeUsers.length === 0 ? (
              <div className="text-center py-12 rounded-2xl"
                style={{ background: 'rgba(0,10,5,0.8)', border: `1px solid ${NEON}15` }}>
                <div className="text-4xl mb-3">👥</div>
                <p className="text-gray-500">No hay usuarios activos en esta categoría</p>
              </div>
            ) : activeUsers.map(u => {
              const days = daysLeft(u.subscription?.expiresAt)
              const expired = days !== null && days <= 0
              const warning = days !== null && days > 0 && days <= 7
              const noSub = u.planType === 'Free' || !u.subscription
              return (
                <div key={u.id} className="rounded-2xl p-4"
                  style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${expired ? RED : warning ? GOLD : noSub ? `${GOLD}40` : NEON}15` }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold">{u.fullName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: u.planType === 'Premium' ? `${NEON}20` : `${GOLD}15`, color: u.planType === 'Premium' ? NEON : GOLD }}>
                          {u.planType}
                        </span>
                        {!u.createdByAdmin && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${NEON2}15`, color: NEON2 }}>🌐 Web</span>
                        )}
                        {noSub && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>⏳ Sin pago</span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        {u.email} · DNI {u.dni} · {u.rank} · {u.unit}
                      </div>
                      {u.subscription && (
                        <div className="text-xs mt-1.5 font-medium"
                          style={{ color: expired ? RED : warning ? GOLD : NEON }}>
                          {expired ? '⚠️ Vencido'
                            : warning ? `⚡ Vence en ${days} días`
                            : `✓ Activo desde ${u.subscription.startsAt ? new Date(u.subscription.startsAt).toLocaleDateString('es-PE') : '—'} hasta ${new Date(u.subscription.expiresAt).toLocaleDateString('es-PE')} (${days} días)`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {u.role === 'Student' && (
                        <>
                          <button type="button" onClick={() => openEditUser(u)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: `${NEON2}15`, color: NEON2, border: `1px solid ${NEON2}25` }}>
                            ✏️ Editar
                          </button>
                          <button type="button" onClick={() => { setResetPasswordTarget(u); setResetPasswordValue('') }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}35` }}>
                            🔑 Restablecer clave
                          </button>
                        </>
                      )}
                      <button onClick={() => handleExtend(u.id, 30)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${NEON2}15`, color: NEON2, border: `1px solid ${NEON2}25` }}>+30d</button>
                      <button onClick={() => handleExtend(u.id, 60)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}25` }}>+60d</button>
                      <button onClick={() => handleExtend(u.id, 180)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${NEON}15`, color: NEON, border: `1px solid ${NEON}25` }}>+180d</button>
                      <button type="button" onClick={() => handleDeactivate(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${RED}15`, color: RED, border: `1px solid ${RED}25` }}>Desactivar</button>
                      {u.role === 'Student' && (
                        <button type="button" onClick={() => setDeleteTarget({ id: u.id, name: u.fullName })}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: `${RED}12`, color: RED, border: `1px solid ${RED}25` }}>
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {userSub === 'inactivos' && (
        <div>
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: `rgba(255,82,82,0.06)`, border: `1px solid ${RED}25` }}>
            <span className="text-2xl">🔴</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: RED }}>Usuarios desactivados</p>
              <p className="text-xs text-gray-500 mt-0.5">Sin acceso a la plataforma. Puedes reactivarlos o extender su plan.</p>
            </div>
            <span className="ml-auto text-2xl font-bold" style={{ color: RED }}>{inactiveUsers.length}</span>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-600 ml-auto">
              {inactiveUsers.length} inactivo{inactiveUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-gray-500 text-center py-12">Cargando...</div>
            ) : inactiveUsers.length === 0 ? (
              <div className="text-center py-12 rounded-2xl"
                style={{ background: 'rgba(0,10,5,0.8)', border: `1px solid ${RED}15` }}>
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-500">No hay usuarios inactivos en esta categoría</p>
              </div>
            ) : inactiveUsers.map(u => {
              const days = daysLeft(u.subscription?.expiresAt)
              return (
                <div key={u.id} className="rounded-2xl p-4"
                  style={{ background: 'rgba(5,2,2,0.9)', border: `1px solid ${RED}15`, opacity: 0.85 }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-300 font-semibold">{u.fullName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${RED}20`, color: RED }}>Inactivo</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: u.planType === 'Premium' ? `${NEON}15` : `${GOLD}10`, color: u.planType === 'Premium' ? NEON : GOLD }}>
                          {u.planType}
                        </span>
                        {!u.createdByAdmin && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${NEON2}10`, color: NEON2 }}>🌐 Web</span>
                        )}
                      </div>
                      <div className="text-gray-600 text-xs mt-1">
                        {u.email} · DNI {u.dni} · {u.rank} · {u.unit}
                      </div>
                      {u.subscription ? (
                        <div className="text-xs mt-1.5 font-medium text-gray-500">
                          Plan hasta: {new Date(u.subscription.expiresAt).toLocaleDateString('es-PE')}
                          {days !== null && (
                            <span style={{ color: RED }}> · {days < 0 ? `Vencido hace ${Math.abs(days)} días` : `${days} días restantes`}</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs mt-1.5 text-gray-600">Sin suscripción registrada</div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      {u.role === 'Student' && (
                        <>
                          <button type="button" onClick={() => openEditUser(u)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: `${NEON2}10`, color: NEON2, border: `1px solid ${NEON2}20` }}>
                            ✏️ Editar
                          </button>
                          <button type="button" onClick={() => { setResetPasswordTarget(u); setResetPasswordValue('') }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}30` }}>
                            🔑 Restablecer clave
                          </button>
                        </>
                      )}
                      <button onClick={() => handleExtend(u.id, 30)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${NEON2}10`, color: NEON2, border: `1px solid ${NEON2}20` }}>+30d</button>
                      <button onClick={() => handleExtend(u.id, 60)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${GOLD}10`, color: GOLD, border: `1px solid ${GOLD}20` }}>+60d</button>
                      <button onClick={() => handleExtend(u.id, 180)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${NEON}10`, color: NEON, border: `1px solid ${NEON}20` }}>+180d</button>
                      <button onClick={() => handleReactivate(u.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: '#000' }}>
                        ✅ Reactivar
                      </button>
                      <button onClick={() => setDeleteTarget({ id: u.id, name: u.fullName })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'rgba(255,82,82,0.15)', color: '#FF5252', border: '1px solid #FF525230' }}>
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {userSub === 'crear' && (
        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(0,10,5,0.9)', border: `1px solid ${NEON}20` }}>
          <h2 className="text-white font-bold text-lg mb-5">Crear usuario con acceso directo</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Nombre completo *', key: 'fullName', placeholder: 'Juan Pérez Torres' },
                { label: 'DNI * (8 dígitos)', key: 'dni', placeholder: '12345678' },
                { label: 'Email (Gmail) *', key: 'email', placeholder: 'juan@gmail.com', type: 'email' },
                { label: 'Contraseña temporal *', key: 'password', placeholder: 'Mínimo 8 caracteres', type: 'password' },
                { label: 'Grado *', key: 'rank', placeholder: 'Suboficial de 3ra' },
                { label: 'Unidad *', key: 'unit', placeholder: 'Comisaría Lima Norte' },
              ].map(field => {
                const fieldKey = field.key as keyof typeof form
                return (
                <div key={field.key}>
                  <label className="block text-xs text-gray-500 mb-1.5">{field.label}</label>
                  <input className="input-admin" type={field.type || 'text'} placeholder={field.placeholder}
                    value={String(form[fieldKey])}
                    onChange={e => setForm({ ...form, [fieldKey]: e.target.value })} required />
                  {field.key === 'password' && <PasswordPolicyHint password={form.password} />}
                </div>
              )})}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Balotario de preguntas *</label>
              <div className="grid md:grid-cols-2 gap-3">
                {ASCENSO_TRACK_OPTIONS.map((track) => (
                  <button key={track.value} type="button"
                    onClick={() => setForm({ ...form, trackType: track.value })}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      border: `2px solid ${form.trackType === track.value ? NEON : '#ffffff10'}`,
                      backgroundColor: form.trackType === track.value ? 'rgba(74,124,89,0.08)' : 'rgba(0,10,5,0.5)',
                    }}>
                    <div className="font-bold text-white text-sm">{track.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: form.trackType === track.value ? NEON : '#6B7280' }}>
                      Acceso solo a preguntas de {track.label.toLowerCase()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Plan de acceso *</label>
              <div className="grid grid-cols-3 gap-3">
                {SUBSCRIPTION_PLANS.map(plan => (
                  <button key={plan.days} type="button"
                    onClick={() => setForm({ ...form, planDays: plan.days })}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{ border: `2px solid ${form.planDays === plan.days ? NEON : '#ffffff10'}`, backgroundColor: form.planDays === plan.days ? 'rgba(74,124,89,0.08)' : 'rgba(0,10,5,0.5)' }}>
                    <div className="font-bold text-white text-sm">{plan.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: form.planDays === plan.days ? NEON : '#6B7280' }}>
                      {formatPlanPrice(plan.price)} · {plan.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Fecha de activación *</label>
                <input type="date" className="input-admin" required
                  value={form.activationDate}
                  onChange={(e) => setForm({ ...form, activationDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Expira (automático)</label>
                <div className="input-admin flex items-center" style={{ color: NEON }}>
                  {createExpiry
                    ? createExpiry.toLocaleDateString('es-PE')
                    : '—'}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Se calcula: activación + {form.planDays} días del plan elegido.
                </p>
              </div>
            </div>

            {/* IMPORTAR DESDE EXCEL */}
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${PURPLE}25` }}>
              <h3 className="text-white font-bold text-sm mb-1">📊 Carga masiva desde Excel</h3>
              <p className="text-gray-500 text-xs mb-3">
                Sube un Excel con columnas: Nombre, DNI, Email, Contraseña, Grado, Unidad, Días (30/60/180)
              </p>
              <div className="flex gap-3 flex-wrap">
                <button type="button" onClick={handleDownloadExcelTemplate}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: `${NEON2}15`, color: NEON2, border: `1px solid ${NEON2}25` }}>
                  ⬇️ Descargar plantilla Excel
                </button>
                <button type="button" onClick={() => excelInputRef.current?.click()} disabled={uploadingExcel}
                  className="px-4 py-2 rounded-xl text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, ${PURPLE}, #7C3AED)`, color: '#fff', opacity: uploadingExcel ? 0.7 : 1 }}>
                  {uploadingExcel ? 'Importando...' : '📁 Subir Excel'}
                </button>
                <input ref={excelInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: '#000', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creando...' : '➕ Crear usuario con acceso inmediato'}
            </button>
          </form>
        </div>
      )}
        </div>
      )}

      <Modal
        open={editTarget != null}
        onClose={() => { if (!modalLoading) setEditTarget(null) }}
        title="✏️ Editar usuario"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={modalLoading} onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button size="sm" loading={modalLoading} onClick={confirmSaveEdit}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre completo</label>
            <input className="input-admin" value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input type="email" className="input-admin" value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">DNI</label>
            <input maxLength={8} className="input-admin" value={editForm.dni}
              onChange={(e) => setEditForm({ ...editForm, dni: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Grado</label>
            <input className="input-admin" value={editForm.rank}
              onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Unidad</label>
            <input className="input-admin" value={editForm.unit}
              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        open={deactivateTarget != null}
        onClose={() => { if (!modalLoading) setDeactivateTarget(null) }}
        title="⛔ Desactivar usuario"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={modalLoading}
              onClick={() => setDeactivateTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={modalLoading} onClick={confirmDeactivate}>
              Desactivar
            </Button>
          </>
        }
      >
        <p>
          ¿Desactivar a <strong className="text-white">{deactivateTarget?.name}</strong>?
          Perderá acceso hasta que lo reactives.
        </p>
      </Modal>

      <Modal
        open={rejectTarget != null}
        onClose={() => { if (!modalLoading) { setRejectTarget(null); setRejectReason('') } }}
        title="❌ Rechazar pago"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={modalLoading}
              onClick={() => { setRejectTarget(null); setRejectReason('') }}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={modalLoading}
              disabled={!rejectReason.trim()} onClick={confirmReject}>
              Rechazar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>Indica el motivo del rechazo. El usuario lo verá en su notificación.</p>
          <textarea
            className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ej: El comprobante no coincide con el monto"
          />
        </div>
      </Modal>

      <Modal
        open={resetPasswordTarget != null}
        onClose={() => { if (!modalLoading) { setResetPasswordTarget(null); setResetPasswordValue('') } }}
        title="🔑 Restablecer contraseña del alumno"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={modalLoading}
              onClick={() => { setResetPasswordTarget(null); setResetPasswordValue('') }}>
              Cancelar
            </Button>
            <Button size="sm" loading={modalLoading} onClick={confirmResetPassword}>
              Restablecer
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-400 mb-3">
          Nueva contraseña temporal para{' '}
          <strong className="text-white">{resetPasswordTarget?.fullName}</strong>.
          El alumno deberá cambiarla en su próximo ingreso.
        </p>
        <input type="password" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
          style={{ background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }}
          value={resetPasswordValue}
          onChange={(e) => setResetPasswordValue(e.target.value)}
          placeholder="Nueva contraseña temporal"
        />
        <PasswordPolicyHint password={resetPasswordValue} />
      </Modal>

      <CredentialsModal
        open={studentCredentials != null}
        credentials={studentCredentials}
        onClose={() => setStudentCredentials(null)}
        title="🔑 Credenciales del alumno"
        description="Entrega estas credenciales al alumno. En su próximo ingreso deberá definir una contraseña nueva."
      />

      <Modal
        open={deleteTarget != null}
        onClose={() => { if (!modalLoading) setDeleteTarget(null) }}
        title="⚠️ Eliminar usuario"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={modalLoading} onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={modalLoading} onClick={confirmDeletePermanent}>
              Eliminar permanentemente
            </Button>
          </>
        }
      >
        <p>
          ¿Eliminar <strong className="text-white">PERMANENTEMENTE</strong> a{' '}
          <strong className="text-white">{deleteTarget?.name}</strong>? Se borrarán sus sesiones,
          respuestas y suscripciones. Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}

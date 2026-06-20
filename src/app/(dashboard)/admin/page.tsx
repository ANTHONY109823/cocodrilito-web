'use client'

import { Suspense, useCallback, useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppNavLink } from '@/components/navigation/AppNavLink'
import apiClient from '@/lib/api/client'
import { getApiErrorMessage } from '@/lib/api/errors'
import { isTenantAdmin, getPostLoginPath } from '@/lib/auth/roles'
import { tenantAdminApi, type AdminDashboardData, type TenantProfile } from '@/lib/api/tenantAdmin'
import { formatRelativeTime } from '@/lib/utils/relativeTime'
import {
  NEON,
  SKY as NEON2,
  GOLD_BRIGHT as GOLD,
  RED_BRIGHT as RED,
  PURPLE_ACCENT as PURPLE,
  POLICE_GREEN_DARK,
  SURFACE_CARD,
  SURFACE,
  TEXT_MUTED,
  primaryMix,
  warningMix,
  skyMix,
  purpleMix,
  redBrightMix,
  goldBrightMix,
} from '@/lib/constants/theme'
import {
  SUBSCRIPTION_PLANS,
  formatPlanPrice,
  inferDaysFromAmount,
} from '@/lib/constants/subscriptionPlans'
import { ASCENSO_TRACK_OPTIONS, DEFAULT_QUESTION_TRACK, trackLabel } from '@/lib/constants/trackTypes'
import {
  CURRENT_GRADE_SELECT_OPTIONS,
  promotionGradeLabel,
  PROMOTION_GRADE_OPTIONS,
  PROMOTION_HIERARCHY_OPTIONS,
  hierarchyFromGrade,
  trackFromGrade,
  applyCurrentGradeSelection,
  rankLabelFromCurrentGrade,
  parseCurrentGradeFromText,
  inferCurrentGradeFromPostulation,
  studentClassificationFromCurrentGrade,
  resolveUserClassificationLabels,
} from '@/lib/constants/promotionGrades'
import { TenantAccessUrl } from '@/components/tenant/TenantAccessUrl'
import { Modal, Button } from '@/components/ui'
import { CredentialsModal, type AdminCredentials } from '@/components/admin/CredentialsModal'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'
import {
  buildStudentFullName,
  generateStudentLoginUsername,
  generateStudentLoginUsernameFromParts,
} from '@/lib/utils/studentLoginUsername'
import {
  type ExcelPreviewRow,
  normalizePreviewRowsFromApi,
  updatePreviewRowField,
} from '@/lib/admin/excelImportPreview'
interface User {
  id: string
  fullName: string
  email: string
  loginUsername?: string | null
  dni: string
  rank: string
  unit: string
  planType: string
  role: string
  isActive: boolean
  createdByAdmin: boolean
  createdAt: string
  activeTrackType?: string | null
  promotionGrade?: string | null
  promotionHierarchy?: string | null
  allowedTrackTypes?: string[]
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

type AdminTab = 'dashboard' | 'users'
type UserSubTab = 'activos' | 'inactivos' | 'crear'

function AdminPageLoading() {
  return <p className="py-12 text-center text-[var(--color-text-muted)]">Cargando panel...</p>
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <AdminPageContent />
    </Suspense>
  )
}

function AdminPageContent() {
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
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotal, setUsersTotal] = useState(0)
  const USERS_PAGE_SIZE = 50
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const excelPreviewInputRef = useRef<HTMLInputElement>(null)
  const [previewingExcel, setPreviewingExcel] = useState(false)
  const [confirmingExcel, setConfirmingExcel] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null)
  const [excelPreviewOpen, setExcelPreviewOpen] = useState(false)
  const [excelPreviewFileName, setExcelPreviewFileName] = useState('')
  const [excelPreviewRows, setExcelPreviewRows] = useState<ExcelPreviewRow[]>([])

  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    fullName: '', dni: '',
    currentGrade: null as number | null,
    trackType: DEFAULT_QUESTION_TRACK,
    promotionGrade: null as number | null,
  })

  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string } | null>(null)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null)
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [studentCredentials, setStudentCredentials] = useState<AdminCredentials | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false)
  const [createdUser, setCreatedUser] = useState<{
    fullName: string; loginUsername?: string; dni: string; temporaryPassword?: string; planDays: number; expiresAt?: string
    currentGradeLabel?: string; postulationGradeLabel?: string; trackLabel?: string
    hierarchyLabel?: string; categoryLabel?: string
  } | null>(null)

  const [form, setForm] = useState({
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    dni: '',
    currentGrade: null as number | null,
    planDays: 180,
    trackType: DEFAULT_QUESTION_TRACK,
    promotionGrade: null as number | null,
    activationDate: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    if (rawTab === 'inactive') router.replace('/admin?tab=users&sub=inactivos')
    else if (rawTab === 'create') router.replace('/admin?tab=users&sub=crear')
    else if (rawTab === 'subscriptions' || rawTab === 'ventas' || rawTab === 'plans') router.replace('/admin')
  }, [rawTab, router])

  const handleCurrentGradeChange = (value: number) => {
    const applied = applyCurrentGradeSelection(value)
    if (!applied) return
    setForm((prev) => ({ ...prev, ...applied }))
  }

  const handleEditCurrentGradeChange = (value: number) => {
    const applied = applyCurrentGradeSelection(value)
    if (!applied) return
    setEditForm((prev) => ({ ...prev, ...applied }))
  }

  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false
    if (!silent) {
      setLoading(true)
      setLoadError(null)
    }
    try {
      if (tab === 'dashboard') {
        const dashRes = await tenantAdminApi.getDashboard()
        setDashData(dashRes.data)

        void Promise.allSettled([
          tenantAdminApi.getProfile(),
          apiClient.get('/subscriptions/pending'),
        ]).then(([profileRes, subsRes]) => {
          if (profileRes.status === 'fulfilled') setTenantProfile(profileRes.value.data)
          if (subsRes.status === 'fulfilled') setSubscriptions(subsRes.value.data ?? [])
        })
      } else if (tab === 'users') {
        const res = await apiClient.get(`/admin/users?page=${usersPage}&pageSize=${USERS_PAGE_SIZE}`)
        const data = res.data as User[] | { items: User[]; total: number }
        if (Array.isArray(data)) {
          setUsers(data)
          setUsersTotal(data.length)
        } else {
          setUsers(data.items ?? [])
          setUsersTotal(data.total ?? 0)
        }
      }
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'No se pudo cargar el panel. Intenta de nuevo.'))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [tab, usersPage])

  const handleExcelPreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewingExcel(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/admin/users/import/excel/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const data = res.data as {
        fileName?: string
        rows?: ExcelPreviewRow[]
        message?: string
      }
      const rows = normalizePreviewRowsFromApi(data.rows ?? [])
      setExcelPreviewFileName(data.fileName ?? file.name)
      setExcelPreviewRows(rows)
      setExcelPreviewOpen(true)
      setMsg({
        text: rows.length > 0
          ? `📋 ${rows.filter((r) => r.valid).length} filas listas · ${rows.filter((r) => !r.valid).length} con error — revise antes de grabar`
          : '⚠️ El archivo no contiene filas de datos',
        ok: rows.some((r) => r.valid),
      })
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al leer el Excel'), ok: false })
    } finally {
      setPreviewingExcel(false)
      if (excelPreviewInputRef.current) excelPreviewInputRef.current.value = ''
    }
  }

  const handleExcelConfirm = async () => {
    const validRows = excelPreviewRows.filter((r) => r.valid)
    if (validRows.length === 0) {
      setMsg({ text: 'No hay filas válidas para importar', ok: false })
      return
    }
    setConfirmingExcel(true)
    try {
      const res = await apiClient.post('/admin/users/import/excel/confirm', {
        rows: validRows.map((r) => ({
          rowNumber: r.rowNumber,
          firstName: r.firstName,
          paternalSurname: r.paternalSurname,
          maternalSurname: r.maternalSurname,
          dni: r.dni,
          fullName: r.fullName,
          loginUsername: r.loginUsername,
          rankLabel: r.rankLabel,
          planDays: r.planDays,
          promotionGrade: r.promotionGrade,
          currentPromotionGrade: r.currentGrade,
          trackType: r.trackType,
        })),
      })
      const data = res.data as { created?: number; failed?: number; errors?: string[]; message?: string }
      const created = data.created ?? 0
      const errors = data.errors ?? []
      setImportResult({ created, failed: data.failed ?? errors.length, errors })
      setMsg({
        text: created > 0
          ? `✅ ${created} usuarios creados${errors.length ? ` · ${errors.length} filas con error` : ''}`
          : `⚠️ No se importó ningún usuario${errors.length ? ` · ${errors.length} errores` : ''}`,
        ok: created > 0,
      })
      if (created > 0) {
        setExcelPreviewOpen(false)
        setExcelPreviewRows([])
        setExcelPreviewFileName('')
        void loadData()
      }
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al grabar usuarios'), ok: false })
    } finally {
      setConfirmingExcel(false)
    }
  }

  const patchExcelPreviewRow = (rowNumber: number, field: keyof ExcelPreviewRow, value: string | number) => {
    setExcelPreviewRows((rows) => updatePreviewRowField(rows, rowNumber, field, value))
  }

  const handleDownloadExcelTemplate = async () => {
    try {
      const res = await apiClient.get('/admin/users/import/template', { responseType: 'blob' })
      const url = window.URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla_usuarios_agencia.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'No se pudo descargar la plantilla'), ok: false })
    }
  }

  useEffect(() => { loadFromStorage() }, [])

  useEffect(() => {
    if (!user) return
    if (!isTenantAdmin(user.role)) {
      router.replace(getPostLoginPath(user.role))
      return
    }
    const hasCachedData = tab === 'dashboard' ? Boolean(dashData) : users.length > 0
    void loadData({ silent: hasCachedData })
  }, [user, loadData, router, tab, usersPage])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.paternalSurname.trim()) {
      setMsg({ text: 'Indica nombres y apellido paterno', ok: false })
      return
    }
    if (form.dni.length !== 8 || !/^\d+$/.test(form.dni)) {
      setMsg({ text: 'El DNI debe tener 8 dígitos', ok: false })
      return
    }
    if (form.currentGrade == null) {
      setMsg({ text: 'Selecciona el grado PNP actual', ok: false })
      return
    }
    setCreateConfirmOpen(true)
  }

  const confirmCreateUser = async () => {
    setCreateConfirmOpen(false)
    setSaving(true)
    setMsg(null)
    try {
      const savedForm = { ...form }
      const fullName = buildStudentFullName(
        savedForm.firstName,
        savedForm.paternalSurname,
        savedForm.maternalSurname
      )
      const rank = rankLabelFromCurrentGrade(savedForm.currentGrade!)
      const res = await apiClient.post('/admin/users', {
        fullName,
        dni: savedForm.dni,
        password: savedForm.dni,
        rank,
        unit: '',
        planDays: savedForm.planDays,
        trackType: trackFromGrade(savedForm.promotionGrade!),
        promotionGrade: savedForm.promotionGrade,
        startsAt: savedForm.activationDate,
      })
      const data = res.data as {
        fullName?: string
        loginUsername?: string
        temporaryPassword?: string
        expiresAt?: string
        planDays?: number
      }
      setCreatedUser({
        fullName: data.fullName ?? fullName,
        loginUsername:
          data.loginUsername ??
          generateStudentLoginUsernameFromParts(savedForm.firstName, savedForm.paternalSurname) ??
          undefined,
        dni: savedForm.dni,
        temporaryPassword: data.temporaryPassword ?? savedForm.dni,
        planDays: data.planDays ?? savedForm.planDays,
        expiresAt: data.expiresAt,
        currentGradeLabel: CURRENT_GRADE_SELECT_OPTIONS.find((g) => g.value === savedForm.currentGrade)?.label,
        postulationGradeLabel: promotionGradeLabel(savedForm.promotionGrade!),
        trackLabel: trackLabel(savedForm.trackType),
        hierarchyLabel: studentClassificationFromCurrentGrade(savedForm.currentGrade)?.hierarchyLabel,
        categoryLabel: studentClassificationFromCurrentGrade(savedForm.currentGrade)?.categoryLabel,
      })
      setForm({
        firstName: '',
        paternalSurname: '',
        maternalSurname: '',
        dni: '',
        currentGrade: null,
        planDays: 180,
        trackType: DEFAULT_QUESTION_TRACK,
        promotionGrade: null,
        activationDate: new Date().toISOString().slice(0, 10),
      })
      router.push('/admin?tab=users&sub=activos')
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al crear usuario'), ok: false })
    } finally { setSaving(false) }
  }

  const inferDays = (amount: number) => inferDaysFromAmount(amount)

  const handleApprove = async (sub: Subscription) => {
    if (approvingId) return
    setApprovingId(sub.id)
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
    finally { setApprovingId(null) }
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
    const loadKey = `reactivate:${id}`
    if (actionLoading) return
    setActionLoading(loadKey)
    try {
      await apiClient.put(`/admin/users/${id}/reactivate`, {})
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u))
      setMsg({ text: '✅ Usuario reactivado', ok: true })
      setTimeout(() => setMsg(null), 2000)
    } catch {
      setMsg({ text: 'Error al reactivar', ok: false })
    } finally {
      setActionLoading(null)
    }
  }

  const handleExtend = async (id: string, days: number) => {
    const loadKey = `extend:${id}:${days}`
    if (actionLoading) return
    setActionLoading(loadKey)
    try {
      const res = await apiClient.put(`/admin/users/${id}/extend`, { planDays: days })
      const expiresAt = (res.data as { expiresAt?: string }).expiresAt
      setUsers(prev => prev.map(u => {
        if (u.id !== id) return u
        return {
          ...u,
          planType: 'Premium',
          subscription: {
            startsAt: u.subscription?.startsAt ?? new Date().toISOString(),
            expiresAt: expiresAt ?? u.subscription?.expiresAt ?? new Date().toISOString(),
          },
        }
      }))
      setMsg({ text: `✅ Suscripción extendida ${days} días`, ok: true })
      setTimeout(() => setMsg(null), 2000)
    } catch {
      setMsg({ text: 'Error al extender suscripción', ok: false })
    } finally {
      setActionLoading(null)
    }
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
        loginUsername?: string
        dni: string
        role: string
        temporaryPassword: string
      }
      setResetPasswordTarget(null)
      setResetPasswordValue('')
      setStudentCredentials({
        fullName: creds.fullName,
        email: creds.email,
        loginUsername: creds.loginUsername ?? resetPasswordTarget.loginUsername ?? generateStudentLoginUsername(creds.fullName) ?? undefined,
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
    const promotionValue =
      PROMOTION_GRADE_OPTIONS.find((g) => g.key === u.promotionGrade)?.value ?? null
    const currentGrade =
      parseCurrentGradeFromText(u.rank) ??
      (promotionValue != null ? inferCurrentGradeFromPostulation(promotionValue) : null)

    let trackType = DEFAULT_QUESTION_TRACK
    let promotionGrade: number | null = null

    if (currentGrade != null) {
      const applied = applyCurrentGradeSelection(currentGrade)
      if (applied) {
        trackType = applied.trackType
        promotionGrade = applied.promotionGrade
      }
    }

    setEditForm({
      fullName: u.fullName,
      dni: u.dni,
      currentGrade,
      trackType,
      promotionGrade,
    })
  }

  const confirmSaveEdit = async () => {
    if (!editTarget) return
    if (editForm.currentGrade == null || editForm.promotionGrade == null) {
      setMsg({ text: 'Selecciona el grado PNP actual', ok: false })
      return
    }
    setModalLoading(true)
    try {
      const rank = rankLabelFromCurrentGrade(editForm.currentGrade)
      await apiClient.put(`/admin/users/${editTarget.id}`, {
        fullName: editForm.fullName,
        dni: editForm.dni,
        rank,
        promotionGrade: editForm.promotionGrade,
      })
      const gradeKey =
        editForm.promotionGrade != null
          ? PROMOTION_GRADE_OPTIONS.find((g) => g.value === editForm.promotionGrade)?.key ?? null
          : null
      const hierarchyKey =
        editForm.promotionGrade != null
          ? PROMOTION_HIERARCHY_OPTIONS.find(
              (h) => h.value === hierarchyFromGrade(editForm.promotionGrade!)
            )?.key ?? null
          : null
      const trackKey = ASCENSO_TRACK_OPTIONS.find((t) => t.value === trackFromGrade(editForm.promotionGrade!))?.key
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editTarget.id
            ? {
                ...u,
                fullName: editForm.fullName,
                dni: editForm.dni,
                rank,
                activeTrackType: trackKey ?? u.activeTrackType,
                promotionGrade: gradeKey,
                promotionHierarchy: hierarchyKey,
              }
            : u
        )
      )
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

  const headerActiveCount = dashData?.activeUsers ?? activeUsers.length
  const headerPendingCount = dashData?.pendingSubscriptions ?? pendingPayment.length
  const headerInactiveCount = dashData
    ? Math.max(0, dashData.totalUsers - dashData.activeUsers)
    : inactiveUsers.length

  const createExpiry = (() => {
    if (!form.activationDate || !form.planDays) return null
    const d = new Date(form.activationDate)
    d.setDate(d.getDate() + Number(form.planDays))
    return d
  })()

  const previewFullName = buildStudentFullName(form.firstName, form.paternalSurname, form.maternalSurname)
  const previewLoginUsername = generateStudentLoginUsernameFromParts(form.firstName, form.paternalSurname)

  const userSubTabs: { key: UserSubTab; label: string; count: number | null; href: string }[] = [
    { key: 'activos', label: 'Activos', count: activeUsers.length, href: '/admin?tab=users&sub=activos' },
    { key: 'inactivos', label: 'Inactivos', count: inactiveUsers.length, href: '/admin?tab=users&sub=inactivos' },
    { key: 'crear', label: 'Crear usuario', count: null, href: '/admin?tab=users&sub=crear' },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {user?.tenantName ? `${user.tenantName}` : 'Panel Admin'} 🛡️
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de tu agencia</p>
        </div>
        <div className="flex gap-4 text-right text-sm">
          <div><span className="font-bold" style={{ color: NEON }}>{headerActiveCount}</span> <span className="text-gray-500">activos</span></div>
          <div><span className="font-bold" style={{ color: GOLD }}>{headerPendingCount}</span> <span className="text-gray-500">sin pago</span></div>
          <div><span className="font-bold" style={{ color: RED }}>{headerInactiveCount}</span> <span className="text-gray-500">inactivos</span></div>
        </div>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium fade-in"
          style={{ backgroundColor: msg.ok ? 'var(--color-primary-bg)' : 'color-mix(in srgb, var(--color-danger) 10%, transparent)', border: `1px solid ${msg.ok ? NEON : RED}40`, color: msg.ok ? NEON : RED }}>
          {msg.text}
        </div>
      )}

      {tab === 'dashboard' && (
        <div className="fade-in space-y-4">
          {loading ? (
            <p className="text-[var(--color-text-muted)] text-center py-12">Cargando dashboard...</p>
          ) : loadError ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-[var(--color-danger)] text-sm">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadData()}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white"
              >
                Reintentar
              </button>
            </div>
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
                  <div
                    key={s.label}
                    className="rounded-2xl p-4 bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]"
                  >
                    <div className="text-xs text-[var(--color-text-secondary)] mb-1 font-semibold">{s.label}</div>
                    <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-4 bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]">
                  <h3 className="text-[var(--color-text-primary)] font-semibold mb-3">🏆 Top alumnos</h3>
                  {dashData.ranking.length === 0 ? (
                    <p className="text-[var(--color-text-muted)] text-sm">Sin datos aún</p>
                  ) : dashData.ranking.map((r) => (
                    <div key={r.userId} className="flex justify-between text-sm py-1.5 border-b border-[var(--color-surface-border)]">
                      <span className="text-[var(--color-text-primary)]">{r.position}. {r.fullName}</span>
                      <span style={{ color: NEON }}>{r.avgScore}% · {r.examsCount} ex.</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl p-4 bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]">
                  <h3 className="text-[var(--color-text-primary)] font-semibold mb-3">👤 Accesos recientes</h3>
                  {dashData.recentAccess.length === 0 ? (
                    <p className="text-[var(--color-text-muted)] text-sm">Ningún alumno ha iniciado sesión aún</p>
                  ) : dashData.recentAccess.map((u) => (
                    <div key={u.id} className="flex justify-between gap-2 text-sm py-1.5 border-b border-[var(--color-surface-border)]">
                      <span className="text-[var(--color-text-primary)] truncate">{u.fullName}</span>
                      <span className="text-[var(--color-text-muted)] text-xs shrink-0">
                        {formatRelativeTime(u.lastLogin)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {dashData.pendingSubscriptions > 0 && (
                <div className="rounded-2xl p-4 panel-card" style={{ border: `1px solid ${warningMix(20)}` }}>
                  <h3 className="text-[var(--color-text-primary)] font-semibold mb-3">Pagos por aprobar</h3>
                  <div className="space-y-3">
                    {subscriptions.map(sub => {
                      const days = inferDays(sub.amountPaid)
                      return (
                        <div key={sub.id} className="rounded-xl p-4 panel-elevated"
                          style={{ border: `1px solid ${warningMix(15)}` }}>
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-bold" style={{ color: GOLD }}>S/. {sub.amountPaid}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${warningMix(15)}`, color: GOLD }}>{sub.paymentMethod}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: `${primaryMix(10)}`, color: NEON }}>→ {days} días</span>
                              </div>
                              <div className="text-gray-400 text-xs">
                                Ref: <span className="text-[var(--color-text-primary)]">{sub.paymentReference || 'Sin referencia'}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleApprove(sub)}
                                disabled={approvingId === sub.id}
                                className="px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-60"
                                style={{ backgroundColor: NEON, color: 'var(--color-text-primary)' }}>
                                {approvingId === sub.id ? 'Aprobando...' : `Aprobar ${days}d`}
                              </button>
                              <button type="button" onClick={() => { setRejectReason(''); setRejectTarget(sub.id) }}
                                className="px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ backgroundColor: `${redBrightMix(15)}`, color: RED, border: `1px solid ${redBrightMix(30)}` }}>
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
          ) : (
            <div className="text-center py-12 space-y-4">
              <p className="text-[var(--color-text-muted)] text-sm">No hay datos del panel todavía.</p>
              <button
                type="button"
                onClick={() => void loadData()}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-[var(--color-surface-border)]"
              >
                Cargar panel
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="fade-in space-y-4">
          <div className="flex gap-2 flex-wrap border-b border-[var(--color-surface-border)] pb-3">
            {userSubTabs.map((st) => (
              <AppNavLink key={st.key} href={st.href}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  backgroundColor: userSub === st.key ? (st.key === 'inactivos' ? RED : NEON) : SURFACE_CARD,
                  color: userSub === st.key ? '#000000' : TEXT_MUTED,
                  border: `1px solid ${userSub === st.key ? (st.key === 'inactivos' ? RED : NEON) : 'var(--color-surface-border)'}`,
                }}>
                {st.label}
                {st.count !== null && st.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: userSub === st.key ? '#000' : st.key === 'inactivos' ? RED : NEON, color: '#fff' }}>
                    {st.count}
                  </span>
                )}
              </AppNavLink>
            ))}
          </div>

      {userSub === 'activos' && (
        <div>
          {createdUser && (
            <div className="rounded-2xl p-4 mb-4 fade-in" style={{ background: 'var(--color-primary-bg)', border: `2px solid ${primaryMix(50)}` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold mb-2" style={{ color: NEON }}>✅ Usuario creado correctamente</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                    <span className="text-gray-500">Nombre</span>
                    <span className="text-[var(--color-text-primary)] font-medium">{createdUser.fullName}</span>
                    <span className="text-gray-500">Usuario de acceso</span>
                    <span className="text-[var(--color-text-primary)] font-bold tracking-wide">{createdUser.loginUsername ?? '—'}</span>
                    <span className="text-gray-500">Contraseña sugerida</span>
                    <span className="text-[var(--color-text-primary)] font-medium">{createdUser.temporaryPassword ?? createdUser.dni}</span>
                    <span className="text-gray-500">DNI</span>
                    <span className="text-[var(--color-text-primary)]">{createdUser.dni}</span>
                    {createdUser.currentGradeLabel && (
                      <>
                        <span className="text-gray-500">Grado actual</span>
                        <span className="text-[var(--color-text-primary)]">{createdUser.currentGradeLabel}</span>
                      </>
                    )}
                    {createdUser.postulationGradeLabel && (
                      <>
                        <span className="text-gray-500">Postula a</span>
                        <span className="text-[var(--color-text-primary)]">{createdUser.postulationGradeLabel}</span>
                      </>
                    )}
                    {createdUser.hierarchyLabel && (
                      <>
                        <span className="text-gray-500">Jerarquía</span>
                        <span className="text-[var(--color-text-primary)]">{createdUser.hierarchyLabel}</span>
                      </>
                    )}
                    {createdUser.categoryLabel && (
                      <>
                        <span className="text-gray-500">Categoría</span>
                        <span className="text-[var(--color-text-primary)]">{createdUser.categoryLabel}</span>
                      </>
                    )}
                    {createdUser.trackLabel && (
                      <>
                        <span className="text-gray-500">Balotario</span>
                        <span className="text-[var(--color-text-primary)]">{createdUser.trackLabel}</span>
                      </>
                    )}
                    <span className="text-gray-500">Plan</span>
                    <span style={{ color: NEON }}>{createdUser.planDays} días</span>
                    {createdUser.expiresAt && (
                      <>
                        <span className="text-gray-500">Vence</span>
                        <span className="text-[var(--color-text-primary)]">{new Date(createdUser.expiresAt).toLocaleDateString('es-PE')}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    El alumno ingresa con su usuario y contraseña (sugerida: su DNI) en la URL de la agencia. Puede cambiar la contraseña cuando desee.
                  </p>
                </div>
                <button type="button" onClick={() => setCreatedUser(null)}
                  className="text-gray-500 hover:text-[var(--color-text-primary)] text-lg leading-none shrink-0">✕</button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {activeUsers.length} usuario{activeUsers.length !== 1 ? 's' : ''} activo{activeUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-[var(--color-text-muted)] text-center py-12">Cargando usuarios...</div>
            ) : loadError ? (
              <div className="text-center py-12 space-y-4">
                <p className="text-[var(--color-danger)] text-sm">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white"
                >
                  Reintentar
                </button>
              </div>
            ) : activeUsers.length === 0 ? (
              <div className="text-center py-12 rounded-2xl"
                style={{ background: 'var(--color-surface-card)', border: `1px solid ${primaryMix(15)}` }}>
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
                  style={{ background: 'var(--color-surface-elevated)', border: `1px solid ${expired ? redBrightMix(15) : warning ? goldBrightMix(15) : noSub ? goldBrightMix(40) : primaryMix(15)}` }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[var(--color-text-primary)] font-semibold">{u.fullName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: u.planType === 'Premium' ? `${primaryMix(20)}` : `${warningMix(15)}`, color: u.planType === 'Premium' ? NEON : GOLD }}>
                          {u.planType}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: purpleMix(15), color: PURPLE }}>
                          📚 {trackLabel(u.activeTrackType)}
                        </span>
                        {!u.createdByAdmin && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${skyMix(15)}`, color: NEON2 }}>🌐 Web</span>
                        )}
                        {noSub && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${warningMix(15)}`, color: GOLD }}>⏳ Sin pago</span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        Usuario <span className="text-[var(--color-text-primary)] font-medium">{u.loginUsername ?? generateStudentLoginUsername(u.fullName) ?? '—'}</span>
                        {' · '}DNI {u.dni} · {u.rank}
                        {u.promotionGrade ? (
                          <> · {resolveUserClassificationLabels(u).hierarchyLabel}</>
                        ) : null}
                        {' · '}{u.unit}
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
                            style={{ backgroundColor: `${skyMix(15)}`, color: NEON2, border: `1px solid ${skyMix(25)}` }}>
                            ✏️ Editar
                          </button>
                          <button type="button" onClick={() => { setResetPasswordTarget(u); setResetPasswordValue('') }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: `${warningMix(15)}`, color: GOLD, border: `1px solid ${goldBrightMix(35)}` }}>
                            🔑 Restablecer clave
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => handleExtend(u.id, 30)}
                        disabled={Boolean(actionLoading)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
                        style={{ backgroundColor: `${skyMix(15)}`, color: NEON2, border: `1px solid ${skyMix(25)}` }}>
                        {actionLoading === `extend:${u.id}:30` ? '...' : '+30d'}
                      </button>
                      <button type="button" onClick={() => handleExtend(u.id, 60)}
                        disabled={Boolean(actionLoading)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
                        style={{ backgroundColor: `${warningMix(15)}`, color: GOLD, border: `1px solid ${goldBrightMix(25)}` }}>
                        {actionLoading === `extend:${u.id}:60` ? '...' : '+60d'}
                      </button>
                      <button type="button" onClick={() => handleExtend(u.id, 180)}
                        disabled={Boolean(actionLoading)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-60"
                        style={{ backgroundColor: `${primaryMix(15)}`, color: NEON, border: `1px solid ${primaryMix(25)}` }}>
                        {actionLoading === `extend:${u.id}:180` ? '...' : '+180d'}
                      </button>
                      <button type="button" onClick={() => handleDeactivate(u.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${redBrightMix(15)}`, color: RED, border: `1px solid ${redBrightMix(25)}` }}>Desactivar</button>
                      {u.role === 'Student' && (
                        <button type="button" onClick={() => setDeleteTarget({ id: u.id, name: u.fullName })}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: `${redBrightMix(12)}`, color: RED, border: `1px solid ${redBrightMix(25)}` }}>
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {userSub === 'activos' && usersTotal > USERS_PAGE_SIZE && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[var(--color-text-muted)]">
                Mostrando {users.length} de {usersTotal} alumnos
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={usersPage <= 1 || loading}
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg text-xs border border-[var(--color-surface-border)] disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-xs text-[var(--color-text-muted)] self-center">
                  Página {usersPage} / {Math.max(1, Math.ceil(usersTotal / USERS_PAGE_SIZE))}
                </span>
                <button
                  type="button"
                  disabled={usersPage >= Math.ceil(usersTotal / USERS_PAGE_SIZE) || loading}
                  onClick={() => setUsersPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-[var(--color-surface-border)] disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {userSub === 'inactivos' && (
        <div>
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: 'color-mix(in srgb, var(--color-danger) 6%, var(--color-surface-card))', border: `1px solid ${redBrightMix(25)}` }}>
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
                style={{ background: 'var(--color-surface-card)', border: `1px solid ${redBrightMix(15)}` }}>
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-500">No hay usuarios inactivos en esta categoría</p>
              </div>
            ) : inactiveUsers.map(u => {
              const days = daysLeft(u.subscription?.expiresAt)
              return (
                <div key={u.id} className="rounded-2xl p-4"
                  style={{ background: 'color-mix(in srgb, var(--color-danger) 10%, var(--color-surface-elevated))', border: `1px solid ${redBrightMix(15)}`, opacity: 0.85 }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-300 font-semibold">{u.fullName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${redBrightMix(20)}`, color: RED }}>Inactivo</span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: u.planType === 'Premium' ? `${primaryMix(15)}` : `${warningMix(10)}`, color: u.planType === 'Premium' ? NEON : GOLD }}>
                          {u.planType}
                        </span>
                        {!u.createdByAdmin && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${skyMix(10)}`, color: NEON2 }}>🌐 Web</span>
                        )}
                      </div>
                      <div className="text-gray-600 text-xs mt-1">
                        Usuario {u.loginUsername ?? generateStudentLoginUsername(u.fullName) ?? '—'} · DNI {u.dni} · {u.rank}
                        {u.promotionGrade ? (
                          <> · {resolveUserClassificationLabels(u).hierarchyLabel}</>
                        ) : null}
                        {' · '}{u.unit}
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
                            style={{ backgroundColor: `${skyMix(10)}`, color: NEON2, border: `1px solid ${skyMix(20)}` }}>
                            ✏️ Editar
                          </button>
                          <button type="button" onClick={() => { setResetPasswordTarget(u); setResetPasswordValue('') }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: `${warningMix(12)}`, color: GOLD, border: `1px solid ${goldBrightMix(30)}` }}>
                            🔑 Restablecer clave
                          </button>
                        </>
                      )}
                      <button onClick={() => handleExtend(u.id, 30)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${skyMix(10)}`, color: NEON2, border: `1px solid ${skyMix(20)}` }}>+30d</button>
                      <button onClick={() => handleExtend(u.id, 60)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${warningMix(10)}`, color: GOLD, border: `1px solid ${warningMix(20)}` }}>+60d</button>
                      <button onClick={() => handleExtend(u.id, 180)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: `${primaryMix(10)}`, color: NEON, border: `1px solid ${primaryMix(20)}` }}>+180d</button>
                      <button onClick={() => handleReactivate(u.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`, color: 'var(--color-text-primary)' }}>
                        ✅ Reactivar
                      </button>
                      <button onClick={() => setDeleteTarget({ id: u.id, name: u.fullName })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', color: '#FF5252', border: '1px solid #FF525230' }}>
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
        <div className="rounded-2xl p-6 panel-card" style={{ border: `1px solid ${primaryMix(20)}` }}>
          <h2 className="text-[var(--color-text-primary)] font-bold text-lg mb-5">Crear usuario con acceso directo</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Nombre(s) *', key: 'firstName', placeholder: 'Juan' },
                { label: 'Apellido paterno *', key: 'paternalSurname', placeholder: 'Pérez' },
                { label: 'Apellido materno', key: 'maternalSurname', placeholder: 'Mayta' },
                { label: 'DNI * (8 dígitos)', key: 'dni', placeholder: '12345678', maxLength: 8 },
              ].map(field => {
                const fieldKey = field.key as keyof typeof form
                return (
                <div key={field.key}>
                  <label className="block text-xs text-gray-500 mb-1.5">{field.label}</label>
                  <input
                    className="input-admin"
                    type="text"
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    value={String(form[fieldKey] ?? '')}
                    onChange={e => {
                      const value = field.key === 'dni'
                        ? e.target.value.replace(/\D/g, '').slice(0, 8)
                        : e.target.value
                      setForm({ ...form, [fieldKey]: value })
                    }}
                    required={field.key !== 'maternalSurname'}
                  />
                </div>
              )})}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Grado actual *</label>
                <select
                  className="input-admin"
                  required
                  value={form.currentGrade ?? ''}
                  onChange={(e) => handleCurrentGradeChange(Number(e.target.value))}
                >
                  <option value="" disabled>Selecciona el grado PNP</option>
                  {CURRENT_GRADE_SELECT_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                {form.promotionGrade != null && (() => {
                  const cls = studentClassificationFromCurrentGrade(form.currentGrade)
                  return (
                  <p className="text-xs mt-2 text-gray-500">
                    Postula a: <strong className="text-[var(--color-text-primary)]">{promotionGradeLabel(form.promotionGrade)}</strong>
                    {' · '}
                    Categoría: <strong className="text-[var(--color-text-primary)]">{cls?.categoryLabel ?? '—'}</strong>
                    {' · '}
                    Jerarquía: <strong className="text-[var(--color-text-primary)]">{cls?.hierarchyLabel ?? '—'}</strong>
                    {' · '}
                    Balotario: <strong className="text-[var(--color-text-primary)]">{trackLabel(form.trackType)}</strong>
                  </p>
                  )
                })()}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Plan de acceso *</label>
              <div className="grid grid-cols-3 gap-3">
                {SUBSCRIPTION_PLANS.map(plan => (
                  <button key={plan.days} type="button"
                    onClick={() => setForm({ ...form, planDays: plan.days })}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{ border: `2px solid ${form.planDays === plan.days ? NEON : 'var(--color-surface-border)'}`, backgroundColor: form.planDays === plan.days ? 'var(--color-primary-bg)' : SURFACE }}>
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

            {/* Acciones: usuario individual o carga masiva */}
            <div className="grid md:grid-cols-2 gap-3 pt-1">
              <button
                type="submit"
                disabled={saving || previewingExcel || confirmingExcel}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-opacity"
                style={{
                  background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`,
                  color: 'var(--color-text-primary)',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Grabando...' : '➕ Grabar usuario con acceso inmediato'}
              </button>
              <button
                type="button"
                onClick={() => excelPreviewInputRef.current?.click()}
                disabled={saving || previewingExcel || confirmingExcel}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-opacity"
                style={{
                  background: `linear-gradient(135deg, ${PURPLE}, #7C3AED)`,
                  color: '#fff',
                  opacity: previewingExcel ? 0.7 : 1,
                }}
              >
                {previewingExcel ? 'Leyendo Excel...' : '📋 Carga masiva Excel — revisar y grabar'}
              </button>
              <input
                ref={excelPreviewInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcelPreview}
              />
            </div>

            {/* IMPORTAR DESDE EXCEL */}
            <div className="rounded-2xl p-5 panel-elevated" style={{ border: `1px solid ${purpleMix(25)}` }}>
              <h3 className="text-[var(--color-text-primary)] font-bold text-sm mb-1">📊 Carga masiva desde Excel</h3>
              <p className="text-gray-500 text-xs mb-2">
                Para varios alumnos use el botón morado de arriba: cargue el Excel,{' '}
                <strong className="text-[var(--color-text-secondary)]">revise la tabla</strong> y grabe el bloque completo.
                También puede descargar la plantilla aquí.
              </p>
              <ul className="text-gray-500 text-xs mb-3 space-y-1 list-disc pl-4">
                <li>Columnas: Nombres, Apellido paterno, Apellido materno, DNI, Grado actual, Días plan (30/60/180).</li>
                <li>Usuario de acceso: inicial + apellido paterno (Juan Pérez → <strong className="text-[var(--color-text-secondary)]">JPEREZ</strong>).</li>
                <li>Contraseña sugerida: el DNI. Sin correo electrónico.</li>
                <li>El grado actual asigna automáticamente el balotario del ascenso siguiente.</li>
              </ul>
              {importResult && (
                <div className="rounded-xl px-3 py-2 mb-3 text-xs"
                  style={{
                    background: importResult.created > 0 ? 'var(--color-primary-bg)' : 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
                    border: `1px solid ${importResult.created > 0 ? primaryMix(35) : 'color-mix(in srgb, var(--color-danger) 35%, transparent)'}`,
                  }}>
                  <p className="font-semibold text-[var(--color-text-primary)] mb-1">
                    Importados: {importResult.created} · Errores: {importResult.failed}
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="max-h-32 overflow-y-auto space-y-0.5 text-gray-400">
                      {importResult.errors.slice(0, 20).map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                      {importResult.errors.length > 20 && (
                        <li>… y {importResult.errors.length - 20} errores más</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
              <div className="flex gap-3 flex-wrap">
                <button type="button" onClick={handleDownloadExcelTemplate}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: `${skyMix(15)}`, color: NEON2, border: `1px solid ${skyMix(25)}` }}>
                  ⬇️ Descargar plantilla Excel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
        </div>
      )}

      <Modal
        open={excelPreviewOpen}
        onClose={() => { if (!confirmingExcel) setExcelPreviewOpen(false) }}
        title="📋 Revisar y editar usuarios del Excel"
        maxWidth="max-w-[min(96vw,1280px)]"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={confirmingExcel}
              onClick={() => setExcelPreviewOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              loading={confirmingExcel}
              disabled={!excelPreviewRows.some((r) => r.valid)}
              onClick={handleExcelConfirm}
            >
              Grabar {excelPreviewRows.filter((r) => r.valid).length} usuarios
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Archivo: <strong className="text-[var(--color-text-secondary)]">{excelPreviewFileName || '—'}</strong>
            {' · '}
            {excelPreviewRows.filter((r) => r.valid).length} válidos
            {' · '}
            {excelPreviewRows.filter((r) => !r.valid).length} con error
          </p>
          <p className="text-xs text-gray-500 rounded-lg px-3 py-2" style={{ backgroundColor: `${primaryMix(8)}`, border: `1px solid ${primaryMix(20)}` }}>
            <strong className="text-[var(--color-text-secondary)]">Claves de acceso:</strong> el <strong>Usuario</strong> y el <strong>DNI</strong> (contraseña inicial).
            El grado actual define postulación, <strong>categoría</strong>, <strong>jerarquía</strong> y balotario de preguntas.
          </p>
          <div className="overflow-auto rounded-xl border border-[var(--color-surface-border)] max-h-[min(70vh,640px)]">
            <table className="w-full text-xs min-w-[1200px]">
              <thead className="sticky top-0 z-10" style={{ backgroundColor: SURFACE }}>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2 font-medium w-10">#</th>
                  <th className="px-2 py-2 font-medium min-w-[100px]">Nombres</th>
                  <th className="px-2 py-2 font-medium min-w-[100px]">Ap. paterno</th>
                  <th className="px-2 py-2 font-medium min-w-[90px]">Ap. materno</th>
                  <th className="px-2 py-2 font-medium min-w-[90px]">DNI (clave)</th>
                  <th className="px-2 py-2 font-medium min-w-[90px]">Usuario (clave)</th>
                  <th className="px-2 py-2 font-medium min-w-[140px]">Grado actual</th>
                  <th className="px-2 py-2 font-medium min-w-[90px]">Postula</th>
                  <th className="px-2 py-2 font-medium min-w-[110px]">Categoría</th>
                  <th className="px-2 py-2 font-medium min-w-[100px]">Jerarquía</th>
                  <th className="px-2 py-2 font-medium min-w-[110px]">Balotario</th>
                  <th className="px-2 py-2 font-medium min-w-[80px]">Plan</th>
                  <th className="px-2 py-2 font-medium min-w-[120px]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {excelPreviewRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    style={{
                      backgroundColor: row.valid
                        ? 'transparent'
                        : 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
                    }}
                  >
                    <td className="px-2 py-2 text-gray-500 align-top">{row.rowNumber}</td>
                    <td className="px-1 py-1 align-top">
                      <input
                        className="input-admin text-xs w-full min-w-[90px]"
                        value={row.firstName}
                        onChange={(e) => patchExcelPreviewRow(row.rowNumber, 'firstName', e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1 align-top">
                      <input
                        className="input-admin text-xs w-full min-w-[90px]"
                        value={row.paternalSurname}
                        onChange={(e) => patchExcelPreviewRow(row.rowNumber, 'paternalSurname', e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1 align-top">
                      <input
                        className="input-admin text-xs w-full min-w-[80px]"
                        value={row.maternalSurname ?? ''}
                        onChange={(e) => patchExcelPreviewRow(row.rowNumber, 'maternalSurname', e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1 align-top">
                      <input
                        className="input-admin text-xs w-full min-w-[80px] font-mono"
                        maxLength={8}
                        value={row.dni}
                        onChange={(e) => patchExcelPreviewRow(row.rowNumber, 'dni', e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1 align-top">
                      <input
                        className="input-admin text-xs w-full min-w-[80px] font-mono"
                        value={row.loginUsername}
                        onChange={(e) => patchExcelPreviewRow(row.rowNumber, 'loginUsername', e.target.value)}
                      />
                    </td>
                    <td className="px-1 py-1 align-top">
                      <select
                        className="input-admin text-xs w-full min-w-[130px]"
                        value={row.currentGrade ?? ''}
                        onChange={(e) => patchExcelPreviewRow(row.rowNumber, 'currentGrade', Number(e.target.value))}
                      >
                        <option value="" disabled>Grado PNP</option>
                        {CURRENT_GRADE_SELECT_OPTIONS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 align-top text-[var(--color-text-secondary)]">{row.postulationGradeLabel}</td>
                    <td className="px-2 py-2 align-top text-gray-400">{row.categoryLabel}</td>
                    <td className="px-2 py-2 align-top text-gray-400">{row.hierarchyLabel}</td>
                    <td className="px-2 py-2 align-top text-gray-400">{row.trackLabel}</td>
                    <td className="px-1 py-1 align-top">
                      <select
                        className="input-admin text-xs w-full"
                        value={row.planDays}
                        onChange={(e) => patchExcelPreviewRow(row.rowNumber, 'planDays', Number(e.target.value))}
                      >
                        {SUBSCRIPTION_PLANS.map((p) => (
                          <option key={p.days} value={p.days}>{p.days} d</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 align-top">
                      {row.valid ? (
                        <span style={{ color: NEON }}>OK</span>
                      ) : (
                        <span className="text-[11px] leading-snug block max-w-[140px]" style={{ color: RED }} title={row.error ?? undefined}>
                          {row.error ?? 'Error'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {excelPreviewRows.some((r) => !r.valid) && (
            <p className="text-xs text-gray-500">
              Corrija las filas en rojo en la tabla. Solo se grabarán las filas válidas.
            </p>
          )}
        </div>
      </Modal>

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
            <label className="block text-xs text-gray-500 mb-1">DNI</label>
            <input maxLength={8} className="input-admin" value={editForm.dni}
              onChange={(e) => setEditForm({ ...editForm, dni: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Grado actual</label>
            <select
              className="input-admin"
              value={editForm.currentGrade ?? ''}
              onChange={(e) => handleEditCurrentGradeChange(Number(e.target.value))}
            >
              <option value="" disabled>Selecciona el grado PNP</option>
              {CURRENT_GRADE_SELECT_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            {editForm.promotionGrade != null && (() => {
              const cls = studentClassificationFromCurrentGrade(editForm.currentGrade)
              return (
              <p className="text-xs mt-2 text-gray-500">
                Postula a: <strong className="text-[var(--color-text-primary)]">{promotionGradeLabel(editForm.promotionGrade)}</strong>
                {' · '}
                Categoría: <strong className="text-[var(--color-text-primary)]">{cls?.categoryLabel ?? '—'}</strong>
                {' · '}
                Jerarquía: <strong className="text-[var(--color-text-primary)]">{cls?.hierarchyLabel ?? '—'}</strong>
                {' · '}
                Balotario: <strong className="text-[var(--color-text-primary)]">{trackLabel(editForm.trackType)}</strong>
              </p>
              )
            })()}
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
          ¿Desactivar a <strong className="text-[var(--color-text-primary)]">{deactivateTarget?.name}</strong>?
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
            className="textarea-admin"
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
          <strong className="text-[var(--color-text-primary)]">{resetPasswordTarget?.fullName}</strong>.
          El alumno deberá cambiarla en su próximo ingreso.
        </p>
        <input type="password" className="input-admin"
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
        open={createConfirmOpen}
        onClose={() => { if (!saving) setCreateConfirmOpen(false) }}
        title="Confirmar creación de usuario"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setCreateConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" loading={saving} onClick={() => void confirmCreateUser()}>
              Crear usuario
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm">
          <p>¿Crear acceso inmediato para este alumno?</p>
          <div className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-primary-bg)] p-3 space-y-1">
            <div><span className="text-gray-500">Nombre: </span><strong className="text-[var(--color-text-primary)]">{previewFullName || '—'}</strong></div>
            <div><span className="text-gray-500">Usuario: </span><strong className="text-[var(--color-text-primary)] tracking-wide">{previewLoginUsername ?? '—'}</strong></div>
            <div><span className="text-gray-500">Contraseña sugerida: </span><strong className="text-[var(--color-text-primary)]">{form.dni || '—'}</strong> <span className="text-gray-500 text-xs">(su DNI)</span></div>
            <div><span className="text-gray-500">DNI: </span><strong className="text-[var(--color-text-primary)]">{form.dni}</strong></div>
            <div><span className="text-gray-500">Grado actual: </span><strong className="text-[var(--color-text-primary)]">{form.currentGrade != null ? CURRENT_GRADE_SELECT_OPTIONS.find((g) => g.value === form.currentGrade)?.label : '—'}</strong></div>
            <div><span className="text-gray-500">Postula a: </span><strong className="text-[var(--color-text-primary)]">{form.promotionGrade != null ? promotionGradeLabel(form.promotionGrade) : '—'}</strong></div>
            {form.promotionGrade != null && (
              <>
                <div><span className="text-gray-500">Categoría: </span><strong className="text-[var(--color-text-primary)]">{studentClassificationFromCurrentGrade(form.currentGrade)?.categoryLabel ?? '—'}</strong></div>
                <div><span className="text-gray-500">Jerarquía: </span><strong className="text-[var(--color-text-primary)]">{studentClassificationFromCurrentGrade(form.currentGrade)?.hierarchyLabel ?? '—'}</strong></div>
              </>
            )}
            <div><span className="text-gray-500">Balotario: </span><strong className="text-[var(--color-text-primary)]">{trackLabel(form.trackType)}</strong></div>
            <div><span className="text-gray-500">Plan: </span><strong style={{ color: NEON }}>{form.planDays} días</strong></div>
          </div>
          <p className="text-xs text-gray-500">Sugerencia: el alumno puede cambiar su contraseña cuando desee desde su perfil.</p>
        </div>
      </Modal>

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
          ¿Eliminar <strong className="text-[var(--color-text-primary)]">PERMANENTEMENTE</strong> a{' '}
          <strong className="text-[var(--color-text-primary)]">{deleteTarget?.name}</strong>? Se borrarán sus sesiones,
          respuestas y suscripciones. Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}

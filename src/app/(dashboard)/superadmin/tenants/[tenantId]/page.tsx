'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, normalizeUser } from '@/lib/store/authStore'
import { useImpersonationStore } from '@/lib/store/impersonationStore'
import { isSuperAdmin } from '@/lib/auth/roles'
import { superadminApi, type TenantDetail } from '@/lib/api/superadmin'
import { Skeleton, SkeletonCard } from '@/components/Skeleton'
import { toast } from '@/components/Toast'
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      const [tRes, sRes, uRes] = await Promise.all([
        superadminApi.getTenant(tenantId),
        superadminApi.getTenantStats(tenantId),
        superadminApi.getTenantUsers(tenantId),
      ])
      setTenant(tRes.data)
      setStats(sRes.data as TenantStats)
      setUsers(uRes.data as TenantUser[])
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

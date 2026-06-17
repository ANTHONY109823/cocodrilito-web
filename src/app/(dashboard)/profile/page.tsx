'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/Toast'
import { Button, Card, Input } from '@/components/ui'
import { ErrorState } from '@/components/ui/ErrorState'
import apiClient from '@/lib/api/client'
import { getApiErrorMessage } from '@/lib/api/errors'
import { isTenantAdmin } from '@/lib/auth/roles'
import { useAuthStore } from '@/lib/store/authStore'
import { resolveUserTrackKey, trackLabel } from '@/lib/constants/trackTypes'
import { cn } from '@/lib/utils/cn'

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser, loadFromStorage } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [subLoading, setSubLoading] = useState(true)
  const [subError, setSubError] = useState<string | null>(null)
  const [subInfo, setSubInfo] = useState<{ expiresAt: string; daysLeft: number } | null>(null)

  const [profileForm, setProfileForm] = useState({
    rank: user?.rank || '',
    unit: user?.unit || '',
  })

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const loadSubInfo = useCallback(async () => {
    setSubLoading(true)
    setSubError(null)
    try {
      const res = await apiClient.get('/Auth/me')
      const data = res.data as { subscription?: { expiresAt: string; daysLeft: number } }
      if (data.subscription) setSubInfo(data.subscription)
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Error al cargar datos de suscripción')
      console.error('[profile] loadSubInfo failed:', err)
      setSubError(msg)
      toast(msg, 'error')
    } finally {
      setSubLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFromStorage()
    void loadSubInfo()
  }, [loadFromStorage, loadSubInfo])

  useEffect(() => {
    if (user) {
      setProfileForm({ rank: user.rank || '', unit: user.unit || '' })
    }
  }, [user])

  useEffect(() => {
    if (user && isTenantAdmin(user.role)) {
      router.replace('/admin/configuracion')
    }
  }, [user, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiClient.put('/Auth/profile', profileForm)
      if (user) setUser({ ...user, ...profileForm })
      toast('Perfil actualizado correctamente', 'success')
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Error al actualizar perfil')
      console.error('[profile] handleUpdateProfile failed:', err)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast('Las contraseñas no coinciden', 'error')
      return
    }
    if (passForm.newPassword.length < 8) {
      toast('La contraseña debe tener mínimo 8 caracteres', 'error')
      return
    }
    setLoading(true)
    try {
      await apiClient.put('/Auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      })
      toast('Contraseña actualizada correctamente', 'success')
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Error al cambiar contraseña')
      console.error('[profile] handleChangePassword failed:', err)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (user && isTenantAdmin(user.role)) {
    return null
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex flex-wrap items-start gap-3 sm:gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          ← Inicio
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Mi perfil</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Administra tu cuenta de estudiante
          </p>
        </div>
      </div>

      <Card padding="sm" className="mb-4 rounded-xl">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-bg)] text-2xl font-bold text-[var(--color-primary)]">
            {user?.fullName?.charAt(0)}
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--color-text-primary)]">{user?.fullName}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{user?.email}</div>
            <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">DNI: {user?.dni}</div>
            <div className="mt-1 text-xs font-medium text-[var(--color-primary)]">
              Balotario: {trackLabel(resolveUserTrackKey(user))}
            </div>
          </div>
        </div>

        {subLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-[rgba(189,255,223,0.06)]" />
        ) : subError ? (
          <ErrorState message={subError} onRetry={() => void loadSubInfo()} className="p-4" />
        ) : subInfo ? (
          <Card
            padding="sm"
            className="rounded-xl border-[var(--color-surface-border)] bg-[var(--color-primary-bg)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  Plan activo
                </div>
                <div className="text-sm font-semibold text-[var(--color-primary)]">
                  Premium — vence el{' '}
                  {new Date(subInfo.expiresAt).toLocaleDateString('es-PE')}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    'text-xl font-bold',
                    subInfo.daysLeft <= 7 ? 'text-[#C9943A]' : 'text-[var(--color-primary)]'
                  )}
                >
                  {subInfo.daysLeft}d
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">restantes</div>
              </div>
            </div>
          </Card>
        ) : (
          <Card
            padding="sm"
            className="rounded-xl border-[rgba(192,57,43,0.25)] bg-[rgba(192,57,43,0.06)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-[#e74c3c]">Sin plan activo</span>
              <Link href="/premium">
                <Button variant="primary" size="sm">
                  Ver planes →
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </Card>

      <Card padding="sm" className="mb-4 rounded-xl">
        <h2 className="mb-4 text-base font-bold text-white">Actualizar datos</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <Input
            label="Grado"
            placeholder="Suboficial de 3ra"
            value={profileForm.rank}
            onChange={(e) => setProfileForm({ ...profileForm, rank: e.target.value })}
          />
          <Input
            label="Unidad"
            placeholder="Comisaría Lima Norte"
            value={profileForm.unit}
            onChange={(e) => setProfileForm({ ...profileForm, unit: e.target.value })}
          />
          <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
            Guardar cambios
          </Button>
        </form>
      </Card>

      <Card padding="sm" className="rounded-xl">
        <h2 className="mb-4 text-base font-bold text-white">Cambiar contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <Input
            label="Contraseña actual"
            type="password"
            value={passForm.currentPassword}
            onChange={(e) =>
              setPassForm({ ...passForm, currentPassword: e.target.value })
            }
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={passForm.newPassword}
            onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={passForm.confirmPassword}
            onChange={(e) =>
              setPassForm({ ...passForm, confirmPassword: e.target.value })
            }
            required
          />
          <Button type="submit" variant="outline" size="md" fullWidth loading={loading}>
            Cambiar contraseña
          </Button>
        </form>
      </Card>
    </div>
  )
}

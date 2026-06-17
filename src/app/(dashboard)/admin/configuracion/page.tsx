'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { isTenantAdmin } from '@/lib/auth/roles'
import { tenantAdminApi } from '@/lib/api/tenantAdmin'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { AdminPasswordForm } from '@/components/admin/AdminPasswordForm'
import { NEON } from '@/lib/constants/theme'

export default function ConfiguracionPage() {
  const router = useRouter()
  const { user, loadFromStorage } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [changingPassword, setChangingPassword] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [institutionName, setInstitutionName] = useState('')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await tenantAdminApi.getProfile()
      setInstitutionName(res.data.name ?? '')
    } catch {
      setMsg({ text: 'No se pudo cargar la configuración', ok: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!user) return
    if (!isTenantAdmin(user.role)) {
      router.push('/dashboard')
      return
    }
    void loadProfile()
  }, [user, router, loadProfile])

  const handleChangePassword = async (values: {
    currentPassword: string
    newPassword: string
  }) => {
    setMsg(null)
    setChangingPassword(true)
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      setMsg({ text: 'Contraseña actualizada correctamente', ok: true })
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al cambiar la contraseña'), ok: false })
    } finally {
      setChangingPassword(false)
    }
  }

  const cardStyle = {
    background: 'var(--color-surface-elevated)',
    border: '1px solid var(--color-surface-border)',
  }

  if (loading) {
    return <p className="text-center text-gray-500 py-12">Cargando configuración...</p>
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-[var(--color-text-primary)] text-sm">← Panel admin</Link>
        <h1 className="text-2xl font-bold text-white mt-2">Configuración</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Administra tu contraseña de acceso
        </p>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: msg.ok ? 'var(--color-primary-bg)' : 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
            border: `1px solid ${msg.ok ? NEON : '#FF5252'}40`,
            color: msg.ok ? NEON : '#FF5252',
          }}>
          {msg.text}
        </div>
      )}

      <section className="rounded-2xl p-5 space-y-3 mb-6" style={cardStyle}>
        <div>
          <h2 className="text-[var(--color-text-primary)] font-semibold text-sm">Identidad visual</h2>
          <p className="text-xs text-gray-500 mt-1">
            El logo y la imagen de fondo del login de {institutionName || 'tu institución'} los configura el equipo de Simulacros.pe.
            Si necesitas cambiarlos, contacta al administrador de la plataforma.
          </p>
        </div>
      </section>

      <section className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <div>
          <h2 className="text-[var(--color-text-primary)] font-semibold text-sm">Cambiar contraseña</h2>
          <p className="text-xs text-gray-500 mt-1">
            Actualiza la contraseña de tu cuenta de administrador.
          </p>
        </div>
        <AdminPasswordForm loading={changingPassword} onSubmit={handleChangePassword} />
      </section>
    </div>
  )
}

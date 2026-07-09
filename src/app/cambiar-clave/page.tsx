'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { redirectToLogin } from '@/lib/auth/logoutRedirect'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'
import { getPostLoginPath } from '@/lib/auth/roles'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'
import { SURFACE_CARD, primaryMix } from '@/lib/constants/theme'

const PAGE_GOLD = '#F5C842'

export default function CambiarClavePage() {
  const router = useRouter()
  const { user, setUser, loadFromStorage, logout } = useAuthStore()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  useEffect(() => {
    if (user && !user.mustChangePassword) {
      router.replace(getPostLoginPath(user.role))
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pwdError = validatePassword(newPassword)
    if (pwdError) {
      setError(pwdError)
      return
    }
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser distinta a la temporal.')
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      const meRes = await authApi.me()
      const profile = (meRes.data as { profile?: Record<string, unknown> }).profile
      if (profile) {
        const updated = normalizeUser({ ...profile, mustChangePassword: false })
        setUser(updated)
        router.replace(getPostLoginPath(updated.role))
      } else if (user) {
        const updated = normalizeUser({ ...user, mustChangePassword: false })
        setUser(updated)
        router.replace(getPostLoginPath(updated.role))
      } else {
        redirectToLogin()
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo cambiar la contraseña.'))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'rgba(0,0,0,0.45)',
    border: '0.5px solid rgba(74,170,84,0.35)',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0b1f0e 0%, #060e07 70%)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{ background: SURFACE_CARD, border: `1px solid ${primaryMix(40)}` }}
      >
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔐</div>
          <h1 className="text-xl font-bold text-white">Cambia tu contraseña</h1>
          <p className="text-sm text-gray-400 mt-1">
            Por seguridad debes definir una contraseña nueva antes de continuar.
          </p>
        </div>

        {error && (
          <div
            className="mb-4 px-3 py-2 rounded-lg text-sm"
            style={{ background: 'rgba(255,82,82,0.12)', color: '#ff8a8a', border: '1px solid #ff525233' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Contraseña temporal actual</label>
            <input
              type="password"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={inputStyle}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nueva contraseña</label>
            <input
              type="password"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={inputStyle}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
            />
            <PasswordPolicyHint password={newPassword} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={inputStyle}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition-all"
            style={{ background: PAGE_GOLD, color: 'var(--color-text-primary)', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { logout(); redirectToLogin() }}
          className="w-full mt-4 text-xs text-gray-500 hover:text-gray-300"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

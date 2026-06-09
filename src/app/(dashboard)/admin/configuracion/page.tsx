'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, normalizeUser } from '@/lib/store/authStore'
import { isTenantAdmin } from '@/lib/auth/roles'
import { tenantAdminApi } from '@/lib/api/tenantAdmin'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'
import { NEON } from '@/lib/constants/theme'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ConfiguracionPage() {
  const router = useRouter()
  const { user, loadFromStorage, setUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await tenantAdminApi.getProfile()
      setLogoUrl(res.data.logoUrl ?? '')
      setLogoPreview(res.data.logoUrl ?? null)
      setLogoFile(null)
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

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview)
      }
    }
  }, [logoPreview])

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMsg({ text: 'Solo se permiten imágenes JPG, PNG o WebP', ok: false })
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setMsg({ text: 'El logo no puede superar 2 MB', ok: false })
      return
    }

    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview)
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveLogo = async () => {
    if (!logoFile) {
      setMsg({ text: 'Selecciona un logo para subir', ok: false })
      return
    }

    setUploadingLogo(true)
    setMsg(null)

    try {
      const uploadRes = await tenantAdminApi.uploadLogo(logoFile)
      const newLogoUrl = uploadRes.data.logoUrl
      await tenantAdminApi.updateProfile({ logoUrl: newLogoUrl })

      if (user) {
        setUser(normalizeUser({
          ...user,
          tenantLogoUrl: newLogoUrl || null,
        }))
      }

      setLogoUrl(newLogoUrl)
      setLogoPreview(newLogoUrl)
      setLogoFile(null)
      setMsg({ text: 'Logo actualizado correctamente', ok: true })
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al subir el logo'), ok: false })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)

    const pwdError = validatePassword(passwordForm.newPassword)
    if (pwdError) {
      setMsg({ text: pwdError, ok: false })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMsg({ text: 'Las contraseñas no coinciden', ok: false })
      return
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setMsg({ text: 'La nueva contraseña debe ser distinta a la actual', ok: false })
      return
    }

    setChangingPassword(true)
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setMsg({ text: 'Contraseña actualizada correctamente', ok: true })
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al cambiar la contraseña'), ok: false })
    } finally {
      setChangingPassword(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(0,5,2,0.8)',
    border: '1px solid #ffffff15',
    color: '#fff',
    fontSize: '13px',
    outline: 'none' as const,
  }

  const cardStyle = {
    background: 'rgba(0,8,4,0.9)',
    border: '1px solid #ffffff08',
  }

  if (loading) {
    return <p className="text-center text-gray-500 py-12">Cargando configuración...</p>
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-white text-sm">← Panel admin</Link>
        <h1 className="text-2xl font-bold text-white mt-2">Configuración</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Administra el logo de tu agencia y tu contraseña de acceso
        </p>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{
            backgroundColor: msg.ok ? 'rgba(74,124,89,0.1)' : 'rgba(255,82,82,0.1)',
            border: `1px solid ${msg.ok ? NEON : '#FF5252'}40`,
            color: msg.ok ? NEON : '#FF5252',
          }}>
          {msg.text}
        </div>
      )}

      <section className="rounded-2xl p-5 space-y-4 mb-6" style={cardStyle}>
        <div>
          <h2 className="text-white font-semibold text-sm">Logo de la agencia</h2>
          <p className="text-xs text-gray-500 mt-1">
            Se mostrará en el login y panel de tus alumnos.
          </p>
        </div>

        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Vista previa del logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl text-gray-600">🏢</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoSelect}
            />
            <button
              type="button"
              disabled={uploadingLogo}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-opacity"
              style={{
                backgroundColor: `${NEON}18`,
                color: NEON,
                border: `1px solid ${NEON}35`,
                opacity: uploadingLogo ? 0.6 : 1,
              }}
            >
              Elegir imagen
            </button>
            <p className="text-[11px] text-gray-600 max-w-[200px]">
              JPG, PNG o WebP · máximo 2 MB
            </p>
          </div>
        </div>

        {logoFile && (
          <button
            type="button"
            disabled={uploadingLogo}
            onClick={() => void handleSaveLogo()}
            className="w-full py-2.5 rounded-xl font-bold text-sm"
            style={{
              background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`,
              color: '#000',
              opacity: uploadingLogo ? 0.7 : 1,
            }}
          >
            {uploadingLogo ? 'Subiendo logo...' : 'Guardar logo'}
          </button>
        )}

        {!logoFile && logoUrl && (
          <p className="text-xs text-gray-500">Logo actual cargado. Elige una imagen para reemplazarlo.</p>
        )}
      </section>

      <form onSubmit={handleChangePassword} className="rounded-2xl p-5 space-y-4" style={cardStyle}>
        <div>
          <h2 className="text-white font-semibold text-sm">Cambiar contraseña</h2>
          <p className="text-xs text-gray-500 mt-1">
            Actualiza la contraseña de tu cuenta de administrador.
          </p>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Contraseña actual</label>
          <input
            style={inputStyle}
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Nueva contraseña</label>
          <input
            style={inputStyle}
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            autoComplete="new-password"
            required
          />
          <PasswordPolicyHint password={passwordForm.newPassword} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Confirmar nueva contraseña</label>
          <input
            style={inputStyle}
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            autoComplete="new-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={changingPassword}
          className="w-full py-2.5 rounded-xl font-bold text-sm"
          style={{
            background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`,
            color: '#000',
            opacity: changingPassword ? 0.7 : 1,
          }}
        >
          {changingPassword ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  )
}

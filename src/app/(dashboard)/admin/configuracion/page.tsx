'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, normalizeUser } from '@/lib/store/authStore'
import { isTenantAdmin } from '@/lib/auth/roles'
import { tenantAdminApi } from '@/lib/api/tenantAdmin'
import { getApiErrorMessage } from '@/lib/api/errors'
import { NEON } from '@/lib/constants/theme'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ConfiguracionPage() {
  const router = useRouter()
  const { user, loadFromStorage, setUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    description: '',
  })

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await tenantAdminApi.getProfile()
      const t = res.data
      setForm({
        name: t.name ?? '',
        logoUrl: t.logoUrl ?? '',
        contactEmail: t.contactEmail ?? '',
        contactPhone: t.contactPhone ?? '',
        address: t.address ?? '',
        description: t.description ?? '',
      })
      setLogoPreview(t.logoUrl ?? null)
      setLogoFile(null)
    } catch {
      setMsg({ text: 'No se pudo cargar los datos de la agencia', ok: false })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    let logoUrl = form.logoUrl

    try {
      if (logoFile) {
        setUploadingLogo(true)
        const uploadRes = await tenantAdminApi.uploadLogo(logoFile)
        logoUrl = uploadRes.data.logoUrl
        setUploadingLogo(false)
      }

      await tenantAdminApi.updateProfile({ ...form, logoUrl })

      if (user) {
        setUser(normalizeUser({
          ...user,
          tenantName: form.name,
          tenantLogoUrl: logoUrl || null,
        }))
      }

      setForm((f) => ({ ...f, logoUrl }))
      setLogoPreview(logoUrl || null)
      setLogoFile(null)
      setMsg({ text: 'Datos de la agencia actualizados', ok: true })
    } catch (err: unknown) {
      setMsg({ text: getApiErrorMessage(err, 'Error al guardar'), ok: false })
    } finally {
      setSaving(false)
      setUploadingLogo(false)
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

  const busy = saving || uploadingLogo

  if (loading) {
    return <p className="text-center text-gray-500 py-12">Cargando configuración...</p>
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-white text-sm">← Panel admin</Link>
        <h1 className="text-2xl font-bold text-white mt-2">Configuración de la agencia</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Personaliza el nombre, logo y datos de contacto de tu plataforma
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

      <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4"
        style={{ background: 'rgba(0,8,4,0.9)', border: '1px solid #ffffff08' }}>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Nombre de la agencia</label>
          <input style={inputStyle} value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Logo de la agencia</label>
          <div className="flex items-start gap-4 flex-wrap">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 overflow-hidden"
            >
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
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-opacity"
                style={{
                  backgroundColor: `${NEON}18`,
                  color: NEON,
                  border: `1px solid ${NEON}35`,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {uploadingLogo ? 'Subiendo logo...' : 'Subir logo'}
              </button>
              <p className="text-[11px] text-gray-600 max-w-[200px]">
                JPG, PNG o WebP · máximo 2 MB
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Correo de contacto</label>
          <input style={inputStyle} type="email" value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Teléfono</label>
          <input style={inputStyle} value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Dirección</label>
          <input style={inputStyle} value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Descripción</label>
          <textarea style={{ ...inputStyle, minHeight: 80 }} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button type="submit" disabled={busy}
          className="w-full py-2.5 rounded-xl font-bold text-sm"
          style={{
            background: `linear-gradient(135deg, ${NEON}, #1A5C2E)`,
            color: '#000',
            opacity: busy ? 0.7 : 1,
          }}>
          {uploadingLogo ? 'Subiendo logo...' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

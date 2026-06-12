'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'
import { getApiErrorMessage } from '@/lib/api/errors'
import { NEON } from '@/lib/constants/theme'
import type { CreateTenantPayload } from '@/lib/api/superadmin'
import {
  TenantLoginBrandingFields,
  emptyLoginBranding,
} from '@/components/superadmin/TenantLoginBrandingFields'
import {
  TenantBrandingUploadFields,
  emptyTenantBrandingFiles,
  validateTenantBrandingFiles,
  type TenantBrandingFiles,
} from '@/components/superadmin/TenantBrandingUploadFields'
import type { TenantLoginBranding } from '@/lib/constants/defaultLoginBranding'

export interface CreateTenantFormState extends CreateTenantPayload {
  loginConfig: TenantLoginBranding
  adminFullName: string
  adminEmail: string
  adminDni: string
  adminPassword: string
  branding: TenantBrandingFiles
}

export const emptyCreateTenantForm = (): CreateTenantFormState => ({
  name: '',
  slug: '',
  tenantType: 'Agencia',
  contactEmail: '',
  contactPhone: '',
  monthlyFee: 0,
  customDomain: '',
  loginConfig: emptyLoginBranding(),
  adminFullName: '',
  adminEmail: '',
  adminDni: '',
  adminPassword: '',
  branding: emptyTenantBrandingFiles(),
})

interface CreateTenantPanelProps {
  open: boolean
  loading: boolean
  defaultTenantType?: 'Agencia' | 'Academia'
  onClose: () => void
  onSubmit: (data: CreateTenantFormState) => Promise<void>
}

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm text-white outline-none'
const inputStyle = { background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }

export function CreateTenantPanel({ open, loading, defaultTenantType, onClose, onSubmit }: CreateTenantPanelProps) {
  const [form, setForm] = useState<CreateTenantFormState>(emptyCreateTenantForm)
  const [error, setError] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  useEffect(() => {
    if (open && defaultTenantType) {
      setForm((f) => (f.tenantType === defaultTenantType ? f : { ...f, tenantType: defaultTenantType }))
    }
  }, [open, defaultTenantType])

  const isDirty = useMemo(() => {
    const empty = emptyCreateTenantForm()
    return (
      form.name !== empty.name ||
      form.slug !== empty.slug ||
      form.contactEmail !== empty.contactEmail ||
      form.contactPhone !== empty.contactPhone ||
      form.customDomain !== empty.customDomain ||
      form.monthlyFee !== empty.monthlyFee ||
      form.adminFullName !== empty.adminFullName ||
      form.adminEmail !== empty.adminEmail ||
      form.adminDni !== empty.adminDni ||
      form.adminPassword !== empty.adminPassword ||
      form.branding.logoFile !== null ||
      form.branding.backgroundFile !== null
    )
  }, [form])

  const resetAndClose = () => {
    setForm(emptyCreateTenantForm())
    setError('')
    setConfirmDiscard(false)
    onClose()
  }

  const handleCloseRequest = () => {
    if (loading) return
    if (isDirty) {
      setConfirmDiscard(true)
      return
    }
    resetAndClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const pwdError = validatePassword(form.adminPassword)
    if (pwdError) {
      setError(pwdError)
      return
    }

    if (form.adminDni.length !== 8 || !/^\d+$/.test(form.adminDni)) {
      setError('El DNI del administrador debe tener 8 dígitos numéricos.')
      return
    }

    const brandingError = validateTenantBrandingFiles(form.branding)
    if (brandingError) {
      setError(brandingError)
      return
    }

    try {
      await onSubmit(form)
      resetAndClose()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo crear la institución.'))
    }
  }

  return (
    <>
    <Modal
      open={open}
      onClose={handleCloseRequest}
      closeOnBackdrop={false}
      title="➕ Nueva agencia o academia"
      maxWidth="max-w-4xl"
      footer={
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={handleCloseRequest}>Cancelar</Button>
          <Button size="sm" loading={loading} onClick={() => {
            const formEl = document.getElementById('create-tenant-form') as HTMLFormElement | null
            formEl?.requestSubmit()
          }}>
            Crear institución y administrador
          </Button>
        </>
      }
    >
      <form id="create-tenant-form" onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(255,82,82,0.12)', color: '#ff8a8a' }}>
            {error}
          </div>
        )}

        <section>
          <h3 className="text-white font-semibold text-sm mb-1">1. Datos de la institución</h3>
          <p className="text-xs text-gray-500 mb-3">Información pública y de contacto del tenant.</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
              <input className={inputClass} style={inputStyle} required
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug (opcional)</label>
              <input className={inputClass} style={inputStyle}
                placeholder="ej. jraasecurity"
                value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              <p className="text-[10px] text-gray-600 mt-1">
                Solo el nombre corto. La URL será: {(form.slug || 'nombre').toLowerCase().replace(/[^a-z0-9-]/g, '')}.simulacros.pe
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo *</label>
              <select className={inputClass} style={inputStyle} required
                value={form.tenantType} onChange={(e) => setForm({ ...form, tenantType: e.target.value })}>
                <option value="Agencia">Agencia</option>
                <option value="Academia">Academia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cuota mensual (S/.)</label>
              <input type="number" min={0} step="0.01" className={inputClass} style={inputStyle}
                value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email de contacto *</label>
              <input type="email" className={inputClass} style={inputStyle} required
                value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
              <input className={inputClass} style={inputStyle}
                value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Dominio personalizado (opcional)</label>
              <input className={inputClass} style={inputStyle}
                placeholder="ej. academianorte.edu.pe"
                value={form.customDomain ?? ''}
                onChange={(e) => setForm({ ...form, customDomain: e.target.value })} />
            </div>
          </div>

          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #ffffff10' }}>
            <h4 className="text-white text-sm font-semibold mb-1">Identidad visual</h4>
            <p className="text-xs text-gray-500 mb-3">
              Logo e imagen de fondo para la página de inicio de sesión del subdominio.
            </p>
            <TenantBrandingUploadFields
              value={form.branding}
              onChange={(branding) => setForm({ ...form, branding })}
              disabled={loading}
              required
            />
          </div>
        </section>

        <details className="pt-4 group" style={{ borderTop: '1px solid #ffffff10' }}>
          <summary className="cursor-pointer list-none text-white font-semibold text-sm mb-1 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-gray-500 transition-transform group-open:rotate-90">▶</span>
              2. Panel de inicio de sesión
              <span className="font-normal text-gray-500">(opcional — valores por defecto)</span>
            </span>
          </summary>
          <div className="mt-3">
            <TenantLoginBrandingFields
              value={form.loginConfig}
              onChange={(loginConfig) => setForm({ ...form, loginConfig })}
            />
          </div>
        </details>

        <section className="pt-4" style={{ borderTop: '1px solid #ffffff10' }}>
          <h3 className="text-white font-semibold text-sm mb-1">3. Administrador de acceso</h3>
          <p className="text-xs text-gray-500 mb-3">
            Cuenta con rol Admin {form.tenantType}. Recibirá credenciales temporales y deberá cambiar la contraseña al ingresar.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre completo *</label>
              <input className={inputClass} style={inputStyle} required
                value={form.adminFullName} onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email de acceso *</label>
              <input type="email" className={inputClass} style={inputStyle} required
                value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">DNI (8 dígitos) *</label>
              <input className={inputClass} style={inputStyle} required maxLength={8}
                value={form.adminDni} onChange={(e) => setForm({ ...form, adminDni: e.target.value.replace(/\D/g, '') })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Contraseña temporal *</label>
              <input type="password" className={inputClass} style={inputStyle} required
                value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
              <PasswordPolicyHint password={form.adminPassword} />
            </div>
          </div>
        </section>

        <p className="text-xs text-gray-500">
          Jerarquía: <span style={{ color: NEON }}>SuperAdmin</span> → Admin {form.tenantType} → Usuarios/Alumnos
        </p>
      </form>
    </Modal>

    <Modal
      open={confirmDiscard}
      onClose={() => setConfirmDiscard(false)}
      closeOnBackdrop={false}
      title="¿Descartar cambios?"
      maxWidth="max-w-sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDiscard(false)}>
            Seguir editando
          </Button>
          <Button variant="danger" size="sm" onClick={resetAndClose}>
            Descartar
          </Button>
        </>
      }
    >
      <p>Tienes datos sin guardar. Si cierras ahora, se perderá lo que escribiste.</p>
    </Modal>
    </>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'
import { getApiErrorMessage } from '@/lib/api/errors'
import { NEON, primaryMix } from '@/lib/constants/theme'
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
  onClose: () => void
  onSubmit: (data: CreateTenantFormState) => Promise<void>
}

const inputClass = 'input-admin'
const inputStyle = { background: 'var(--color-input-bg)', border: '1px solid var(--color-surface-border)' }

export function CreateTenantPanel({ open, loading, onClose, onSubmit }: CreateTenantPanelProps) {
  const [form, setForm] = useState<CreateTenantFormState>(emptyCreateTenantForm)
  const [error, setError] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)

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
      await onSubmit({ ...form, tenantType: 'Agencia' })
      resetAndClose()
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo crear la agencia.'))
    }
  }

  return (
    <>
    <Modal
      open={open}
      onClose={handleCloseRequest}
      closeOnBackdrop={false}
      title="➕ Nueva agencia"
      maxWidth="max-w-4xl"
      footer={
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={handleCloseRequest}>Cancelar</Button>
          <Button size="sm" loading={loading} onClick={() => {
            const formEl = document.getElementById('create-tenant-form') as HTMLFormElement | null
            formEl?.requestSubmit()
          }}>
            Crear agencia y administrador
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
          <h3 className="text-[var(--color-text-primary)] font-semibold text-sm mb-1">1. Datos de la agencia</h3>
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
                placeholder="ej. agenciaseguridad.edu.pe"
                value={form.customDomain ?? ''}
                onChange={(e) => setForm({ ...form, customDomain: e.target.value })} />
            </div>
          </div>

        </section>

        <section
          className="rounded-xl p-4"
          style={{
            border: `2px solid ${primaryMix(55)}`,
            background: 'var(--color-primary-bg)',
          }}
        >
          <h3 className="text-[var(--color-text-primary)] font-semibold text-sm mb-1">
            2. Identidad visual *
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Sube el logo y la imagen de fondo que verán en{' '}
            <strong className="text-[var(--color-text-primary)]">
              {(form.slug || form.name || 'agencia').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'agencia'}.simulacros.pe
            </strong>
            . Sin estas imágenes no se puede crear la agencia.
          </p>
          <TenantBrandingUploadFields
            value={form.branding}
            onChange={(branding) => setForm({ ...form, branding })}
            disabled={loading}
            required
          />
        </section>

        <details className="pt-4 group" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          <summary className="cursor-pointer list-none text-[var(--color-text-primary)] font-semibold text-sm mb-1 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-gray-500 transition-transform group-open:rotate-90">▶</span>
              3. Panel de inicio de sesión
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

        <section className="pt-4" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          <h3 className="text-[var(--color-text-primary)] font-semibold text-sm mb-1">4. Administrador de acceso</h3>
          <p className="text-xs text-gray-500 mb-3">
            Cuenta con rol Admin Agencia. Recibirá credenciales temporales y deberá cambiar la contraseña al ingresar.
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
          Jerarquía: <span style={{ color: NEON }}>SuperAdmin</span> → Admin Agencia → Alumnos PNP
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

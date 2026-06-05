'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { PasswordPolicyHint } from '@/components/admin/PasswordPolicyHint'
import { validatePassword } from '@/lib/utils/passwordPolicy'
import { NEON } from '@/lib/constants/theme'
import type { CreateTenantPayload } from '@/lib/api/superadmin'

export interface CreateTenantFormState extends CreateTenantPayload {
  adminFullName: string
  adminEmail: string
  adminDni: string
  adminPassword: string
}

export const emptyCreateTenantForm = (): CreateTenantFormState => ({
  name: '',
  slug: '',
  tenantType: 'Agencia',
  contactEmail: '',
  contactPhone: '',
  monthlyFee: 0,
  adminFullName: '',
  adminEmail: '',
  adminDni: '',
  adminPassword: '',
})

interface CreateTenantPanelProps {
  open: boolean
  loading: boolean
  onClose: () => void
  onSubmit: (data: CreateTenantFormState) => Promise<void>
}

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm text-white outline-none'
const inputStyle = { background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }

export function CreateTenantPanel({ open, loading, onClose, onSubmit }: CreateTenantPanelProps) {
  const [form, setForm] = useState<CreateTenantFormState>(emptyCreateTenantForm)
  const [error, setError] = useState('')

  const handleClose = () => {
    if (loading) return
    setForm(emptyCreateTenantForm())
    setError('')
    onClose()
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

    try {
      await onSubmit(form)
      setForm(emptyCreateTenantForm())
      setError('')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'No se pudo crear la institución.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="➕ Nueva agencia o academia"
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={handleClose}>Cancelar</Button>
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
                value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
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
          </div>
        </section>

        <section className="pt-4" style={{ borderTop: '1px solid #ffffff10' }}>
          <h3 className="text-white font-semibold text-sm mb-1">2. Administrador de acceso</h3>
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
  )
}

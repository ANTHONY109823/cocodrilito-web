'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { contactApi } from '@/lib/api/contact'
import { getApiErrorMessage } from '@/lib/api/errors'

interface JoinRequestModalProps {
  open: boolean
  onClose: () => void
}

const inputClass = 'w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none'
const inputStyle = { background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }

export function JoinRequestModal({ open, onClose }: JoinRequestModalProps) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    institutionName: '',
    phone: '',
    tenantType: 'Agencia' as 'Agencia' | 'Academia',
    message: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    if (loading) return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await contactApi.submitJoinRequest({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        institutionName: form.institutionName.trim(),
        phone: form.phone.trim() || undefined,
        tenantType: form.tenantType,
        message: form.message.trim() || undefined,
      })
      setSuccess(res.data.message)
      setForm({
        fullName: '',
        email: '',
        institutionName: '',
        phone: '',
        tenantType: 'Agencia',
        message: '',
      })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo enviar la solicitud.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeOnBackdrop={!loading}
      title="Solicitar unirse como agencia/academia"
      maxWidth="max-w-lg"
      footer={
        success ? (
          <Button size="sm" onClick={handleClose}>Cerrar</Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" disabled={loading} onClick={handleClose}>
              Cancelar
            </Button>
            <Button size="sm" loading={loading} onClick={() => {
              const formEl = document.getElementById('join-request-form') as HTMLFormElement | null
              formEl?.requestSubmit()
            }}>
              Enviar solicitud
            </Button>
          </>
        )
      }
    >
      {success ? (
        <p className="text-sm" style={{ color: '#4A7C59' }}>{success}</p>
      ) : (
        <form id="join-request-form" onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-gray-500 mb-2">
            Si representas una agencia o academia y quieres administrar tu propia plataforma,
            envía tu solicitud. El equipo de Cocodrilito te contactará para crear tu cuenta de administrador.
          </p>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,82,82,0.12)', color: '#ff8a8a' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo de institución *</label>
            <select className={inputClass} style={inputStyle} required
              value={form.tenantType}
              onChange={(e) => setForm({ ...form, tenantType: e.target.value as 'Agencia' | 'Academia' })}>
              <option value="Agencia">Agencia</option>
              <option value="Academia">Academia</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre de la institución *</label>
            <input className={inputClass} style={inputStyle} required
              value={form.institutionName}
              onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
              placeholder="Ej: Academia Ascenso PNP" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Tu nombre completo *</label>
            <input className={inputClass} style={inputStyle} required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email de contacto *</label>
            <input type="email" className={inputClass} style={inputStyle} required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
            <input className={inputClass} style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Opcional" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Mensaje</label>
            <textarea className={inputClass} style={inputStyle} rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Cuéntanos sobre tu agencia o academia (opcional)" />
          </div>
        </form>
      )}
    </Modal>
  )
}

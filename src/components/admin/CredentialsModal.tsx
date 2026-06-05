'use client'

import { Modal, Button } from '@/components/ui'
import { NEON, GOLD } from '@/lib/constants/theme'

export interface AdminCredentials {
  fullName: string
  email: string
  dni?: string
  role?: string
  temporaryPassword: string
  tenantName?: string
}

interface CredentialsModalProps {
  open: boolean
  credentials: AdminCredentials | null
  onClose: () => void
}

export function CredentialsModal({ open, credentials, onClose }: CredentialsModalProps) {
  if (!credentials) return null

  const copyAll = async () => {
    const text = [
      credentials.tenantName ? `Institución: ${credentials.tenantName}` : null,
      `Nombre: ${credentials.fullName}`,
      `Email: ${credentials.email}`,
      credentials.dni ? `DNI: ${credentials.dni}` : null,
      credentials.role ? `Rol: ${credentials.role}` : null,
      `Contraseña temporal: ${credentials.temporaryPassword}`,
      '',
      'Debe cambiar la contraseña en su primer ingreso.',
    ].filter(Boolean).join('\n')

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🔑 Credenciales del administrador"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={copyAll}>Copiar todo</Button>
          <Button size="sm" onClick={onClose}>Entendido</Button>
        </>
      }
    >
      <p className="text-sm text-gray-400 mb-4">
        Entrega estas credenciales al administrador. En su primer ingreso deberá definir una contraseña nueva.
      </p>
      <div className="space-y-3 text-sm">
        {credentials.tenantName && (
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,5,2,0.6)', border: `1px solid ${NEON}30` }}>
            <div className="text-xs text-gray-500">Institución</div>
            <div className="text-white font-medium">{credentials.tenantName}</div>
          </div>
        )}
        {[
          { label: 'Nombre', value: credentials.fullName },
          { label: 'Email de acceso', value: credentials.email },
          { label: 'DNI', value: credentials.dni },
          { label: 'Rol', value: credentials.role },
        ].filter((item) => item.value).map((item) => (
          <div key={item.label} className="rounded-lg px-3 py-2" style={{ background: 'rgba(0,5,2,0.6)', border: '1px solid #ffffff10' }}>
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className="text-white font-medium break-all">{item.value}</div>
          </div>
        ))}
        <div className="rounded-lg px-3 py-2" style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}40` }}>
          <div className="text-xs" style={{ color: GOLD }}>Contraseña temporal</div>
          <div className="text-white font-bold tracking-wide">{credentials.temporaryPassword}</div>
        </div>
      </div>
    </Modal>
  )
}

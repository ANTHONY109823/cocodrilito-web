'use client'

import { Modal, Button } from '@/components/ui'
import { DANGER, GOLD, INFO, INPUT_BG, NEON, POLICE_GREEN_DARK, PURPLE_ACCENT, RED_BRIGHT, SKY, SURFACE, SURFACE_CARD, TEXT_MUTED, WARNING, dangerMix, goldBrightMix, infoMix, primaryMix, purpleMix, redBrightMix, skyMix, warningMix } from '@/lib/constants/theme'

export interface AdminCredentials {
  fullName: string
  email?: string
  loginUsername?: string
  dni?: string
  role?: string
  temporaryPassword: string
  tenantName?: string
}

interface CredentialsModalProps {
  open: boolean
  credentials: AdminCredentials | null
  onClose: () => void
  title?: string
  description?: string
}

export function CredentialsModal({
  open,
  credentials,
  onClose,
  title = '🔑 Credenciales del administrador',
  description = 'Entrega estas credenciales al administrador. En su primer ingreso deberá definir una contraseña nueva.',
}: CredentialsModalProps) {
  if (!credentials) return null

  const copyAll = async () => {
    const text = [
      credentials.tenantName ? `Institución: ${credentials.tenantName}` : null,
      `Nombre: ${credentials.fullName}`,
      credentials.loginUsername ? `Usuario de acceso: ${credentials.loginUsername}` : null,
      credentials.email ? `Email (contacto): ${credentials.email}` : null,
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
      title={title}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={copyAll}>Copiar todo</Button>
          <Button size="sm" onClick={onClose}>Entendido</Button>
        </>
      }
    >
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <div className="space-y-3 text-sm">
        {credentials.tenantName && (
          <div className="rounded-lg px-3 py-2" style={{ background: INPUT_BG, border: `1px solid ${primaryMix(30)}` }}>
            <div className="text-xs text-gray-500">Institución</div>
            <div className="text-[var(--color-text-primary)] font-medium">{credentials.tenantName}</div>
          </div>
        )}
        {[
          { label: 'Nombre', value: credentials.fullName },
          { label: 'Usuario de acceso', value: credentials.loginUsername },
          { label: 'Email (contacto)', value: credentials.email },
          { label: 'DNI', value: credentials.dni },
          { label: 'Rol', value: credentials.role },
        ].filter((item) => item.value).map((item) => (
          <div key={item.label} className="rounded-lg px-3 py-2" style={{ background: INPUT_BG, border: '1px solid var(--color-surface-border)' }}>
            <div className="text-xs text-gray-500">{item.label}</div>
            <div className="text-[var(--color-text-primary)] font-medium break-all">{item.value}</div>
          </div>
        ))}
        <div className="rounded-lg px-3 py-2" style={{ background: `${warningMix(12)}`, border: `1px solid ${goldBrightMix(40)}` }}>
          <div className="text-xs" style={{ color: GOLD }}>Contraseña temporal</div>
          <div className="text-[var(--color-text-primary)] font-bold tracking-wide">{credentials.temporaryPassword}</div>
        </div>
      </div>
    </Modal>
  )
}

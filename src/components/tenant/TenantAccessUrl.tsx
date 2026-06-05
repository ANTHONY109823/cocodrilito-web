'use client'

import { useState } from 'react'
import {
  copyTenantAccessUrl,
  getTenantAccessHost,
  getTenantAccessUrl,
} from '@/lib/utils/tenantUrl'
import { NEON } from '@/lib/constants/theme'

interface TenantAccessUrlProps {
  slug: string
  customDomain?: string | null
  compact?: boolean
}

export function TenantAccessUrl({ slug, customDomain, compact = false }: TenantAccessUrlProps) {
  const [copied, setCopied] = useState(false)
  const url = getTenantAccessUrl(slug, customDomain)
  const host = getTenantAccessHost(slug, customDomain)

  const handleCopy = async () => {
    const ok = await copyTenantAccessUrl(slug, customDomain)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:underline"
          style={{ color: NEON }}
        >
          {host}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs px-2 py-0.5 rounded-md transition-colors"
          style={{
            background: 'rgba(74,124,89,0.12)',
            color: copied ? NEON : '#9CA3AF',
            border: '1px solid rgba(74,124,89,0.25)',
          }}
        >
          {copied ? 'Copiado' : 'Copiar URL'}
        </button>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{ background: 'rgba(74,124,89,0.06)', border: '1px solid rgba(74,124,89,0.2)' }}
    >
      <p className="text-xs text-gray-500">Tu URL de acceso</p>
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold hover:underline"
          style={{ color: NEON }}
        >
          {host}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
          style={{
            background: 'rgba(74,124,89,0.15)',
            color: copied ? NEON : '#fff',
            border: '1px solid rgba(74,124,89,0.3)',
          }}
        >
          {copied ? '✓ Copiado' : 'Copiar URL'}
        </button>
      </div>
      <p className="text-xs text-gray-500">Comparte esta URL con tus alumnos para que ingresen con tu branding.</p>
    </div>
  )
}

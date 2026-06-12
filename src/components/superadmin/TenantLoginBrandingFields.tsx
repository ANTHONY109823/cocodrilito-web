'use client'

import {
  DEFAULT_LOGIN_BRANDING,
  featuresToText,
  textToFeatures,
  type TenantLoginBranding,
} from '@/lib/constants/defaultLoginBranding'

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm text-white outline-none'
const inputStyle = { background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15' }

interface TenantLoginBrandingFieldsProps {
  value: TenantLoginBranding
  onChange: (value: TenantLoginBranding) => void
}

export function emptyLoginBranding(): TenantLoginBranding {
  return {
    ...DEFAULT_LOGIN_BRANDING,
    features: [...DEFAULT_LOGIN_BRANDING.features],
    stats: DEFAULT_LOGIN_BRANDING.stats.map((s) => ({ ...s })),
  }
}

export function TenantLoginBrandingFields({ value, onChange }: TenantLoginBrandingFieldsProps) {
  const set = (patch: Partial<TenantLoginBranding>) => onChange({ ...value, ...patch })

  const updateStat = (index: number, patch: Partial<{ value: string; label: string }>) => {
    const stats = value.stats.map((s, i) => (i === index ? { ...s, ...patch } : s))
    set({ stats })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Personaliza los textos del panel de inicio de sesión. El logo y la imagen de fondo se configuran
        en la sección <strong className="text-gray-400">Identidad visual</strong> (arriba).
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Subtítulo bajo el nombre</label>
          <input className={inputClass} style={inputStyle}
            value={value.brandTagline}
            onChange={(e) => set({ brandTagline: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Línea de especialidades</label>
          <input className={inputClass} style={inputStyle}
            value={value.brandSub}
            onChange={(e) => set({ brandSub: e.target.value })} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Título principal (línea 1)</label>
          <input className={inputClass} style={inputStyle}
            value={value.headlineNormal}
            onChange={(e) => set({ headlineNormal: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Título principal (acento)</label>
          <input className={inputClass} style={inputStyle}
            value={value.headlineAccent}
            onChange={(e) => set({ headlineAccent: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Descripción</label>
        <textarea className={inputClass} style={{ ...inputStyle, minHeight: 72 }} rows={3}
          value={value.description}
          onChange={(e) => set({ description: e.target.value })} />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Beneficios (uno por línea)</label>
        <textarea className={inputClass} style={{ ...inputStyle, minHeight: 120 }} rows={6}
          value={featuresToText(value.features)}
          onChange={(e) => set({ features: textToFeatures(e.target.value) })} />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Frase de cierre (CTA)</label>
        <input className={inputClass} style={inputStyle}
          value={value.ctaTagline}
          onChange={(e) => set({ ctaTagline: e.target.value })} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {value.stats.map((stat, index) => (
          <div key={index} className="space-y-2 rounded-lg p-3" style={{ border: '1px solid #ffffff10' }}>
            <p className="text-[10px] text-gray-500">Estadística {index + 1}</p>
            <input className={inputClass} style={inputStyle} placeholder="100%"
              value={stat.value}
              onChange={(e) => updateStat(index, { value: e.target.value })} />
            <input className={inputClass} style={inputStyle} placeholder="Etiqueta"
              value={stat.label}
              onChange={(e) => updateStat(index, { label: e.target.value })} />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3 pt-2" style={{ borderTop: '1px solid #ffffff10' }}>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">URL de WhatsApp (botón superior)</label>
          <input className={inputClass} style={inputStyle} placeholder="https://wa.me/51..."
            value={value.whatsappUrl}
            onChange={(e) => set({ whatsappUrl: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">URL TikTok</label>
          <input className={inputClass} style={inputStyle}
            value={value.tiktokUrl}
            onChange={(e) => set({ tiktokUrl: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">URL Facebook</label>
          <input className={inputClass} style={inputStyle}
            value={value.facebookUrl}
            onChange={(e) => set({ facebookUrl: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">URL Instagram</label>
          <input className={inputClass} style={inputStyle}
            value={value.instagramUrl}
            onChange={(e) => set({ instagramUrl: e.target.value })} />
        </div>
      </div>
    </div>
  )
}

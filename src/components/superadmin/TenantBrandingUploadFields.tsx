'use client'

import { useEffect, useRef } from 'react'
import { NEON } from '@/lib/constants/theme'

export const MAX_BRANDING_IMAGE_BYTES = 2 * 1024 * 1024
export const ALLOWED_BRANDING_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface BrandingImageFieldProps {
  label: string
  hint: string
  previewUrl: string | null
  selectedFileName?: string | null
  onSelect: (file: File) => void
  disabled?: boolean
  largePreview?: boolean
}

function BrandingImageField({
  label,
  hint,
  previewUrl,
  selectedFileName,
  onSelect,
  disabled,
  largePreview,
}: BrandingImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onSelect(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-black/30 overflow-hidden ${
            largePreview ? 'h-28 w-full max-w-[220px]' : 'h-20 w-20'
          }`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className={`h-full w-full ${largePreview ? 'object-cover' : 'object-contain'}`}
            />
          ) : (
            <span className="text-xl text-gray-600">🖼</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={disabled}
            onChange={handleChange}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity"
            style={{
              backgroundColor: `${NEON}18`,
              color: NEON,
              border: `1px solid ${NEON}35`,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Elegir imagen
          </button>
          <p className="text-[10px] text-gray-600 max-w-[220px]">{hint}</p>
          {selectedFileName && (
            <p className="text-[10px] font-medium" style={{ color: NEON }}>
              ✓ {selectedFileName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export interface TenantBrandingFiles {
  logoFile: File | null
  logoPreview: string | null
  backgroundFile: File | null
  backgroundPreview: string | null
}

interface TenantBrandingUploadFieldsProps {
  value: TenantBrandingFiles
  onChange: (value: TenantBrandingFiles) => void
  disabled?: boolean
  existingLogoUrl?: string | null
  existingBackgroundUrl?: string | null
  required?: boolean
}

export function TenantBrandingUploadFields({
  value,
  onChange,
  disabled,
  existingLogoUrl,
  existingBackgroundUrl,
  required = false,
}: TenantBrandingUploadFieldsProps) {
  useEffect(() => {
    return () => {
      if (value.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(value.logoPreview)
      if (value.backgroundPreview?.startsWith('blob:')) URL.revokeObjectURL(value.backgroundPreview)
    }
  }, [value.logoPreview, value.backgroundPreview])

  const selectLogo = (file: File) => {
    if (!ALLOWED_BRANDING_TYPES.includes(file.type)) return
    if (file.size > MAX_BRANDING_IMAGE_BYTES) return
    if (value.logoPreview?.startsWith('blob:')) URL.revokeObjectURL(value.logoPreview)
    onChange({
      ...value,
      logoFile: file,
      logoPreview: URL.createObjectURL(file),
    })
  }

  const selectBackground = (file: File) => {
    if (!ALLOWED_BRANDING_TYPES.includes(file.type)) return
    if (file.size > MAX_BRANDING_IMAGE_BYTES) return
    if (value.backgroundPreview?.startsWith('blob:')) URL.revokeObjectURL(value.backgroundPreview)
    onChange({
      ...value,
      backgroundFile: file,
      backgroundPreview: URL.createObjectURL(file),
    })
  }

  const logoPreview = value.logoPreview ?? existingLogoUrl ?? null
  const backgroundPreview = value.backgroundPreview ?? existingBackgroundUrl ?? null

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <BrandingImageField
        label={required ? 'Logo de la institución *' : 'Logo de la institución'}
        hint="Escudo o isotipo. JPG, PNG o WebP · máx. 2 MB"
        previewUrl={logoPreview}
        selectedFileName={value.logoFile?.name}
        onSelect={selectLogo}
        disabled={disabled}
      />
      <BrandingImageField
        label={required ? 'Imagen de fondo del login *' : 'Imagen de fondo del login'}
        hint="1920×1080 recomendado · JPG preferido · máx. 500 KB ideal (hasta 2 MB). Reemplaza el fondo del login."
        previewUrl={backgroundPreview}
        selectedFileName={value.backgroundFile?.name}
        onSelect={selectBackground}
        disabled={disabled}
        largePreview
      />
    </div>
  )
}

export const emptyTenantBrandingFiles = (): TenantBrandingFiles => ({
  logoFile: null,
  logoPreview: null,
  backgroundFile: null,
  backgroundPreview: null,
})

export function validateTenantBrandingFiles(
  files: TenantBrandingFiles,
  options?: { requireLogo?: boolean; requireBackground?: boolean }
): string | null {
  const requireLogo = options?.requireLogo ?? true
  const requireBackground = options?.requireBackground ?? true

  const checkFile = (file: File | null, label: string) => {
    if (!file) return null
    if (!ALLOWED_BRANDING_TYPES.includes(file.type)) {
      return `${label}: solo JPG, PNG o WebP`
    }
    if (file.size > MAX_BRANDING_IMAGE_BYTES) {
      return `${label}: no puede superar 2 MB`
    }
    return null
  }

  if (requireLogo && !files.logoFile) {
    return 'Selecciona el logo de la institución'
  }
  if (requireBackground && !files.backgroundFile) {
    return 'Selecciona la imagen de fondo del login'
  }

  return (
    checkFile(files.logoFile, 'Logo') ??
    checkFile(files.backgroundFile, 'Imagen de fondo')
  )
}

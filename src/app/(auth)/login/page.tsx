'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'
import { useTenantConfig } from '@/hooks/useTenantConfig'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LoginCarousel } from '@/components/auth/LoginCarousel'

const SOCIAL_LINKS = [
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://tiktok.com/@cocodrilito', // TODO: URL real
    icon: 'tiktok' as const,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://facebook.com/cocodrilito', // TODO: URL real
    icon: 'facebook' as const,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com/cocodrilito', // TODO: URL real
    icon: 'instagram' as const,
  },
]

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#318F48" width="18" height="18" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function LoginField({
  label,
  type,
  value,
  onChange,
  icon: Icon,
  disabled,
  autoComplete,
}: {
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (v: string) => void
  icon: typeof Mail
  disabled?: boolean
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && show ? 'text' : type

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-wide text-[#BDFFDF]">{label}</label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#BDFFDF]/60"
          aria-hidden
        />
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={type === 'email' ? 'tu@email.com' : 'Tu contraseña'}
          className="w-full rounded-[10px] border border-[rgba(189,255,223,0.18)] bg-white/5 py-3.5 pl-10 pr-10 text-[15px] text-white outline-none transition-all placeholder:text-white/25 focus:border-[#318F48] focus:shadow-[0_0_0_3px_rgba(49,143,72,0.2)] disabled:opacity-50"
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BDFFDF]/60 hover:text-[#BDFFDF]"
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        )}
      </div>
    </div>
  )
}

function WhatsAppFloatingButton() {
  return (
    <button
      type="button"
      onClick={() =>
        window.open(
          'https://wa.me/51927577686?text=Hola%2C%20quiero%20informes%20sobre%20Cocodrilito%20PNP',
          '_blank'
        )
      }
      className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full border-none bg-[#BDFFDF] px-4 py-2.5 text-[13px] font-extrabold text-[#0A1A0F] shadow-[0_4px_20px_rgba(189,255,223,0.25),0_2px_8px_rgba(0,0,0,0.3)] transition-all hover:scale-105 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_30px_rgba(189,255,223,0.4)] md:top-5 md:right-5 md:px-[22px] md:py-[13px] md:text-sm"
    >
      <WhatsAppIcon />
      Informes aquí
    </button>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuthStore()

  const tenantSlug = useMemo(
    () => searchParams.get('academia') || searchParams.get('agencia') || null,
    [searchParams]
  )

  const { config, loading: configLoading } = useTenantConfig(tenantSlug)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const brandName = config?.name || 'Cocodrilito'
  const brandSub = config?.welcomeMessage || 'Simulador de exámenes PNP'
  const formDisabled = config !== null && !config.isActive

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email: email.trim(), password })
      setUser(normalizeUser(res.data as unknown as Record<string, unknown>))
      router.push('/dashboard')
    } catch (err: unknown) {
      if (!axios.isAxiosError(err) || !err.response) {
        setError('No se pudo conectar con el servidor. Revisa tu conexión o intenta más tarde.')
        return
      }
      const status = err.response?.status
      if (status === 500) {
        setError(
          getApiErrorMessage(
            err,
            'Error del servidor al iniciar sesión. El administrador debe aplicar las migraciones de base de datos.'
          )
        )
        return
      }
      setError(getApiErrorMessage(err, 'Credenciales incorrectas. Verifica tu email y contraseña.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider config={config}>
      <div className="login-page-bg relative flex min-h-screen items-center justify-center bg-[#080E0A] p-4 md:p-8">
        <WhatsAppFloatingButton />

        <div
          className="relative z-10 grid w-full min-h-[480px] overflow-hidden rounded-[20px] border border-[rgba(189,255,223,0.15)] shadow-[0_30px_80px_rgba(0,0,0,0.6)] md:grid-cols-2"
          style={{ width: 'min(900px, 95vw)' }}
        >
          <div className="order-1 md:order-none md:min-h-[520px]">
            <LoginCarousel
              brandName={brandName}
              brandSub={brandSub}
              logoUrl={config?.logoUrl}
            />
          </div>

          <div className="order-2 flex flex-col justify-center gap-5 bg-[#0D1A10] px-6 py-8 md:px-9 md:py-10">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Iniciar sesión</h2>
              <p className="mt-1 text-[13px] text-white/45">
                {configLoading ? 'Cargando...' : 'Bienvenido de vuelta'}
              </p>
            </div>

            {config && !config.isActive && (
              <p className="rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-2 text-sm text-[#FF6B6B]">
                Esta institución no está activa actualmente.
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <LoginField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={setEmail}
                icon={Mail}
                autoComplete="email"
                disabled={formDisabled}
              />
              <LoginField
                label="Contraseña"
                type="password"
                value={password}
                onChange={setPassword}
                icon={Lock}
                autoComplete="current-password"
                disabled={formDisabled}
              />

              <button
                type="submit"
                disabled={loading || formDisabled}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] border-none text-[15px] font-bold text-white transition-all hover:-translate-y-px hover:shadow-[0_8px_25px_rgba(49,143,72,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: loading
                    ? '#256B38'
                    : 'linear-gradient(135deg, #318F48 0%, #256B38 100%)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>

              {error && (
                <div
                  className="flex items-center gap-2 rounded-lg border border-[rgba(192,57,43,0.3)] bg-[rgba(192,57,43,0.12)] px-3.5 py-2.5 text-[13px] text-[#FF6B6B]"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </form>

            <p className="text-center text-[13px] text-white/45">
              ¿No tienes cuenta?{' '}
              <Link
                href="/register"
                className="font-semibold text-[#318F48] hover:text-[#BDFFDF]"
              >
                Regístrate gratis
              </Link>
            </p>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <span className="whitespace-nowrap text-xs text-white/30">O síguenos en</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <div className="flex gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-white/10 bg-white/5 px-2 py-2.5 text-xs text-white/70 transition-all hover:border-[#318F48] hover:bg-[rgba(49,143,72,0.15)] hover:text-[#BDFFDF] md:gap-1.5"
                >
                  {social.icon === 'tiktok' && <TikTokIcon />}
                  {social.icon === 'facebook' && <FacebookIcon />}
                  {social.icon === 'instagram' && <InstagramIcon />}
                  <span className="hidden sm:inline">{social.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-page-bg flex min-h-screen items-center justify-center bg-[#080E0A]">
          <p className="text-[#A8BFB0]">Cargando...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

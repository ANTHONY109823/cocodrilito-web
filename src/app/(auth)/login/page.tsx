'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import {
  CheckCircle2,
  Clock,
  Lock,
  Mail,
  Shield,
  Trophy,
  Users,
} from 'lucide-react'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'
import { useTenantConfig } from '@/hooks/useTenantConfig'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Button, Input } from '@/components/ui'

const FEATURES = [
  { icon: CheckCircle2, text: '+10,000 preguntas actualizadas' },
  { icon: Clock, text: 'Simulacros cronometrados' },
  { icon: Trophy, text: 'Ranking y gamificación' },
] as const

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
      setError(getApiErrorMessage(err, 'Credenciales incorrectas. Verifica tu email y contraseña.'))
    } finally {
      setLoading(false)
    }
  }

  const formDisabled = config !== null && !config.isActive

  return (
    <ThemeProvider config={config}>
      <div className="min-h-screen flex bg-[#0A0F0D]">
        {/* Panel izquierdo — solo desktop */}
        <aside
          className="relative hidden lg:flex lg:w-[60%] flex-col justify-between overflow-hidden px-12 xl:px-16 py-12"
          style={{
            background: 'linear-gradient(180deg, #0A0F0D 0%, #0F1F14 50%, #0A0F0D 100%)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(#4A7C59 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden
          />
          <div className="relative z-10">
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl border border-[#1E3328] bg-[#111A14]/80 text-6xl shadow-lg shadow-[#4A7C59]/10">
              {config?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logoUrl} alt="" className="h-20 w-20 object-contain" />
              ) : (
                <Shield className="h-16 w-16 text-[#4A7C59]" strokeWidth={1.25} />
              )}
            </div>
            <h1 className="mt-10 max-w-lg text-4xl xl:text-5xl font-extrabold text-white leading-tight">
              Prepárate para ser Policía
            </h1>
            <p className="mt-4 max-w-md text-lg text-[#A8BFB0]">
              La plataforma #1 de simulacros PNP en el Perú
            </p>
            <ul className="mt-10 space-y-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[#A8BFB0]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4A7C59]/15 text-[#4A7C59]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-base">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="relative z-10 flex items-center gap-2 text-sm text-[#6B8A75]">
            <Users className="h-4 w-4 text-[#4A7C59]" />
            Miles de policías ya aprobaron con Cocodrilito
          </p>
        </aside>

        {/* Panel derecho — formulario */}
        <main className="flex flex-1 flex-col justify-center border-[#1E3328] lg:border-l lg:w-[40%] bg-[#111A14] px-6 py-10 sm:px-12 lg:px-12 xl:px-[48px]">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 lg:hidden flex flex-col items-center text-center">
              {config?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logoUrl} alt={brandName} className="h-14 mb-3 object-contain" />
              ) : (
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#4A7C59]/15 text-3xl">
                  🐊
                </div>
              )}
              <span className="text-lg font-bold text-white">{brandName}</span>
            </div>

            <div className="mb-8 hidden lg:flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A7C59]/15 text-xl">
                🐊
              </div>
              <span className="font-bold text-white">{brandName}</span>
            </div>

            <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-[#A8BFB0]">
              {configLoading ? 'Cargando...' : 'Bienvenido de vuelta'}
            </p>

            {config && !config.isActive && (
              <p className="mt-3 rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-2 text-sm text-[#e74c3c]">
                Esta institución no está activa actualmente.
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                iconLeft={Mail}
                required
                autoComplete="email"
                disabled={formDisabled}
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                iconLeft={Lock}
                required
                autoComplete="current-password"
                disabled={formDisabled}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
                disabled={formDisabled}
              >
                Ingresar
              </Button>

              {error && (
                <div
                  className="rounded-lg border border-[#C0392B]/40 bg-[#C0392B]/10 px-4 py-3 text-sm text-[#e74c3c]"
                  role="alert"
                >
                  {error}
                </div>
              )}
            </form>

            <p className="mt-8 text-center text-sm text-[#A8BFB0]">
              ¿No tienes cuenta?{' '}
              <Link
                href="/register"
                className="font-semibold text-[#4A7C59] hover:text-[#6B9E7A] transition-colors"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0A0F0D]">
          <p className="text-[#A8BFB0]">Cargando...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

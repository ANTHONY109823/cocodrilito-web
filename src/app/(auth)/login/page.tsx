'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { CheckCircle2, Clock, Mail, Lock, Trophy } from 'lucide-react'
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

const STATS = [
  { n: '4,888', l: 'vacantes 2025' },
  { n: '80K+', l: 'postulantes/año' },
  { n: '95%', l: 'satisfacción' },
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
      setError(getApiErrorMessage(err, 'Credenciales incorrectas. Verifica tu email y contraseña.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider config={config}>
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F0D] p-4 lg:p-8">
        <div className="grid w-full max-w-5xl min-h-[480px] overflow-hidden rounded-2xl border border-[#1E3328] lg:grid-cols-[1.4fr_1fr]">
          {/* Izquierda */}
          <div className="hidden lg:flex flex-col justify-between bg-[#0F1F14] px-9 py-10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#4A7C59] text-[22px]">
                {config?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={config.logoUrl} alt="" className="h-7 w-7 object-contain" />
                ) : (
                  '🐊'
                )}
              </div>
              <div>
                <div className="text-lg font-bold text-white">{brandName}</div>
                <span className="text-xs font-normal text-[#6B9E7A]">{brandSub}</span>
              </div>
            </div>

            <div className="flex flex-col gap-5 py-6">
              <h1 className="text-[26px] font-extrabold leading-tight text-white">
                Prepárate para
                <br />
                ser <em className="text-[#4A7C59] not-italic">Policía</em>
              </h1>
              <p className="text-sm leading-relaxed text-[#6B8A75]">
                La plataforma #1 de simulacros PNP
                <br />
                en el Perú. Aprueba con confianza.
              </p>
              <ul className="mt-1 flex flex-col gap-3">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-[13px] text-[#A8BFB0]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1E3328]">
                      <Icon className="h-3.5 w-3.5 text-[#4A7C59]" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-5">
              {STATS.map(({ n, l }) => (
                <div key={l} className="text-center">
                  <div className="text-xl font-extrabold text-[#4A7C59]">{n}</div>
                  <div className="text-[11px] text-[#6B8A75]">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Derecha — formulario */}
          <div className="flex flex-col justify-center gap-5 border-[#1E3328] bg-[#111A14] px-6 py-10 sm:px-9 lg:border-l lg:px-9">
            <div className="lg:hidden flex items-center gap-2.5 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#4A7C59] text-xl">
                🐊
              </div>
              <div>
                <div className="font-bold text-white">{brandName}</div>
                <span className="text-xs text-[#6B8A75]">{brandSub}</span>
              </div>
            </div>

            <div>
              <h2 className="text-[22px] font-bold text-white">Iniciar sesión</h2>
              <p className="mt-0.5 text-[13px] text-[#6B8A75]">
                {configLoading ? 'Cargando...' : 'Bienvenido de vuelta'}
              </p>
            </div>

            {config && !config.isActive && (
              <p className="rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-2 text-sm text-[#e74c3c]">
                Esta institución no está activa actualmente.
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

              <Button type="submit" size="lg" fullWidth loading={loading} disabled={formDisabled}>
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

            <p className="text-center text-[13px] text-[#6B8A75]">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="font-medium text-[#4A7C59] hover:text-[#6B9E7A]">
                Regístrate gratis
              </Link>
            </p>
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
        <div className="min-h-screen flex items-center justify-center bg-[#0A0F0D]">
          <p className="text-[#A8BFB0]">Cargando...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

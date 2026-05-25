'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import axios from 'axios'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'
import { useTenantConfig } from '@/hooks/useTenantConfig'
import { ThemeProvider } from '@/components/ThemeProvider'
import { NEON } from '@/lib/constants/theme'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuthStore()

  const tenantSlug = useMemo(() => {
    return searchParams.get('academia') || searchParams.get('agencia') || null
  }, [searchParams])

  const { config, loading: configLoading } = useTenantConfig(tenantSlug)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const brandName = config?.name || 'Cocodrilito'
  const welcomeMessage = config?.welcomeMessage || 'Simulador de exámenes PNP'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({
        email: email.trim(),
        password,
      })
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
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#0A0F0D' }}>
        <style>{`
          @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
          .fade-in { animation: fadeIn 0.4s ease forwards; }
          .input-custom {
            width:100%; padding:12px 16px; border-radius:12px;
            background:rgba(0,8,4,0.8); border:1px solid #ffffff15;
            color:#fff; font-size:14px; outline:none; transition:border 0.2s;
          }
          .input-custom:focus { border-color:${NEON}60; }
          .input-custom::placeholder { color:#4B5563; }
        `}</style>

        <div className="w-full max-w-sm fade-in">
          <div className="text-center mb-8">
            {config?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logoUrl} alt={brandName} className="h-16 mx-auto mb-3 object-contain" />
            ) : (
              <div className="text-5xl mb-3">🐊</div>
            )}
            <h1 className="text-2xl font-bold text-white">{brandName}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {configLoading ? 'Cargando...' : welcomeMessage}
            </p>
            {config && !config.isActive && (
              <p className="text-sm mt-2 text-red-400">Esta institución no está activa actualmente.</p>
            )}
          </div>

          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(0,8,4,0.9)', border: '1px solid #ffffff10' }}>
            <h2 className="text-white font-bold text-lg mb-5">Iniciar sesión</h2>

            {error && (
              <div className="rounded-xl px-4 py-3 mb-4 text-sm"
                style={{ backgroundColor: 'rgba(255,82,82,0.1)', border: '1px solid #FF525230', color: '#FF5252' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Correo electrónico</label>
                <input className="input-custom" type="email" placeholder="juan@gmail.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Contraseña</label>
                <input className="input-custom" type="password" placeholder="Tu contraseña"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading || (config !== null && !config.isActive)}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`,
                  color: '#000', opacity: loading ? 0.7 : 1,
                  boxShadow: `0 0 20px ${NEON}40`,
                }}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-600 text-sm mt-4">
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: NEON }}>Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0F0D' }}>
        <p className="text-gray-500">Cargando...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { AlertCircle, Loader2 } from 'lucide-react'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { normalizeUser, useAuthStore } from '@/lib/store/authStore'
import { useTenantConfig } from '@/hooks/useTenantConfig'
import { ThemeProvider } from '@/components/ThemeProvider'
import { JoinRequestModal } from '@/components/auth/JoinRequestModal'
import './login-platform.css'

const SOCIAL_LINKS = [
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://tiktok.com/@cocodrilito',
    icon: 'tiktok' as const,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://facebook.com/cocodrilito',
    icon: 'facebook' as const,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com/cocodrilito',
    icon: 'instagram' as const,
  },
]

const WA_URL =
  'https://wa.me/51927577686?text=Hola%2C%20quiero%20informes%20sobre%20Cocodrilito%20PNP'

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.428c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="ig-login" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="30%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285AEB" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ig-login)"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
      />
    </svg>
  )
}

function useLoginDecorEffects() {
  const particlesRef = useRef<HTMLDivElement>(null)
  const loginBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const container = particlesRef.current
    if (!container) return

    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div')
      p.className = 'particle'
      const s = Math.random() * 3 + 1.5
      p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;bottom:${Math.random() * 50}%;--dur:${Math.random() * 5 + 4}s;--delay:${Math.random() * 7}s;`
      container.appendChild(p)
    }
  }, [])

  useEffect(() => {
    const btn = loginBtnRef.current
    if (!btn) return

    const onEnter = () => {
      btn.style.letterSpacing = '7px'
    }
    const onLeave = () => {
      btn.style.letterSpacing = '5px'
    }
    btn.addEventListener('mouseenter', onEnter)
    btn.addEventListener('mouseleave', onLeave)
    return () => {
      btn.removeEventListener('mouseenter', onEnter)
      btn.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return { particlesRef, loginBtnRef }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuthStore()
  const { particlesRef, loginBtnRef } = useLoginDecorEffects()

  const { config, loading: configLoading } = useTenantConfig()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showJoinRequest, setShowJoinRequest] = useState(false)

  useEffect(() => {
    if (searchParams.get('join') === '1') {
      setShowJoinRequest(true)
    }
  }, [searchParams])

  const formDisabled = config !== null && !config.isActive
  const displayName = config?.name ?? 'LYON'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email: email.trim(), password })
      const loggedUser = normalizeUser(res.data as unknown as Record<string, unknown>)
      setUser(loggedUser)

      const nextPath = searchParams.get('next')
      const safeNext =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
          ? nextPath
          : null

      if (loggedUser.mustChangePassword) {
        router.push('/cambiar-clave')
      } else {
        router.push(safeNext ?? '/dashboard')
      }
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
      <div className="loginRoot">
        <div className="bg-wrap">
          <div className="bg-lion" />
          <div className="bg-clouds" aria-hidden>
            <div className="cloud-wave cloud-wave-1" />
            <div className="cloud-wave cloud-wave-2" />
            <div className="cloud-wave cloud-wave-3" />
          </div>
          <div className="bg-overlay" />
          <div className="particles" ref={particlesRef} />
        </div>

        <a className="wa" href={WA_URL} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="white" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Informes aquí
        </a>

        <main className="page">
        <div className="brand">
          <h1 className="brand-name">{displayName}</h1>
          <p className="brand-tagline">Plataforma de examenes</p>
          <div className="brand-ornament">
          <span className="orn-bar" />
          <span className="orn-dot" />
          <span className="orn-diamond" />
         <span className="orn-dot" />
          <span className="orn-bar" />
        </div>
        <p className="brand-sub" style={{ color: '#000000', fontWeight: '600', textShadow: '0 0 8px rgba(255,255,255,0.4)' }}>
          Exámenes &nbsp;·&nbsp; Ascensos &nbsp;·&nbsp; Balotarios &nbsp;·&nbsp; PNP & FF.AA.
         </p>
        </div>

          <div className="card">
            <div className="left">
              <div className="headline">
                <span className="hl-normal">PREPÁRATE PARA LOGRAR</span>
                <span className="hl-accent">TUS METAS</span>
              </div>

              <p className="desc">
                CON LA PLATAFORMA #1 DE SIMULACROS EN EL PERÚ.
                <br />
                Aprueba con confianza — miles ya lo lograron.
              </p>

              <div className="features">
                {[
                  'Preguntas actualizadas',
                  'Simulacros cronometrados',
                  'Ranking y gamificación',
                  'Reportes de progreso personalizados',
                  'especializados en los procesos de ascenso a la PNP',
                  'Perfiles para usuarios y agencias/academias.',
                  'Si eres agencias/academia de admición usa nuestra plataforma y genera ingresos con cada suscripción.',
                  'Si eres postulante o aspirante a la PNP o FF.AA. puedes suscribirte a la plataforma directamente',
                ].map((text) => (
                  <div key={text} className="feat">
                    <div className="feat-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f5c842"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    {text}
                  </div>
                ))}
              </div>

              <p className="tagline">ESTAS A UN PASO DE LOGRAR TUS SUEÑOS ¡SUSCRIBETE YA!</p>

              <div className="stats">
                <div className="stat">
                  <span className="stat-num">100%</span>
                  <span className="stat-lbl">Amigable</span>
                </div>
                <div className="stat">
                  <span className="stat-num">24/7</span>
                  <span className="stat-lbl">A tu disposición</span>
                </div>
                <div className="stat">
                  <span className="stat-num">100%</span>
                  <span className="stat-lbl">Satisfacción</span>
                </div>
              </div>

            </div>

            <div className="right">
              <h2 className="login-title">Iniciar sesión</h2>
              <p className="login-sub">
                {configLoading ? 'Cargando...' : 'Bienvenido de vuelta'}
              </p>

              {config && !config.isActive && (
                <p className="login-error" role="alert">
                  Esta institución no está activa actualmente.
                </p>
              )}

              <form onSubmit={handleSubmit}>
                <div className="field-group">
                  <div className="field">
                    <label className="field-label" htmlFor="login-email">
                      Correo electrónico
                    </label>
                    <div className="field-wrap">
                      <svg
                        className="field-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <input
                        id="login-email"
                        className="login-input"
                        type="email"
                        placeholder="tu@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        disabled={formDisabled || loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="login-password">
                      Contraseña
                    </label>
                    <div className="field-wrap">
                      <svg
                        className="field-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <input
                        id="login-password"
                        className="login-input"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={formDisabled || loading}
                        required
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="login-error" role="alert">
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    {error}
                  </div>
                )}

                <button
                  ref={loginBtnRef}
                  className="login-btn"
                  type="submit"
                  disabled={loading || formDisabled}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }}
                        className="animate-spin"
                      />
                      INGRESANDO...
                    </>
                  ) : (
                    'INGRESAR'
                  )}
                </button>
              </form>
              <div className="register-link">
                ¿Eres agencia o academia?{' '}
                <button
                  type="button"
                  className="join-request-btn"
                  onClick={() => setShowJoinRequest(true)}
                >
                  Solicitar unirse
                </button>
              </div>

              <JoinRequestModal
                open={showJoinRequest}
                onClose={() => setShowJoinRequest(false)}
              />
              
              <div className="divider">
                <span className="div-line" />
                <span className="div-text">o síguenos en</span>
                <span className="div-line" />
                </div>
                <div className="social-btns">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.id}
                    className="soc-btn"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {social.icon === 'tiktok' && <TikTokIcon />}
                    {social.icon === 'facebook' && <FacebookIcon />}
                    {social.icon === 'instagram' && <InstagramIcon />}
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
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
        <div
          className="loginRoot"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#060e07',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          Cargando...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

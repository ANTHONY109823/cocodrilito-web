'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'

const NEON = '#00C87A'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      setAuth(res.data.user, res.data.accessToken)
      router.push('/dashboard')
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
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
          <div className="text-5xl mb-3">🐊</div>
          <h1 className="text-2xl font-bold text-white">Cocodrilito</h1>
          <p className="text-gray-500 text-sm mt-1">Simulador de exámenes PNP</p>
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
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Contraseña</label>
              <input className="input-custom" type="password" placeholder="Tu contraseña"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${NEON}, #009A5E)`,
                color: '#000', opacity: loading ? 0.7 : 1,
                boxShadow: `0 0 20px ${NEON}40`
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
  )
}
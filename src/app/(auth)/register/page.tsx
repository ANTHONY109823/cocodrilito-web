'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/authStore'
import Link from 'next/link'

import { NEON } from '@/lib/constants/theme'

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    fullName: '', dni: '', rank: '', unit: '', email: '', password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register(form)
      setAuth(res.data.user, res.data.accessToken)
      router.push('/premium?new=1')
    } catch {
      setError('Error al registrarse. Verifica que tu DNI y email no estén en uso.')
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
          width: 100%; padding: 12px 16px; border-radius: 12px;
          background: rgba(0,8,4,0.8); border: 1px solid #ffffff15;
          color: #fff; font-size: 14px; outline: none; transition: border 0.2s;
        }
        .input-custom:focus { border-color: ${NEON}60; }
        .input-custom::placeholder { color: #4B5563; }
      `}</style>

      <div className="w-full max-w-md fade-in">
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐊</div>
          <h1 className="text-2xl font-bold text-white">Cocodrilito</h1>
          <p className="text-gray-500 text-sm mt-1">Simulador de exámenes PNP</p>
        </div>

        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(0,8,4,0.9)', border: '1px solid #ffffff10' }}>
          <h2 className="text-white font-bold text-lg mb-5">Crear cuenta</h2>
          <p className="text-gray-500 text-xs mb-5">
            Prepárate para tu ascenso
          </p>

          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm"
              style={{ backgroundColor: 'rgba(255,82,82,0.1)', border: '1px solid #FF525230', color: '#FF5252' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Nombre completo</label>
              <input className="input-custom" placeholder="Juan Pérez Torres"
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">DNI</label>
                <input className="input-custom" placeholder="12345678" maxLength={8}
                  value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Grado</label>
                <input className="input-custom" placeholder="Suboficial de 3ra"
                  value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Unidad</label>
              <input className="input-custom" placeholder="Comisaría Lima Norte"
                value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Correo electrónico</label>
              <input className="input-custom" type="email" placeholder="juan@gmail.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Contraseña</label>
              <input className="input-custom" type="password" placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm mt-2 transition-all hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`,
                color: '#000', opacity: loading ? 0.7 : 1,
                boxShadow: `0 0 20px ${NEON}40`
              }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-sm mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: NEON }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

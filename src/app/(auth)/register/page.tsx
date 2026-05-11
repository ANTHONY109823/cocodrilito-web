'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { authApi } from '@/lib/api/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    dni: '', email: '', password: '',
    fullName: '', rank: '', unit: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.register(form)
      setAuth(res.data.user, res.data.accessToken)
      router.push('/dashboard')
    } catch {
      setError('Error al registrarse. Verifica que tu DNI y email no estén en uso.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐊</div>
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="text-gray-400 mt-1 text-sm">Prepárate para tu ascenso</p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre completo</label>
              <input name="fullName" type="text" className="input-field"
                placeholder="Juan Pérez Torres" value={form.fullName}
                onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">DNI</label>
                <input name="dni" type="text" className="input-field"
                  placeholder="12345678" maxLength={8} value={form.dni}
                  onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Grado</label>
                <input name="rank" type="text" className="input-field"
                  placeholder="Suboficial" value={form.rank}
                  onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Unidad</label>
              <input name="unit" type="text" className="input-field"
                placeholder="Comisaría Lima Centro" value={form.unit}
                onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Correo electrónico</label>
              <input name="email" type="email" className="input-field"
                placeholder="tu@email.com" value={form.email}
                onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
              <input name="password" type="password" className="input-field"
                placeholder="Mínimo 8 caracteres" value={form.password}
                onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-green-400 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
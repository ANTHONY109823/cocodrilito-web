'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import apiClient from '@/lib/api/client'
import Link from 'next/link'

import { NEON } from '@/lib/constants/theme'
const RED = '#FF5252'
const GOLD = '#FFD700'

export default function ProfilePage() {
  const { user, setAuth, loadFromStorage } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [subInfo, setSubInfo] = useState<{ expiresAt: string; daysLeft: number } | null>(null)

  const [profileForm, setProfileForm] = useState({
    rank: user?.rank || '',
    unit: user?.unit || '',
  })

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    loadFromStorage()
    loadSubInfo()
  }, [])

  useEffect(() => {
    if (user) setProfileForm({ rank: user.rank, unit: user.unit })
  }, [user])

  const loadSubInfo = async () => {
    try {
      const res = await apiClient.get('/Auth/me')
      if (res.data.subscription) setSubInfo(res.data.subscription)
    } catch { }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await apiClient.put('/Auth/profile', profileForm)
      const token = localStorage.getItem('access_token') || ''
      setAuth({ ...user!, ...profileForm }, token)
      setMsg({ text: '✅ Perfil actualizado correctamente', ok: true })
    } catch {
      setMsg({ text: 'Error al actualizar perfil', ok: false })
    } finally { setLoading(false) }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirmPassword) {
      setMsg({ text: 'Las contraseñas no coinciden', ok: false })
      return
    }
    if (passForm.newPassword.length < 8) {
      setMsg({ text: 'La contraseña debe tener mínimo 8 caracteres', ok: false })
      return
    }
    setLoading(true)
    setMsg(null)
    try {
      await apiClient.put('/Auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      })
      setMsg({ text: '✅ Contraseña actualizada correctamente', ok: true })
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || 'Error al cambiar contraseña', ok: false })
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    background: 'rgba(0,5,2,0.8)', border: '1px solid #ffffff15',
    color: '#fff', fontSize: '13px', outline: 'none'
  }

  return (
    <div className="max-w-xl mx-auto">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors">
          ← Inicio
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
          <p className="text-gray-500 text-sm mt-0.5">Administra tu cuenta</p>
        </div>
      </div>

      {/* INFO BÁSICA */}
      <div className="rounded-2xl p-5 mb-4 fade-in"
        style={{ background: 'rgba(0,8,4,0.9)', border: `1px solid ${NEON}20` }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: `${NEON}20`, color: NEON }}>
            {user?.fullName?.charAt(0)}
          </div>
          <div>
            <div className="text-white font-bold text-lg">{user?.fullName}</div>
            <div className="text-gray-500 text-sm">{user?.email}</div>
            <div className="text-gray-600 text-xs mt-0.5">DNI: {user?.dni}</div>
          </div>
        </div>

        {/* SUSCRIPCIÓN */}
        {subInfo && (
          <div className="rounded-xl p-3 mb-2"
            style={{ backgroundColor: `${NEON}08`, border: `1px solid ${NEON}20` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Plan activo</div>
                <div className="text-sm font-semibold" style={{ color: NEON }}>
                  Premium — vence el {new Date(subInfo.expiresAt).toLocaleDateString('es-PE')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold" style={{ color: subInfo.daysLeft <= 7 ? GOLD : NEON }}>
                  {subInfo.daysLeft}d
                </div>
                <div className="text-xs text-gray-600">restantes</div>
              </div>
            </div>
          </div>
        )}

        {!subInfo && (
          <div className="rounded-xl p-3"
            style={{ backgroundColor: 'rgba(255,82,82,0.06)', border: `1px solid ${RED}20` }}>
            <div className="flex items-center justify-between">
              <div className="text-sm" style={{ color: RED }}>Sin plan activo</div>
              <Link href="/premium"
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`, color: '#000' }}>
                Ver planes →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* MENSAJE */}
      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium fade-in"
          style={{
            backgroundColor: msg.ok ? 'rgba(74,124,89,0.1)' : 'rgba(255,82,82,0.1)',
            border: `1px solid ${msg.ok ? NEON : RED}40`,
            color: msg.ok ? NEON : RED
          }}>
          {msg.text}
        </div>
      )}

      {/* EDITAR GRADO Y UNIDAD */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background: 'rgba(0,8,4,0.9)', border: '1px solid #ffffff08' }}>
        <h2 className="text-white font-bold text-base mb-4">Actualizar datos</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Grado</label>
            <input style={inputStyle} placeholder="Suboficial de 3ra"
              value={profileForm.rank}
              onChange={e => setProfileForm({ ...profileForm, rank: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Unidad</label>
            <input style={inputStyle} placeholder="Comisaría Lima Norte"
              value={profileForm.unit}
              onChange={e => setProfileForm({ ...profileForm, unit: e.target.value })} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
            style={{
              background: `linear-gradient(135deg, ${NEON}, #2D5A3D)`,
              color: '#000', opacity: loading ? 0.7 : 1
            }}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* CAMBIAR CONTRASEÑA */}
      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(0,8,4,0.9)', border: '1px solid #ffffff08' }}>
        <h2 className="text-white font-bold text-base mb-4">Cambiar contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Contraseña actual</label>
            <input style={inputStyle} type="password" placeholder="Tu contraseña actual"
              value={passForm.currentPassword}
              onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Nueva contraseña</label>
            <input style={inputStyle} type="password" placeholder="Mínimo 8 caracteres"
              value={passForm.newPassword}
              onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Confirmar contraseña</label>
            <input style={inputStyle} type="password" placeholder="Repite la nueva contraseña"
              value={passForm.confirmPassword}
              onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ backgroundColor: 'rgba(255,82,82,0.1)', color: RED, border: `1px solid ${RED}25` }}>
            {loading ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

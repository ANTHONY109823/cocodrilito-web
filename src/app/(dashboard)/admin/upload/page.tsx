'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import { resolveApiBaseUrl } from '@/lib/api/apiBaseUrl'
import { getApiErrorDetail } from '@/lib/api/errors'
import { useAuthStore } from '@/lib/store/authStore'
import { isSuperAdmin, isTenantAdmin } from '@/lib/auth/roles'

export default function UploadPage() {
  const router = useRouter()
  const { user, loadFromStorage } = useAuthStore()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    imported: number
    totalErrors: number
    errors: string[]
    message: string
  } | null>(null)

  useEffect(() => { loadFromStorage() }, [loadFromStorage])

  useEffect(() => {
    if (!user) return
    if (!isSuperAdmin(user.role) && !isTenantAdmin(user.role)) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/admin/import/questions', formData)
      setResult(res.data)
    } catch (err: unknown) {
      const msg = getApiErrorDetail(err, 'Error al importar')
      setResult({
        imported: 0,
        totalErrors: 1,
        errors: [msg],
        message: 'Error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    window.open(`${resolveApiBaseUrl()}/admin/import/template`, '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push('/admin')}
          className="text-gray-400 hover:text-white text-sm mb-4 block">
          ← Volver al admin
        </button>
        <h1 className="text-2xl font-bold text-white">Carga masiva de preguntas 📤</h1>
        <p className="text-gray-400 text-sm mt-1">
          Hasta 400 preguntas por CSV (por categoría). El banco admite hasta 1000 preguntas en total.
        </p>
      </div>

      {/* Formato del CSV */}
      <div className="card mb-6">
        <h3 className="text-white font-semibold mb-3">Formato del archivo CSV</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1A2E24' }}>
                {['Pregunta', 'Categoria', 'Dificultad', 'Año', 'OpcionA', 'OpcionB', 'OpcionC', 'OpcionD', 'OpcionE', 'RespuestaCorrecta', 'Explicacion'].map(h => (
                  <th key={h} className="text-left p-2 text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 text-gray-300">¿Cuál es...?</td>
                <td className="p-2 text-gray-300">DOCTRINA</td>
                <td className="p-2 text-gray-300">Basico</td>
                <td className="p-2 text-gray-300">2025</td>
                <td className="p-2 text-gray-300">Opción A</td>
                <td className="p-2 text-gray-300">Opción B</td>
                <td className="p-2 text-gray-300">Opción C</td>
                <td className="p-2 text-gray-300">Opción D</td>
                <td className="p-2 text-gray-300">-</td>
                <td className="p-2" style={{ color: '#318F48' }}>A</td>
                <td className="p-2 text-gray-300">Explicación</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <strong style={{ color: '#EF9F27' }}>RespuestaCorrecta</strong> debe ser A, B, C, D o E.
          Las categorías recomendadas: DOCTRINA, CODIGO_PENAL, DERECHOS_HUMANOS, REGIMEN_DISCIPLINARIO, TRANSITO
        </div>
        <button onClick={handleDownloadTemplate}
          className="mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: '#1A2E24', color: '#318F48', border: '1px solid #318F48' }}>
          📥 Descargar plantilla CSV
        </button>
      </div>

      {/* Upload */}
      <div className="card mb-6">
        <h3 className="text-white font-semibold mb-4">Subir archivo</h3>

        <div
          className="border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-all"
          style={{ borderColor: file ? '#318F48' : '#1A2E24' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f?.name.endsWith('.csv')) setFile(f)
          }}>
          {file ? (
            <div>
              <div className="text-3xl mb-2">📄</div>
              <div className="text-white font-medium">{file.name}</div>
              <div className="text-gray-500 text-sm">{(file.size / 1024).toFixed(1)} KB</div>
              <button onClick={() => setFile(null)}
                className="text-red-400 text-sm mt-2">
                Quitar archivo
              </button>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-2">📂</div>
              <div className="text-gray-400 mb-2">Arrastra tu CSV aquí o</div>
              <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#1A2E24', color: '#318F48' }}>
                Seleccionar archivo
                <input type="file" accept=".csv" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="btn-primary"
          style={{ opacity: !file || loading ? 0.5 : 1 }}>
          {loading ? '⏳ Importando preguntas...' : '📤 Iniciar importación'}
        </button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="card"
          style={{ borderColor: result.totalErrors === 0 ? '#318F48' : '#EF9F27' }}>
          <h3 className="text-white font-semibold mb-3">Resultado de la importación</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#1A3D2E' }}>
              <div className="text-2xl font-bold" style={{ color: '#318F48' }}>
                {result.imported}
              </div>
              <div className="text-gray-400 text-sm">Preguntas importadas</div>
            </div>
            <div className="text-center p-3 rounded-lg"
              style={{ backgroundColor: result.totalErrors > 0 ? '#2A1A10' : '#1A3D2E' }}>
              <div className="text-2xl font-bold"
                style={{ color: result.totalErrors > 0 ? '#EF9F27' : '#318F48' }}>
                {result.totalErrors}
              </div>
              <div className="text-gray-400 text-sm">Errores</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2" style={{ color: '#EF9F27' }}>
                Detalle de errores:
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((err, i) => (
                  <div key={i} className="text-xs text-gray-400 p-2 rounded"
                    style={{ backgroundColor: '#0F1A14' }}>
                    {err}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.imported > 0 && (
            <button onClick={() => router.push('/admin')}
              className="btn-primary mt-4">
              Ver banco de preguntas →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

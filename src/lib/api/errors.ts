import axios from 'axios'

export function getApiErrorMessage(err: unknown, fallback = 'Error desconocido'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: string[] } | undefined
    return data?.errors?.[0] ?? data?.message ?? err.message ?? fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function getApiErrorDetail(err: unknown, fallback = 'Error'): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const base = getApiErrorMessage(err, fallback)
    if (status === 415 && !base.includes('415')) {
      return `[415] Error 415: el archivo no se envió como multipart.`
    }
    return status ? `[${status}] ${base}` : base
  }
  return getApiErrorMessage(err, fallback)
}

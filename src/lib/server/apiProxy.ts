export function getBackendApiBase(): string {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5034/api'
  return raw.replace(/\/$/, '')
}

/** Timeout por defecto del proxy (ms). Evita que la función serverless quede colgada. */
export const PROXY_FETCH_TIMEOUT_MS = 25_000

const PROXY_RETRY_DELAY_MS = 400

function isRetryableFetchError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  if (err.name === 'TimeoutError' || err.name === 'AbortError') return true
  const msg = err.message.toLowerCase()
  return (
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('socket')
  )
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export async function fetchBackend(
  url: string,
  init: RequestInit & { timeoutMs?: number; retries?: number } = {}
): Promise<Response> {
  const { timeoutMs = PROXY_FETCH_TIMEOUT_MS, retries = 1, ...fetchInit } = init
  const maxAttempts = Math.max(1, retries + 1)

  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetch(url, {
        ...fetchInit,
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (err) {
      lastError = err
      const canRetry = attempt < maxAttempts - 1 && isRetryableFetchError(err)
      if (!canRetry) throw err
      await delay(PROXY_RETRY_DELAY_MS * (attempt + 1))
    }
  }

  throw lastError
}

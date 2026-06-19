export function getBackendApiBase(): string {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5034/api'
  return raw.replace(/\/$/, '')
}

/** Timeout por defecto del proxy (ms). Evita que la función serverless quede colgada. */
export const PROXY_FETCH_TIMEOUT_MS = 25_000

export async function fetchBackend(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = PROXY_FETCH_TIMEOUT_MS, ...fetchInit } = init
  return fetch(url, {
    ...fetchInit,
    signal: AbortSignal.timeout(timeoutMs),
  })
}

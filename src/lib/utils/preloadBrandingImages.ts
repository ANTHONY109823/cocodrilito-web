const PRELOAD_TIMEOUT_MS = 8_000

export function preloadBrandingImages(
  urls: Array<string | null | undefined>
): Promise<void> {
  const unique = [...new Set(urls.filter((url): url is string => Boolean(url)))]
  if (unique.length === 0) return Promise.resolve()

  const preloadOne = (url: string) =>
    new Promise<void>((resolve) => {
      const img = new Image()
      const finish = () => resolve()

      img.decoding = 'async'
      img.onload = finish
      img.onerror = finish
      img.src = url
    })

  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, PRELOAD_TIMEOUT_MS)
  })

  return Promise.race([Promise.all(unique.map(preloadOne)).then(() => undefined), timeout])
}

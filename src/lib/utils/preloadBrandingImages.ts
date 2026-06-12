export function preloadBrandingImages(
  urls: Array<string | null | undefined>
): Promise<void> {
  const unique = [...new Set(urls.filter((url): url is string => Boolean(url)))]
  if (unique.length === 0) return Promise.resolve()

  return Promise.all(
    unique.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = url
        })
    )
  ).then(() => undefined)
}

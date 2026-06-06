'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check } from 'lucide-react'

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=600&q=80',
    caption: 'Formación de excelencia policial',
  },
  {
    url: 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?w=600&q=80',
    caption: 'Disciplina y honor en cada paso',
  },
  {
    url: 'https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=600&q=80',
    caption: 'Miles de policías ya aprobaron',
  },
  {
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&q=80',
    caption: 'Tu futuro en la PNP empieza aquí',
  },
] as const

const FEATURES = [
  '+10,000 preguntas actualizadas',
  'Simulacros cronometrados',
  'Ranking y gamificación',
] as const

const STATS = [
  { n: '4,888', l: 'vacantes 2025' },
  { n: '80K+', l: 'postulantes/año' },
  { n: '95%', l: 'satisfacción' },
] as const

type LoginCarouselProps = {
  brandName?: string
  brandSub?: string
  logoUrl?: string | null
}

export function LoginCarousel({
  brandName = 'Simulacros.pe',
  brandSub = 'Simulador de exámenes PNP',
  logoUrl,
}: LoginCarouselProps) {
  const [current, setCurrent] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length)
  }, [])

  useEffect(() => {
    const id = window.setInterval(nextSlide, 4000)
    return () => window.clearInterval(id)
  }, [nextSlide])

  return (
    <div className="relative h-full min-h-[220px] md:min-h-0 overflow-hidden bg-[#0D1A10]">
      {SLIDES.map((slide, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.url}
          src={slide.url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[800ms] ease-in-out"
          style={{ opacity: index === current ? 0.5 : 0 }}
        />
      ))}

      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(8,14,10,0.3) 0%, rgba(8,14,10,0.1) 40%, rgba(8,14,10,0.7) 85%, rgba(8,14,10,0.95) 100%)',
        }}
      />

      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 md:p-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#318F48] text-[22px]">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-7 w-7 object-contain" />
            ) : (
              '🐊'
            )}
          </div>
          <div>
            <div className="text-xl font-bold text-white">{brandName}</div>
            <div className="text-[13px] text-[#BDFFDF]/70">{brandSub}</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-4 md:py-6">
          <h1 className="text-[28px] font-bold leading-tight text-white">
            Prepárate para ser
          </h1>
          <span className="text-[38px] font-bold leading-tight text-[#BDFFDF]">Policía</span>
          <p className="mt-3 text-sm text-white/70">
            La plataforma #1 de simulacros PNP en el Perú.
            <br />
            Aprueba con confianza.
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {FEATURES.map((text) => (
              <li key={text} className="flex items-center gap-2.5 text-[13px] text-white/80">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BDFFDF]/30 bg-[rgba(49,143,72,0.3)]">
                  <Check className="h-3.5 w-3.5 text-[#BDFFDF]" strokeWidth={3} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-[13px] italic text-[#BDFFDF]/80">
            {SLIDES[current].caption}
          </p>
          <div className="flex gap-6">
            {STATS.map(({ n, l }) => (
              <div key={l} className="text-center">
                <div className="text-xl font-bold text-[#BDFFDF]">{n}</div>
                <div className="text-[11px] text-white/50">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-1.5">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Slide ${index + 1}`}
                onClick={() => setCurrent(index)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: index === current ? 20 : 6,
                  background:
                    index === current ? '#BDFFDF' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

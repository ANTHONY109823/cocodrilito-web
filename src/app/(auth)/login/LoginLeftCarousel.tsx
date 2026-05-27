'use client'

import { useCallback, useEffect, useState } from 'react'

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=800&q=80',
    caption: 'Formación y excelencia policial',
  },
  {
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
    caption: 'Superación personal: tu meta, tu esfuerzo',
  },
  {
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedfbf?w=800&q=80',
    caption: 'Disciplina que abre puertas en la PNP',
  },
  {
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    caption: 'Estudia en equipo, crece con propósito',
  },
  {
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    caption: 'El ascenso empieza con decisión',
  },
] as const

type LoginLeftCarouselProps = {
  onSlideChange?: (index: number) => void
}

export function LoginLeftCarousel({ onSlideChange }: LoginLeftCarouselProps) {
  const [current, setCurrent] = useState(0)

  const goTo = useCallback((index: number) => {
    setCurrent(index)
    onSlideChange?.(index)
  }, [onSlideChange])

  const next = useCallback(() => {
    setCurrent((prev) => {
      const nextIndex = (prev + 1) % SLIDES.length
      onSlideChange?.(nextIndex)
      return nextIndex
    })
  }, [onSlideChange])

  useEffect(() => {
    const id = window.setInterval(next, 4500)
    return () => window.clearInterval(id)
  }, [next])

  return (
    <div className="left-carousel">
      <div className="left-carousel-track">
        {SLIDES.map((slide, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.url}
            src={slide.url}
            alt=""
            className="left-carousel-img"
            style={{ opacity: index === current ? 1 : 0 }}
          />
        ))}
        <div className="left-carousel-shade" />
        <p className="left-carousel-caption">{SLIDES[current].caption}</p>
      </div>
      <div className="slide-dots" role="tablist" aria-label="Carrusel">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === current}
            aria-label={`Imagen ${index + 1}`}
            className={`sdot${index === current ? ' on' : ''}`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  )
}

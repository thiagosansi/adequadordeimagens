'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CarouselCard } from '@/shared/types/carousel'
import type { MetaFormat } from '@/shared/types/image'
import { cn } from '@/lib/utils'

type Props = {
  cards: CarouselCard[]
  format: MetaFormat
}

export function CarouselPreviewGallery({ cards, format }: Props) {
  const processed = cards.filter((c) => c.processedUrl !== null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goTo = useCallback(
    (delta: number) => {
      setLightboxIndex((prev) => {
        if (prev === null) return null
        return (prev + delta + processed.length) % processed.length
      })
    },
    [processed.length],
  )

  useEffect(() => {
    if (lightboxIndex === null) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goTo(1)
      if (e.key === 'ArrowLeft') goTo(-1)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, closeLightbox, goTo])

  if (processed.length === 0) return null

  const aspectClass =
    format.width === format.height
      ? 'aspect-square'
      : format.height > format.width
      ? 'aspect-[4/5]'
      : 'aspect-video'

  const currentCard = lightboxIndex !== null ? processed[lightboxIndex] : null

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Preview do carrossel — {processed.length} imagem{processed.length > 1 ? 'ns' : ''} processada{processed.length > 1 ? 's' : ''}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {processed.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => setLightboxIndex(idx)}
              className={cn(
                'relative flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 transition-all hover:ring-2 hover:ring-blue-400 hover:ring-offset-1',
                aspectClass,
                'h-40',
              )}
              title={'Ver card ' + String(idx + 1).padStart(2, '0')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.processedUrl!}
                alt={'Card ' + (idx + 1)}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs font-semibold text-white">
                {String(idx + 1).padStart(2, '0')}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">Clique em uma imagem para ampliar</p>
      </div>

      {/* Lightbox */}
      {currentCard && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Counter */}
          <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-sm text-white">
            {lightboxIndex + 1} / {processed.length}
          </span>

          {/* Prev */}
          {processed.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goTo(-1) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-[85vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentCard.processedUrl!}
              alt={'Card ' + (lightboxIndex + 1)}
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {format.label} · {format.width}×{format.height}
            </div>
          </div>

          {/* Next */}
          {processed.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goTo(1) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Dot indicators */}
          {processed.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {processed.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i) }}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === lightboxIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

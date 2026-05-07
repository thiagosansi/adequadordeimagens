'use client'

import { useState } from 'react'
import type { MetaVideoFormat } from '@/shared/types/video'
import { cn } from '@/lib/utils'

type Props = {
  videoUrl: string
  format: MetaVideoFormat
  label?: string
  cropPreview?: boolean
  originalUrl?: string
}

function safeZoneLabel(format: MetaVideoFormat, side: 'top' | 'bottom'): string {
  const pct = format.safeZone?.[side]
  const isShortForm = format.category === 'stories' || format.category === 'reels'
  if (!isShortForm) return `Corte 1:1 · ${pct}%`
  return side === 'top' ? `Perfil · ${pct}%` : `CTA · ${pct}%`
}

export function VideoPreview({ videoUrl, format, label, cropPreview = false, originalUrl }: Props) {
  const [showSafeZones, setShowSafeZones] = useState(false)
  const [view, setView] = useState<'processed' | 'original'>('processed')

  // Determine active video and mode
  const hasToggle = !!originalUrl
  const isOriginalView = hasToggle && view === 'original'
  const activeUrl = isOriginalView ? originalUrl! : videoUrl
  // "Original" always shows natural size; main view uses cropPreview prop
  const activeCropPreview = isOriginalView ? false : cropPreview

  const safeZoneOverlays = showSafeZones && format.safeZone && (
    <>
      {format.safeZone.top && (
        <div
          style={{ height: `${format.safeZone.top}%` }}
          className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center bg-black/50"
        >
          <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            {safeZoneLabel(format, 'top')}
          </span>
        </div>
      )}
      {format.safeZone.bottom && (
        <div
          style={{ height: `${format.safeZone.bottom}%` }}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/50"
        >
          <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            {safeZoneLabel(format, 'bottom')}
          </span>
        </div>
      )}
    </>
  )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label ?? 'Preview'}
        </h2>
        <div className="flex items-center gap-2">
          {format.safeZone && !isOriginalView && (
            <button
              onClick={() => setShowSafeZones((v) => !v)}
              className={cn(
                'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                showSafeZones
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:text-gray-900',
              )}
            >
              Safe zones
            </button>
          )}
          {hasToggle && (
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                onClick={() => setView('processed')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  view === 'processed' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900',
                )}
              >
                Ajustada
              </button>
              <button
                onClick={() => setView('original')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  view === 'original' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900',
                )}
              >
                Original
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <div className="flex justify-center">
          {activeCropPreview ? (
            // Crop preview: video constrained to target aspect ratio with object-cover
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: `${format.width}/${format.height}`,
                maxHeight: '20rem',
                maxWidth: `calc(20rem * ${format.width} / ${format.height})`,
              }}
            >
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={activeUrl}
                controls
                className="absolute inset-0 h-full w-full object-cover"
                style={{ background: '#000' }}
              />
              {safeZoneOverlays}
            </div>
          ) : (
            // Natural size
            <div className="relative w-fit">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={activeUrl}
                controls
                className="block max-h-96 max-w-full"
                style={{ background: '#000' }}
              />
              {safeZoneOverlays}
            </div>
          )}
        </div>
        <div className="border-t border-gray-200 bg-white px-4 py-2 text-center">
          <p className="text-xs text-gray-500">
            {activeCropPreview && !isOriginalView ? 'Pré-visualização do recorte · ' : ''}{format.label} · {format.width}×{format.height} px · {format.ratio}
          </p>
        </div>
      </div>
    </div>
  )
}

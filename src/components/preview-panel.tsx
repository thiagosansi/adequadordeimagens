'use client'

import { useCallback, useRef, useState } from 'react'
import type { MetaFormat } from '@/shared/types/image'
import { cn } from '@/lib/utils'
import { computeSaliency, type SaliencyResult } from '@/lib/saliency'
import { SaliencyOverlay } from '@/components/saliency-overlay'

function safeZoneLabel(format: MetaFormat, side: 'top' | 'bottom' | 'left' | 'right'): string {
  const pct = format.safeZone?.[side]
  const isStoriesOrReels = format.category === 'stories' || format.category === 'reels'
  if (isStoriesOrReels) {
    if (side === 'top') return `Perfil · ${pct}%`
    if (side === 'bottom') return `CTA · ${pct}%`
  }
  return `Corte 1:1 · ${pct}%`
}

type Props = {
  originalUrl: string
  processedUrl: string
  format: MetaFormat
}

export function PreviewPanel({ originalUrl, processedUrl, format }: Props) {
  const [view, setView] = useState<'processed' | 'original'>('processed')
  const [showSafeZones, setShowSafeZones] = useState(false)
  const [showSaliency, setShowSaliency] = useState(false)
  const [saliencyLoading, setSaliencyLoading] = useState(false)
  const [saliencyResult, setSaliencyResult] = useState<SaliencyResult | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null)

  const handleToggleSaliency = useCallback(async () => {
    if (showSaliency) {
      setShowSaliency(false)
      return
    }
    // Switch to original view so heatmap overlays the source image
    setView('original')
    if (saliencyResult) {
      setShowSaliency(true)
      return
    }
    setSaliencyLoading(true)
    const result = await computeSaliency(originalUrl)
    setSaliencyLoading(false)
    if (result) {
      setSaliencyResult(result)
      setShowSaliency(true)
    }
  }, [showSaliency, saliencyResult, originalUrl])

  const handleImgLoad = useCallback(() => {
    const el = imgRef.current
    if (el) setImgDims({ w: el.offsetWidth, h: el.offsetHeight })
  }, [])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Preview</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSaliency}
            disabled={saliencyLoading}
            className={cn(
              'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
              showSaliency
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-600 hover:text-gray-900',
              saliencyLoading && 'opacity-60 cursor-not-allowed',
            )}
          >
            {saliencyLoading ? 'Analisando…' : 'Mapa de atenção'}
          </button>
          {format.safeZone && view === 'processed' && (
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
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        {view === 'processed' ? (
          <div className="flex flex-col items-center">
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={processedUrl}
                alt="Imagem ajustada"
                className="block max-h-96 max-w-full"
              />
              {showSafeZones && format.safeZone && (
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
                  {format.safeZone.left && (
                    <div
                      style={{ width: `${format.safeZone.left}%` }}
                      className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center bg-black/50"
                    >
                      <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white [writing-mode:vertical-lr] rotate-180">
                        {safeZoneLabel(format, 'left')}
                      </span>
                    </div>
                  )}
                  {format.safeZone.right && (
                    <div
                      style={{ width: `${format.safeZone.right}%` }}
                      className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center bg-black/50"
                    >
                      <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white [writing-mode:vertical-lr]">
                        {safeZoneLabel(format, 'right')}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="w-full border-t border-gray-200 bg-white px-4 py-2 text-center">
              <p className="text-xs text-gray-500">
                {format.label} · {format.width}×{format.height} px · {format.ratio}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-fit mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={originalUrl}
              alt="Imagem original"
              className="max-h-96 max-w-full object-contain block"
              onLoad={handleImgLoad}
            />
            {showSaliency && saliencyResult && imgDims && (
              <SaliencyOverlay
                result={saliencyResult}
                imgWidth={imgDims.w}
                imgHeight={imgDims.h}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

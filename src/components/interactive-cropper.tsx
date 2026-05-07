'use client'

import { useRef, useState, useCallback } from 'react'
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import type { MetaFormat, PixelCrop } from '@/shared/types/image'

function safeZoneLabel(format: MetaFormat, side: 'top' | 'bottom' | 'left' | 'right'): string {
  const pct = format.safeZone?.[side]
  const isStoriesOrReels = format.category === 'stories' || format.category === 'reels'
  if (isStoriesOrReels) {
    if (side === 'top') return `Perfil · ${pct}%`
    if (side === 'bottom') return `CTA · ${pct}%`
  }
  return `Corte 1:1 · ${pct}%`
}

function SafeZoneLabel({ children, vertical }: { children: string; vertical?: boolean }) {
  return (
    <span
      className={`rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white${vertical ? ' [writing-mode:vertical-lr] rotate-180' : ''}`}
    >
      {children}
    </span>
  )
}

type Props = {
  imageUrl: string
  format: MetaFormat
  onCropChange: (crop: PixelCrop) => void
}

export function InteractiveCropper({ imageUrl, format, onCropChange }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const aspectRatio = format.width / format.height

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, width, height),
      width,
      height,
    )
    setCrop(initial)
    // Emit initial crop immediately so apply works without drag
    if (imgRef.current) {
      const pixel = convertToPixelCrop(initial, imgRef.current.naturalWidth, imgRef.current.naturalHeight)
      onCropChange({
        x: Math.round(pixel.x),
        y: Math.round(pixel.y),
        width: Math.round(pixel.width),
        height: Math.round(pixel.height),
      })
    }
  }

  const handleChange = useCallback(
    (_crop: Crop, percentCrop: Crop) => {
      setCrop(percentCrop)
      if (!imgRef.current) return
      const { naturalWidth, naturalHeight } = imgRef.current
      const pixel = convertToPixelCrop(percentCrop, naturalWidth, naturalHeight)
      onCropChange({
        x: Math.round(pixel.x),
        y: Math.round(pixel.y),
        width: Math.round(pixel.width),
        height: Math.round(pixel.height),
      })
    },
    [onCropChange],
  )

  return (
    <div className="max-h-72 overflow-auto rounded-lg bg-gray-100 p-2">
      <div className="flex justify-center">
        <ReactCrop
          crop={crop}
          onChange={handleChange}
          aspect={aspectRatio}
          minWidth={50}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Imagem para recorte"
            onLoad={onImageLoad}
            style={{ maxHeight: '260px', maxWidth: '100%', objectFit: 'contain' }}
          />
          {format.safeZone && (
            <>
              {format.safeZone.top && (
                <div
                  style={{ height: `${format.safeZone.top}%` }}
                  className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center bg-black/40"
                >
                  <SafeZoneLabel>{safeZoneLabel(format, 'top')}</SafeZoneLabel>
                </div>
              )}
              {format.safeZone.bottom && (
                <div
                  style={{ height: `${format.safeZone.bottom}%` }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/40"
                >
                  <SafeZoneLabel>{safeZoneLabel(format, 'bottom')}</SafeZoneLabel>
                </div>
              )}
              {format.safeZone.left && (
                <div
                  style={{ width: `${format.safeZone.left}%` }}
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center bg-black/40"
                >
                  <SafeZoneLabel vertical>{safeZoneLabel(format, 'left')}</SafeZoneLabel>
                </div>
              )}
              {format.safeZone.right && (
                <div
                  style={{ width: `${format.safeZone.right}%` }}
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center bg-black/40"
                >
                  <SafeZoneLabel vertical>{safeZoneLabel(format, 'right')}</SafeZoneLabel>
                </div>
              )}
            </>
          )}
        </ReactCrop>
      </div>
    </div>
  )
}

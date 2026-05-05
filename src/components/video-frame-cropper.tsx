'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import type { MetaVideoFormat } from '@/shared/types/video'
import type { PixelCrop } from '@/shared/types/image'

type Props = {
  videoElement: HTMLVideoElement
  format: MetaVideoFormat
  onCropChange: (crop: PixelCrop) => void
}

export function VideoFrameCropper({ videoElement, format, onCropChange }: Props) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const aspectRatio = format.width / format.height

  useEffect(() => {
    // Draw current video frame to canvas and export as JPEG
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(videoElement, 0, 0)
    setFrameUrl(canvas.toDataURL('image/jpeg'))
  }, [videoElement])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, width, height),
      width,
      height,
    )
    setCrop(initial)
    // Emit initial crop in original video pixel coordinates
    const pixel = convertToPixelCrop(initial, videoElement.videoWidth, videoElement.videoHeight)
    onCropChange({
      x: Math.round(pixel.x),
      y: Math.round(pixel.y),
      width: Math.round(pixel.width),
      height: Math.round(pixel.height),
    })
  }

  const handleChange = useCallback(
    (_crop: Crop, percentCrop: Crop) => {
      setCrop(percentCrop)
      const pixel = convertToPixelCrop(percentCrop, videoElement.videoWidth, videoElement.videoHeight)
      onCropChange({
        x: Math.round(pixel.x),
        y: Math.round(pixel.y),
        width: Math.round(pixel.width),
        height: Math.round(pixel.height),
      })
    },
    [onCropChange, videoElement],
  )

  if (!frameUrl) return null

  return (
    <div className="max-h-72 overflow-auto rounded-lg bg-gray-100 p-2">
      <p className="mb-2 text-xs text-gray-500">
        Arraste para definir a área de recorte. O corte será aplicado em todos os frames do vídeo.
      </p>
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
            src={frameUrl}
            alt="Frame do vídeo para recorte manual"
            onLoad={onImageLoad}
            style={{ maxHeight: '260px', maxWidth: '100%', objectFit: 'contain' }}
          />
        </ReactCrop>
      </div>
    </div>
  )
}

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
        </ReactCrop>
      </div>
    </div>
  )
}

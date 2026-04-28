import type { PixelCrop } from '@/shared/types/image'

/**
 * Calculates the optimal center crop area on the source image
 * to fill the target format exactly, without distortion.
 */
export function calculateAutoCrop(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number,
): PixelCrop {
  const targetRatio = targetWidth / targetHeight
  const srcRatio = srcWidth / srcHeight

  let cropWidth: number
  let cropHeight: number

  if (srcRatio > targetRatio) {
    // Source is wider: crop sides, keep full height
    cropHeight = srcHeight
    cropWidth = Math.round(srcHeight * targetRatio)
  } else {
    // Source is taller: crop top/bottom, keep full width
    cropWidth = srcWidth
    cropHeight = Math.round(srcWidth / targetRatio)
  }

  const x = Math.round((srcWidth - cropWidth) / 2)
  const y = Math.round((srcHeight - cropHeight) / 2)

  return { x, y, width: cropWidth, height: cropHeight }
}

/**
 * Calculates dimensions and offsets to fit the source image
 * inside the target canvas (letterbox), maintaining aspect ratio.
 */
export function calculateFitDimensions(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number,
): { drawWidth: number; drawHeight: number; offsetX: number; offsetY: number } {
  const srcRatio = srcWidth / srcHeight
  const targetRatio = targetWidth / targetHeight

  let drawWidth: number
  let drawHeight: number

  if (srcRatio > targetRatio) {
    // Source wider than target: fit by width
    drawWidth = targetWidth
    drawHeight = Math.round(targetWidth / srcRatio)
  } else {
    // Source taller than target: fit by height
    drawHeight = targetHeight
    drawWidth = Math.round(targetHeight * srcRatio)
  }

  const offsetX = Math.round((targetWidth - drawWidth) / 2)
  const offsetY = Math.round((targetHeight - drawHeight) / 2)

  return { drawWidth, drawHeight, offsetX, offsetY }
}

/**
 * Calculates dimensions to cover the entire canvas (for blur background).
 * The image fills the canvas, cropping the overflow.
 */
export function calculateCoverDimensions(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number,
): { drawWidth: number; drawHeight: number; offsetX: number; offsetY: number } {
  const srcRatio = srcWidth / srcHeight
  const targetRatio = targetWidth / targetHeight

  let drawWidth: number
  let drawHeight: number

  if (srcRatio > targetRatio) {
    // Source wider: cover by height
    drawHeight = targetHeight
    drawWidth = Math.round(targetHeight * srcRatio)
  } else {
    // Source taller: cover by width
    drawWidth = targetWidth
    drawHeight = Math.round(targetWidth / srcRatio)
  }

  const offsetX = Math.round((targetWidth - drawWidth) / 2)
  const offsetY = Math.round((targetHeight - drawHeight) / 2)

  return { drawWidth, drawHeight, offsetX, offsetY }
}

/**
 * Converts a percentage-based crop to pixel coordinates.
 */
export function percentCropToPixels(
  percentCrop: { x: number; y: number; width: number; height: number },
  imgWidth: number,
  imgHeight: number,
): PixelCrop {
  return {
    x: Math.round((percentCrop.x / 100) * imgWidth),
    y: Math.round((percentCrop.y / 100) * imgHeight),
    width: Math.round((percentCrop.width / 100) * imgWidth),
    height: Math.round((percentCrop.height / 100) * imgHeight),
  }
}

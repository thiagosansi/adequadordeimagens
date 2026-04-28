import type { PixelCrop } from '@/shared/types/image'
import { calculateAutoCrop, calculateFitDimensions, calculateCoverDimensions } from './crop-calculator'

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Loads a URL into an HTMLImageElement.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

/**
 * Renders a pixel-crop of the source onto a canvas at exact target dimensions.
 * Never distorts — pure crop, no scaling artifact.
 */
export function renderCrop(
  img: HTMLImageElement,
  crop: PixelCrop,
  targetWidth: number,
  targetHeight: number,
  outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): string {
  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, targetWidth, targetHeight)
  return canvas.toDataURL(outputFormat, quality)
}

/**
 * Renders the image inside a solid-color background (letterbox/pillarbox).
 * Image is scaled to fit — never distorted.
 */
export function renderFitWithSolidBackground(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  backgroundColor: string,
  outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): string {
  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, targetWidth, targetHeight)

  const { drawWidth, drawHeight, offsetX, offsetY } = calculateFitDimensions(
    img.naturalWidth,
    img.naturalHeight,
    targetWidth,
    targetHeight,
  )
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

  return canvas.toDataURL(outputFormat, quality)
}

/**
 * Renders the image with a blurred version of itself as background.
 * Background: image scaled to cover + blur filter.
 * Foreground: image scaled to fit (sharp, centered).
 * Never distorts.
 */
export function renderFitWithBlurBackground(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): string {
  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')!

  // Background: cover mode + blur
  const cover = calculateCoverDimensions(img.naturalWidth, img.naturalHeight, targetWidth, targetHeight)
  ctx.filter = 'blur(20px) brightness(0.65)'
  ctx.drawImage(img, cover.offsetX, cover.offsetY, cover.drawWidth, cover.drawHeight)
  ctx.filter = 'none'

  // Foreground: fit mode, sharp and centered
  const fit = calculateFitDimensions(img.naturalWidth, img.naturalHeight, targetWidth, targetHeight)
  ctx.drawImage(img, fit.offsetX, fit.offsetY, fit.drawWidth, fit.drawHeight)

  return canvas.toDataURL(outputFormat, quality)
}

/**
 * Convenience: loads URL, auto-crops centered, returns data URL.
 */
export async function renderAutoCrop(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): Promise<string> {
  const img = await loadImage(imageUrl)
  const crop = calculateAutoCrop(img.naturalWidth, img.naturalHeight, targetWidth, targetHeight)
  return renderCrop(img, crop, targetWidth, targetHeight, outputFormat, quality)
}

/**
 * Estimates file size in KB from a data URL (approximate).
 */
export function estimateDataUrlSizeKB(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.round((base64.length * 3) / 4 / 1024)
}

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
 * Renders the image with its edges mirrored to fill the expanded canvas area.
 * The original image stays intact and centered — only the background is extended.
 * No distortion, no AI. Works best when the image has a consistent background.
 *
 * Strategy:
 *  1. Blurred cover as base (fills corners and removes hard edges)
 *  2. Mirror reflection fills the expanded areas above/below (or left/right)
 *  3. Gradient overlay softens the seam between mirror and original
 *  4. Original image drawn sharp on top, centered
 */
export function renderExpandWithMirror(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): string {
  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')!

  const fit = calculateFitDimensions(img.naturalWidth, img.naturalHeight, targetWidth, targetHeight)
  const { drawWidth, drawHeight, offsetX, offsetY } = fit
  const rightX = offsetX + drawWidth
  const bottomY = offsetY + drawHeight

  // ── Step 1: blurred cover as base ────────────────────────────────────────
  const cover = calculateCoverDimensions(img.naturalWidth, img.naturalHeight, targetWidth, targetHeight)
  ctx.filter = 'blur(24px) brightness(0.75)'
  ctx.drawImage(img, cover.offsetX, cover.offsetY, cover.drawWidth, cover.drawHeight)
  ctx.filter = 'none'

  // ── Step 2: mirror fills ──────────────────────────────────────────────────
  // Vertical expansion (portrait canvas, landscape image)
  if (offsetY > 0) {
    // Top mirror: reflect the top edge of the image above the seam
    ctx.save()
    ctx.beginPath()
    ctx.rect(offsetX, 0, drawWidth, offsetY)
    ctx.clip()
    ctx.translate(offsetX, offsetY)
    ctx.scale(1, -1)
    ctx.drawImage(img, 0, 0, drawWidth, drawHeight)
    ctx.restore()

    // Bottom mirror: reflect the bottom edge of the image below the seam
    ctx.save()
    ctx.beginPath()
    ctx.rect(offsetX, bottomY, drawWidth, targetHeight - bottomY)
    ctx.clip()
    ctx.translate(offsetX, bottomY)
    ctx.scale(1, -1)
    ctx.drawImage(img, 0, -drawHeight, drawWidth, drawHeight)
    ctx.restore()
  }

  // Horizontal expansion (landscape canvas, portrait image)
  if (offsetX > 0) {
    // Left mirror
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, offsetY, offsetX, drawHeight)
    ctx.clip()
    ctx.translate(offsetX, offsetY)
    ctx.scale(-1, 1)
    ctx.drawImage(img, 0, 0, drawWidth, drawHeight)
    ctx.restore()

    // Right mirror
    ctx.save()
    ctx.beginPath()
    ctx.rect(rightX, offsetY, targetWidth - rightX, drawHeight)
    ctx.clip()
    ctx.translate(rightX, offsetY)
    ctx.scale(-1, 1)
    ctx.drawImage(img, -drawWidth, 0, drawWidth, drawHeight)
    ctx.restore()
  }

  // ── Step 3: gradient blend at seams ──────────────────────────────────────
  const seamBlend = Math.min(offsetY > 0 ? offsetY : offsetX, 120) // max 120px blend zone

  if (offsetY > 0 && seamBlend > 0) {
    // Top seam blend
    const topGrad = ctx.createLinearGradient(0, 0, 0, offsetY)
    topGrad.addColorStop(0, 'rgba(0,0,0,0.35)')
    topGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = topGrad
    ctx.fillRect(0, 0, targetWidth, offsetY)

    // Bottom seam blend
    const botGrad = ctx.createLinearGradient(0, bottomY, 0, targetHeight)
    botGrad.addColorStop(0, 'rgba(0,0,0,0)')
    botGrad.addColorStop(1, 'rgba(0,0,0,0.35)')
    ctx.fillStyle = botGrad
    ctx.fillRect(0, bottomY, targetWidth, targetHeight - bottomY)
  }

  if (offsetX > 0 && seamBlend > 0) {
    // Left seam blend
    const leftGrad = ctx.createLinearGradient(0, 0, offsetX, 0)
    leftGrad.addColorStop(0, 'rgba(0,0,0,0.35)')
    leftGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = leftGrad
    ctx.fillRect(0, 0, offsetX, targetHeight)

    // Right seam blend
    const rightGrad = ctx.createLinearGradient(rightX, 0, targetWidth, 0)
    rightGrad.addColorStop(0, 'rgba(0,0,0,0)')
    rightGrad.addColorStop(1, 'rgba(0,0,0,0.35)')
    ctx.fillStyle = rightGrad
    ctx.fillRect(rightX, 0, targetWidth - rightX, targetHeight)
  }

  // ── Step 4: original image sharp on top ───────────────────────────────────
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

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

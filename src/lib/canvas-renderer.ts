import type { PixelCrop } from '@/shared/types/image'
import { calculateAutoCrop, calculateFaceAwareCrop, calculateFitDimensions, calculateCoverDimensions } from './crop-calculator'
import { detectFaces, getFocalPoint } from './face-detector'

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
 * Detects whether ctx.filter is actually applied by the browser.
 * iOS Safari < 18 accepts the assignment but silently ignores it.
 */
function ctxFilterSupported(): boolean {
  try {
    const c = createCanvas(2, 2)
    const t = c.getContext('2d')!
    t.filter = 'blur(1px)'
    return t.filter !== '' && t.filter !== 'none'
  } catch {
    return false
  }
}

/**
 * Draws a blurred background using:
 *  - ctx.filter when supported (Chrome, Firefox, Safari 18+) — sharp gaussian blur
 *  - multi-pass scale-down/up fallback for iOS Safari < 18 — smooth soft blur
 */
function drawBlurredCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  drawX: number,
  drawY: number,
  drawW: number,
  drawH: number,
  canvasW: number,
  canvasH: number,
  blurPx: number,
  brightness: number,
): void {
  if (ctxFilterSupported()) {
    // Native blur: fast and sharp
    ctx.filter = `blur(${blurPx}px) brightness(${brightness})`
    ctx.drawImage(img, drawX, drawY, drawW, drawH)
    ctx.filter = 'none'
    return
  }

  // Fallback: multi-pass scale-down → scale-up for smooth blur on all browsers
  // Each halving pass smooths out blocky artefacts from the previous pass.
  const passes = [1 / 2, 1 / 4, 1 / 8]
  let current: HTMLCanvasElement | HTMLImageElement = img
  let currentW = canvasW
  let currentH = canvasH

  // Downscale passes — draw cover image at each level
  let firstPass = true
  for (const scale of passes) {
    const pw = Math.max(1, Math.round(canvasW * scale))
    const ph = Math.max(1, Math.round(canvasH * scale))
    const pc = createCanvas(pw, ph)
    const pCtx = pc.getContext('2d')!
    pCtx.imageSmoothingEnabled = true
    pCtx.imageSmoothingQuality = 'high'
    if (firstPass) {
      const sx = pw / canvasW
      const sy = ph / canvasH
      pCtx.drawImage(img, drawX * sx, drawY * sy, drawW * sx, drawH * sy)
      firstPass = false
    } else {
      pCtx.drawImage(current as HTMLCanvasElement, 0, 0, pw, ph)
    }
    current = pc
    currentW = pw
    currentH = ph
  }

  // Single upscale to full canvas — browser smoothing creates the blur
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(current as HTMLCanvasElement, 0, 0, canvasW, canvasH)

  // Brightness overlay
  ctx.fillStyle = `rgba(0,0,0,${1 - brightness})`
  ctx.fillRect(0, 0, canvasW, canvasH)
  void currentW; void currentH
}

/**
 * Renders the image with a blurred version of itself as background.
 * Background: image scaled to cover + blur (cross-browser, no ctx.filter).
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

  const cover = calculateCoverDimensions(img.naturalWidth, img.naturalHeight, targetWidth, targetHeight)
  drawBlurredCover(ctx, img, cover.offsetX, cover.offsetY, cover.drawWidth, cover.drawHeight, targetWidth, targetHeight, 20, 0.65)

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

  // ── Step 1: blurred cover as base ─────────────────────────────────────────
  const cover = calculateCoverDimensions(img.naturalWidth, img.naturalHeight, targetWidth, targetHeight)
  drawBlurredCover(ctx, img, cover.offsetX, cover.offsetY, cover.drawWidth, cover.drawHeight, targetWidth, targetHeight, 24, 0.75)

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
 * Like renderAutoCrop but centres the crop on the detected face(s) focal point.
 * Falls back to center crop when no faces are detected.
 */
export async function renderFaceAwareCrop(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number,
  outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): Promise<{ dataUrl: string; faceCount: number; error?: string }> {
  const img = await loadImage(imageUrl)
  const { faces, error } = await detectFaces(img)
  const focal = getFocalPoint(faces)
  const crop = calculateFaceAwareCrop(img.naturalWidth, img.naturalHeight, targetWidth, targetHeight, focal)
  const dataUrl = renderCrop(img, crop, targetWidth, targetHeight, outputFormat, quality)
  return { dataUrl, faceCount: faces.length, error }
}

/**
 * Estimates file size in KB from a data URL (approximate).
 */
export function estimateDataUrlSizeKB(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.round((base64.length * 3) / 4 / 1024)
}

/**
 * Analyses whether significant content exists inside the safe zone regions.
 * Samples pixel variance in each band (top/bottom/left/right) and returns a 0–1 score per band.
 * Score > threshold means meaningful content detected in that zone.
 *
 * Works on the original image before any crop/resize.
 */
export function analyseSafeZoneContent(
  img: HTMLImageElement,
  safeZone: { top?: number; bottom?: number; left?: number; right?: number },
): { topScore: number; bottomScore: number; leftScore: number; rightScore: number } {
  const { naturalWidth: w, naturalHeight: h } = img

  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)

  function horizontalBandVariance(y0: number, y1: number): number {
    const bandH = y1 - y0
    if (bandH <= 0) return 0
    const data = ctx.getImageData(0, y0, w, bandH).data
    return computeVariance(data)
  }

  function verticalBandVariance(x0: number, x1: number): number {
    const bandW = x1 - x0
    if (bandW <= 0) return 0
    const data = ctx.getImageData(x0, 0, bandW, h).data
    return computeVariance(data)
  }

  function computeVariance(data: Uint8ClampedArray): number {
    let sum = 0
    let sumSq = 0
    const samples = data.length / 4
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!
      sum += lum
      sumSq += lum * lum
    }
    const mean = sum / samples
    const variance = sumSq / samples - mean * mean
    // normalise to 0–1 (max possible variance for 0–255 range ≈ 16256)
    return Math.min(variance / 16256, 1)
  }

  const topH = Math.round(h * ((safeZone.top ?? 0) / 100))
  const bottomStart = h - Math.round(h * ((safeZone.bottom ?? 0) / 100))
  const leftW = Math.round(w * ((safeZone.left ?? 0) / 100))
  const rightStart = w - Math.round(w * ((safeZone.right ?? 0) / 100))

  return {
    topScore: safeZone.top ? horizontalBandVariance(0, topH) : 0,
    bottomScore: safeZone.bottom ? horizontalBandVariance(bottomStart, h) : 0,
    leftScore: safeZone.left ? verticalBandVariance(0, leftW) : 0,
    rightScore: safeZone.right ? verticalBandVariance(rightStart, w) : 0,
  }
}

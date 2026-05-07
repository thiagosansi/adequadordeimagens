import type { MetaFormat, AdjustmentMode, BackgroundConfig, PixelCrop } from '@/shared/types/image'
import {
  loadImage,
  renderAutoCrop,
  renderCrop,
  renderFaceAwareCrop,
  renderFitWithSolidBackground,
  renderFitWithBlurBackground,
  renderExpandWithMirror,
} from './canvas-renderer'

export function buildExportFileName(originalFileName: string, format: MetaFormat): string {
  const base = originalFileName.replace(/\.[^.]+$/, '')
  return `${base}_${format.id}_${format.width}x${format.height}.jpg`
}

export type FormatRenderOverride = {
  mode: AdjustmentMode
  backgroundConfig: BackgroundConfig
  interactiveCrop: PixelCrop | null
}

export type BatchRenderOptions = {
  imageUrl: string
  formats: MetaFormat[]
  mode: AdjustmentMode
  backgroundConfig: BackgroundConfig
  interactiveCrop: PixelCrop | null
  overrides?: Record<string, FormatRenderOverride>
}

/**
 * Renders all selected formats and returns an array of { format, dataUrl } pairs.
 * Processes sequentially to avoid memory pressure from parallel canvas operations.
 * Per-format overrides take precedence over global mode/backgroundConfig/interactiveCrop.
 */
export async function renderAllFormats(
  options: BatchRenderOptions,
): Promise<{ format: MetaFormat; dataUrl: string }[]> {
  const { imageUrl, formats, mode, backgroundConfig, interactiveCrop, overrides } = options
  const results: { format: MetaFormat; dataUrl: string }[] = []

  // Load image once, reuse across all formats
  const img = await loadImage(imageUrl)

  for (const format of formats) {
    const override = overrides?.[format.id]
    const effectiveMode = override?.mode ?? mode
    const effectiveBackground = override?.backgroundConfig ?? backgroundConfig
    const effectiveCrop = override?.interactiveCrop ?? interactiveCrop

    let dataUrl: string

    if (effectiveMode === 'auto-crop') {
      dataUrl = await renderAutoCrop(imageUrl, format.width, format.height)
    } else if (effectiveMode === 'face-crop') {
      const result = await renderFaceAwareCrop(imageUrl, format.width, format.height)
      dataUrl = result.dataUrl
    } else if (effectiveMode === 'interactive-crop') {
      const crop = effectiveCrop ?? {
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }
      dataUrl = renderCrop(img, crop, format.width, format.height)
    } else if (effectiveMode === 'expand') {
      dataUrl = renderExpandWithMirror(img, format.width, format.height)
    } else if (effectiveMode === 'fit-solid') {
      dataUrl = renderFitWithSolidBackground(img, format.width, format.height, effectiveBackground.color)
    } else {
      dataUrl = renderFitWithBlurBackground(img, format.width, format.height)
    }

    results.push({ format, dataUrl })
  }

  return results
}

import type { MetaFormat, AdjustmentMode, BackgroundConfig, PixelCrop } from '@/shared/types/image'
import {
  loadImage,
  renderAutoCrop,
  renderCrop,
  renderFitWithSolidBackground,
  renderFitWithBlurBackground,
  renderExpandWithMirror,
} from './canvas-renderer'

export function buildExportFileName(originalFileName: string, format: MetaFormat): string {
  const base = originalFileName.replace(/\.[^.]+$/, '')
  return `${base}_${format.id}_${format.width}x${format.height}.jpg`
}

export type BatchRenderOptions = {
  imageUrl: string
  formats: MetaFormat[]
  mode: AdjustmentMode
  backgroundConfig: BackgroundConfig
  interactiveCrop: PixelCrop | null
}

/**
 * Renders all selected formats and returns an array of { format, dataUrl } pairs.
 * Processes sequentially to avoid memory pressure from parallel canvas operations.
 */
export async function renderAllFormats(
  options: BatchRenderOptions,
): Promise<{ format: MetaFormat; dataUrl: string }[]> {
  const { imageUrl, formats, mode, backgroundConfig, interactiveCrop } = options
  const results: { format: MetaFormat; dataUrl: string }[] = []

  // Load image once, reuse across all formats
  const img = await loadImage(imageUrl)

  for (const format of formats) {
    let dataUrl: string

    if (mode === 'auto-crop') {
      dataUrl = await renderAutoCrop(imageUrl, format.width, format.height)
    } else if (mode === 'interactive-crop') {
      const crop = interactiveCrop ?? {
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }
      dataUrl = renderCrop(img, crop, format.width, format.height)
    } else if (mode === 'expand') {
      dataUrl = renderExpandWithMirror(img, format.width, format.height)
    } else if (mode === 'fit-solid') {
      dataUrl = renderFitWithSolidBackground(img, format.width, format.height, backgroundConfig.color)
    } else {
      dataUrl = renderFitWithBlurBackground(img, format.width, format.height)
    }

    results.push({ format, dataUrl })
  }

  return results
}

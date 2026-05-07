import type { CarouselCard } from '@/shared/types/carousel'
import type { AdjustmentMode, BackgroundConfig, MetaFormat } from '@/shared/types/image'
import {
  loadImage,
  renderAutoCrop,
  renderFaceAwareCrop,
  renderCrop,
  renderFitWithSolidBackground,
  renderFitWithBlurBackground,
  renderExpandWithMirror,
} from './canvas-renderer'

export function buildCarouselFileName(index: number, format: MetaFormat): string {
  const num = String(index + 1).padStart(2, '0')
  return 'card-' + num + '_' + format.width + 'x' + format.height + '.jpg'
}

/**
 * Processes a single carousel card.
 * Uses individual settings if enabled, otherwise falls back to global settings.
 * "interactive-crop" as global mode falls back to auto-crop (each image needs its own crop).
 */
export async function processCard(
  card: CarouselCard,
  format: MetaFormat,
  globalMode: AdjustmentMode | null,
  globalBgConfig: BackgroundConfig,
): Promise<string> {
  const mode = card.useIndividualSettings ? card.adjustmentMode : globalMode
  const bgConfig = card.useIndividualSettings ? card.backgroundConfig : globalBgConfig

  // null or interactive-crop as global mode falls back to auto-crop
  const effectiveMode: AdjustmentMode =
    mode === null || (!card.useIndividualSettings && mode === 'interactive-crop') ? 'auto-crop' : mode

  if (effectiveMode === 'auto-crop') {
    return renderAutoCrop(card.originalUrl, format.width, format.height)
  }

  if (effectiveMode === 'face-crop') {
    const { dataUrl } = await renderFaceAwareCrop(card.originalUrl, format.width, format.height)
    return dataUrl
  }

  const img = await loadImage(card.originalUrl)

  if (effectiveMode === 'interactive-crop') {
    const crop = card.interactiveCrop ?? {
      x: 0,
      y: 0,
      width: img.naturalWidth,
      height: img.naturalHeight,
    }
    return renderCrop(img, crop, format.width, format.height)
  }

  if (effectiveMode === 'expand') {
    return renderExpandWithMirror(img, format.width, format.height)
  }

  if (effectiveMode === 'fit-solid') {
    return renderFitWithSolidBackground(img, format.width, format.height, bgConfig.color)
  }

  return renderFitWithBlurBackground(img, format.width, format.height)
}

/**
 * Processes all cards sequentially and returns updated cards with processedUrl filled.
 */
export async function processAllCards(
  cards: CarouselCard[],
  format: MetaFormat,
  globalMode: AdjustmentMode | null,
  globalBgConfig: BackgroundConfig,
  onProgress: (index: number) => void,
): Promise<CarouselCard[]> {
  const result: CarouselCard[] = []
  for (let i = 0; i < cards.length; i++) {
    onProgress(i)
    const processedUrl = await processCard(cards[i]!, format, globalMode, globalBgConfig)
    result.push({ ...cards[i]!, processedUrl })
  }
  return result
}

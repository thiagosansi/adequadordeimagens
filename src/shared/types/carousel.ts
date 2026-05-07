import type { AdjustmentMode, BackgroundConfig, PixelCrop } from './image'

export type CarouselCard = {
  id: string
  file: File
  originalUrl: string
  processedUrl: string | null
  useIndividualSettings: boolean
  adjustmentMode: AdjustmentMode | null
  backgroundConfig: BackgroundConfig
  interactiveCrop: PixelCrop | null
}

export type CarouselFormatId = 'meta-feed-square' | 'meta-feed-portrait'

import type { MetaFormat } from '@/shared/types/image'

export const META_FORMATS: MetaFormat[] = [
  {
    id: 'meta-feed-square',
    label: 'Feed Quadrado',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    useCase: 'Feed / Carrossel',
    platform: 'meta',
    category: 'feed',
  },
  {
    id: 'meta-feed-portrait',
    label: 'Feed Retrato',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    useCase: 'Feed (máximo vertical)',
    platform: 'meta',
    category: 'feed',
    safeZone: { top: 10, bottom: 10 },
  },
  {
    id: 'meta-feed-landscape',
    label: 'Feed Paisagem',
    width: 1200,
    height: 628,
    ratio: '1.91:1',
    useCase: 'Feed / Link Ads',
    platform: 'meta',
    category: 'feed',
    safeZone: { left: 24, right: 24 },
  },
  {
    id: 'meta-stories',
    label: 'Stories & Reels',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    useCase: 'Stories / Reels',
    platform: 'meta',
    category: 'stories',
    safeZone: { top: 14, bottom: 20 },
  },
]

export function findFormatById(id: string): MetaFormat | undefined {
  return META_FORMATS.find((f) => f.id === id)
}

export function getAspectRatio(format: MetaFormat): number {
  return format.width / format.height
}

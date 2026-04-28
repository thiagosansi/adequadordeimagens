import type { MetaFormat } from '@/shared/types/image'

export const META_FORMATS: MetaFormat[] = [
  {
    id: 'feed-square',
    label: 'Feed Quadrado',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    useCase: 'Feed / Carrossel',
    category: 'feed',
  },
  {
    id: 'feed-portrait',
    label: 'Feed Retrato',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    useCase: 'Feed (máximo vertical)',
    category: 'feed',
  },
  {
    id: 'feed-landscape',
    label: 'Feed Paisagem',
    width: 1200,
    height: 628,
    ratio: '1.91:1',
    useCase: 'Feed / Link Ads',
    category: 'feed',
  },
  {
    id: 'stories',
    label: 'Stories',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    useCase: 'Stories',
    category: 'stories',
    safeZone: { top: 14, bottom: 14 },
  },
  {
    id: 'reels',
    label: 'Reels',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    useCase: 'Reels',
    category: 'reels',
    safeZone: { top: 14, bottom: 14 },
  },
]

export function findFormatById(id: string): MetaFormat | undefined {
  return META_FORMATS.find((f) => f.id === id)
}

export function getAspectRatio(format: MetaFormat): number {
  return format.width / format.height
}

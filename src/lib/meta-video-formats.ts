import type { MetaVideoFormat } from '@/shared/types/video'

export const META_VIDEO_FORMATS: MetaVideoFormat[] = [
  {
    id: 'meta-video-feed-square',
    label: 'Feed Quadrado',
    width: 1080,
    height: 1080,
    ratio: '1:1',
    useCase: 'Feed / Carrossel',
    platform: 'meta',
    category: 'feed',
    minDurationSec: 1,
    maxDurationSec: 14400,
    minWidth: 600,
    minHeight: 600,
    maxFileSizeGB: 4,
  },
  {
    id: 'meta-video-feed-portrait',
    label: 'Feed Retrato',
    width: 1080,
    height: 1350,
    ratio: '4:5',
    useCase: 'Feed (máximo vertical)',
    platform: 'meta',
    category: 'feed',
    minDurationSec: 1,
    maxDurationSec: 3600,
    minWidth: 600,
    minHeight: 750,
    maxFileSizeGB: 4,
  },
  {
    id: 'meta-video-feed-landscape',
    label: 'Feed Paisagem',
    width: 1920,
    height: 1080,
    ratio: '16:9',
    useCase: 'Feed / Link Ads',
    platform: 'meta',
    category: 'feed',
    minDurationSec: 1,
    maxDurationSec: 14400,
    minWidth: 600,
    minHeight: 315,
    maxFileSizeGB: 4,
  },
  {
    id: 'meta-video-stories-reels',
    label: 'Stories & Reels',
    width: 1080,
    height: 1920,
    ratio: '9:16',
    useCase: 'Stories / Reels',
    platform: 'meta',
    category: 'stories',
    safeZone: { top: 14, bottom: 20 },
    minDurationSec: 1,
    maxDurationSec: 90,
    minWidth: 500,
    minHeight: 889,
    maxFileSizeGB: 4,
  },
]

export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov (iPhone padrão)
  'video/webm',
  'video/hevc',     // iPhone HEVC (H.265)
  'video/x-m4v',   // M4V
  'video/3gpp',    // 3GP (formatos mais antigos)
]

// Extensões aceitas como fallback quando file.type estiver vazio ou não reconhecido
export const ACCEPTED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'm4v', 'hevc', '3gp', '3gpp', 'avi']

export function isVideoFileAccepted(file: File): boolean {
  if (ACCEPTED_VIDEO_TYPES.includes(file.type)) return true
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ACCEPTED_VIDEO_EXTENSIONS.includes(ext)
}

export function findVideoFormatById(id: string): MetaVideoFormat | undefined {
  return META_VIDEO_FORMATS.find((f) => f.id === id)
}

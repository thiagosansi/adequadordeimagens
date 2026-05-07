import type { Platform } from '@/shared/types/platform'
import type { MetaFormat } from '@/shared/types/image'
import type { MetaVideoFormat } from '@/shared/types/video'
import { META_FORMATS } from './meta-formats'
import { META_VIDEO_FORMATS } from './meta-video-formats'
import { TIKTOK_IMAGE_FORMATS, TIKTOK_VIDEO_FORMATS } from './formats/tiktok'
import { GOOGLE_IMAGE_FORMATS } from './formats/google'
import { LINKEDIN_IMAGE_FORMATS, LINKEDIN_VIDEO_FORMATS } from './formats/linkedin'
import { YOUTUBE_VIDEO_FORMATS } from './formats/youtube'

export const ALL_IMAGE_FORMATS: MetaFormat[] = [
  ...META_FORMATS,
  ...TIKTOK_IMAGE_FORMATS,
  ...GOOGLE_IMAGE_FORMATS,
  ...LINKEDIN_IMAGE_FORMATS,
]

export const ALL_VIDEO_FORMATS: MetaVideoFormat[] = [
  ...META_VIDEO_FORMATS,
  ...TIKTOK_VIDEO_FORMATS,
  ...LINKEDIN_VIDEO_FORMATS,
  ...YOUTUBE_VIDEO_FORMATS,
]

export function getImageFormats(platform: Platform): MetaFormat[] {
  return ALL_IMAGE_FORMATS.filter((f) => f.platform === platform)
}

export function getVideoFormats(platform: Platform): MetaVideoFormat[] {
  return ALL_VIDEO_FORMATS.filter((f) => f.platform === platform)
}

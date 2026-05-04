import type { Platform } from '@/shared/types/platform'

type PlatformRules = {
  /** Shown in the requirements checklist header, e.g. "Meta Ads" */
  label: string
  /** Max file size the platform accepts (MB) */
  maxFileSizeMB: number
  /** Minimum acceptable short-side resolution of the source image (px) */
  minDimensionPx: number
  /** MIME types accepted by the platform */
  acceptedMimeTypes: string[]
  /** Platform name used in human-readable messages, e.g. "Meta", "LinkedIn" */
  platformName: string
  /** Description of what covers the safe zone on this platform (for warning messages) */
  safeZoneCoveredBy: string
}

const PLATFORM_RULES: Record<Platform, PlatformRules> = {
  meta: {
    label: 'Meta Ads',
    maxFileSizeMB: 30,
    minDimensionPx: 600,
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    platformName: 'Meta',
    safeZoneCoveredBy: 'interface do Meta (perfil, CTA, áudio)',
  },
  linkedin: {
    label: 'LinkedIn Ads',
    maxFileSizeMB: 5,
    minDimensionPx: 400,
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    platformName: 'LinkedIn',
    safeZoneCoveredBy: 'interface do LinkedIn',
  },
  tiktok: {
    label: 'TikTok Ads',
    maxFileSizeMB: 10,
    minDimensionPx: 720,
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    platformName: 'TikTok',
    safeZoneCoveredBy: 'interface do TikTok (perfil, CTA, áudio)',
  },
  google: {
    label: 'Google Ads',
    maxFileSizeMB: 5,
    minDimensionPx: 300,
    acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    platformName: 'Google Ads',
    safeZoneCoveredBy: 'interface do Google Ads',
  },
  youtube: {
    label: 'YouTube',
    maxFileSizeMB: 2,
    minDimensionPx: 640,
    acceptedMimeTypes: ['image/jpeg', 'image/png'],
    platformName: 'YouTube',
    safeZoneCoveredBy: 'interface do YouTube',
  },
}

export function getPlatformRules(platform: Platform): PlatformRules {
  return PLATFORM_RULES[platform]
}

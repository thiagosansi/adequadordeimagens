export type Platform = 'meta' | 'tiktok' | 'google' | 'linkedin' | 'youtube'

export type PlatformMeta = {
  id: Platform
  label: string
  color: string        // Tailwind bg color for active state
  textColor: string    // Tailwind text color for active state
  borderColor: string  // Tailwind border color for active state
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: 'meta',
    label: 'Meta',
    color: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: 'bg-gray-900',
    textColor: 'text-white',
    borderColor: 'border-gray-900',
  },
  {
    id: 'google',
    label: 'Google Ads',
    color: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-500',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-600',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    color: 'bg-red-50',
    textColor: 'text-red-600',
    borderColor: 'border-red-500',
  },
]

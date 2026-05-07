import type { MetaFormat } from '@/shared/types/image'

// Google Display & YouTube image formats
// Display Network safe zone: keep 5% margin from all edges (text/logo area)
export const GOOGLE_IMAGE_FORMATS: MetaFormat[] = [
  // Responsive Display (most common — flexible assets)
  {
    id: 'google-landscape',
    label: 'Paisagem',
    width: 1200,
    height: 628,
    ratio: '1.91:1',
    useCase: 'Responsive Display / Discovery',
    platform: 'google',
    category: 'display',
  },
  {
    id: 'google-square',
    label: 'Quadrado',
    width: 1200,
    height: 1200,
    ratio: '1:1',
    useCase: 'Responsive Display / Discovery',
    platform: 'google',
    category: 'display',
  },
  // Fixed Display sizes
  {
    id: 'google-medium-rectangle',
    label: 'Retângulo Médio',
    width: 300,
    height: 250,
    ratio: '6:5',
    useCase: 'Display (300×250)',
    platform: 'google',
    category: 'display',
  },
  {
    id: 'google-leaderboard',
    label: 'Leaderboard',
    width: 728,
    height: 90,
    ratio: '8.1:1',
    useCase: 'Display (728×90)',
    platform: 'google',
    category: 'display',
  },
  {
    id: 'google-half-page',
    label: 'Meia Página',
    width: 300,
    height: 600,
    ratio: '1:2',
    useCase: 'Display (300×600)',
    platform: 'google',
    category: 'display',
  },
  {
    id: 'google-skyscraper',
    label: 'Skyscraper',
    width: 160,
    height: 600,
    ratio: '4:15',
    useCase: 'Display (160×600)',
    platform: 'google',
    category: 'display',
  },
  // YouTube thumbnail
  {
    id: 'google-youtube-thumbnail',
    label: 'YouTube Thumb',
    width: 1280,
    height: 720,
    ratio: '16:9',
    useCase: 'Miniatura do YouTube',
    platform: 'google',
    category: 'youtube',
  },
]

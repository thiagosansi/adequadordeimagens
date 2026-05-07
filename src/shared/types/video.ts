import type { RequirementStatus } from './image'
import type { Platform } from './platform'

export type MetaVideoFormat = {
  id: string
  label: string
  width: number
  height: number
  ratio: string
  useCase: string
  platform: Platform
  category: string
  safeZone?: { top?: number; bottom?: number; left?: number; right?: number }
  minDurationSec: number
  maxDurationSec: number
  minWidth: number
  minHeight: number
  maxFileSizeGB: number
}

export type VideoMetadata = {
  width: number
  height: number
  durationSec: number
  fileSizeMB: number
  mimeType: string
}

export type VideoRequirement = {
  id: string
  label: string
  status: RequirementStatus
  message: string
}

export type VideoProcessorType = 'canvas' | 'ffmpeg'

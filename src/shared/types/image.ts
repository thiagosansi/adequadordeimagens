export type MetaFormat = {
  id: string
  label: string
  width: number
  height: number
  ratio: string
  useCase: string
  category: 'feed' | 'stories' | 'reels'
  safeZone?: { top: number; bottom: number }
}

export type AdjustmentMode = 'auto-crop' | 'interactive-crop' | 'fit-solid' | 'fit-blur' | 'expand'

export type BackgroundConfig = {
  type: 'solid' | 'blur'
  color: string
}

export type PixelCrop = {
  x: number
  y: number
  width: number
  height: number
}

export type RequirementStatus = 'pass' | 'fail' | 'warning'

export type Requirement = {
  id: string
  label: string
  status: RequirementStatus
  message: string
}

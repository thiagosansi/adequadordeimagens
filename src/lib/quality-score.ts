import type { Requirement } from '@/shared/types/image'
import type { ImageAnalysis } from './image-analyser'

export type QualityGrade = 'A' | 'B' | 'C' | 'D'

export type QualityScore = {
  score: number
  grade: QualityGrade
  deductions: { reason: string; points: number }[]
  bonuses: { reason: string; points: number }[]
}

const FAIL_DEDUCTION      = 20
const WARNING_DEDUCTION   = 8
const TEXT_FAIL_DEDUCTION = 20
const TEXT_WARN_DEDUCTION = 8
const TEXT_WARN_THRESHOLD = 15  // %
const TEXT_FAIL_THRESHOLD = 20  // %

// Image quality thresholds
const CONTRAST_GOOD  = 0.55
const CONTRAST_POOR  = 0.25
const SAT_GOOD       = 0.50
const SAT_POOR       = 0.20
const BRIGHT_OK_LOW  = 0.40
const BRIGHT_OK_HIGH = 0.75

export function calculateQualityScore(
  requirements: Requirement[],
  textCoveragePercent?: number,
  imageAnalysis?: ImageAnalysis | null,
): QualityScore {
  let score = 100
  const deductions: { reason: string; points: number }[] = []
  const bonuses: { reason: string; points: number }[] = []

  // ── Requirements ──────────────────────────────────────────────────────────
  for (const req of requirements) {
    if (req.status === 'fail') {
      score -= FAIL_DEDUCTION
      deductions.push({ reason: req.label, points: FAIL_DEDUCTION })
    } else if (req.status === 'warning') {
      score -= WARNING_DEDUCTION
      deductions.push({ reason: req.label, points: WARNING_DEDUCTION })
    }
  }

  // ── Text coverage ─────────────────────────────────────────────────────────
  if (textCoveragePercent !== undefined) {
    if (textCoveragePercent > TEXT_FAIL_THRESHOLD) {
      score -= TEXT_FAIL_DEDUCTION
      deductions.push({ reason: `Texto: ${textCoveragePercent}% (limite Meta é 20%)`, points: TEXT_FAIL_DEDUCTION })
    } else if (textCoveragePercent > TEXT_WARN_THRESHOLD) {
      score -= TEXT_WARN_DEDUCTION
      deductions.push({ reason: `Texto: ${textCoveragePercent}% (próximo do limite)`, points: TEXT_WARN_DEDUCTION })
    }
  }

  // ── Image quality (contrast + saturation + brightness) ────────────────────
  if (imageAnalysis) {
    const { contrastScore, saturationScore, brightnessScore } = imageAnalysis

    if (contrastScore < CONTRAST_POOR) {
      score -= 10
      deductions.push({ reason: 'Contraste baixo — imagem pode passar despercebida no feed', points: 10 })
    } else if (contrastScore >= CONTRAST_GOOD) {
      score = Math.min(100, score + 5)
      bonuses.push({ reason: 'Alto contraste — boa visibilidade no feed', points: 5 })
    }

    if (saturationScore < SAT_POOR) {
      score -= 8
      deductions.push({ reason: 'Saturação baixa — cores apagadas tendem a ter menor CTR', points: 8 })
    } else if (saturationScore >= SAT_GOOD) {
      score = Math.min(100, score + 5)
      bonuses.push({ reason: 'Cores vibrantes — associadas a maior stop-scroll', points: 5 })
    }

    if (brightnessScore < BRIGHT_OK_LOW) {
      score -= 6
      deductions.push({ reason: 'Imagem muito escura — pode perder visibilidade', points: 6 })
    } else if (brightnessScore > BRIGHT_OK_HIGH) {
      score -= 6
      deductions.push({ reason: 'Imagem muito clara — risco de baixo contraste', points: 6 })
    }
  }

  score = Math.max(0, score)

  return { score, grade: scoreToGrade(score), deductions, bonuses }
}

function scoreToGrade(score: number): QualityGrade {
  if (score >= 88) return 'A'
  if (score >= 72) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

export const GRADE_META: Record<QualityGrade, { label: string; color: string; bg: string; border: string }> = {
  A: { label: 'Ótimo',    color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300' },
  B: { label: 'Bom',      color: 'text-lime-700',  bg: 'bg-lime-50',  border: 'border-lime-300'  },
  C: { label: 'Regular',  color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' },
  D: { label: 'Crítico',  color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-300'   },
}
